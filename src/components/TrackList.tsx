import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, MoreHorizontal } from 'lucide-react-native';
import type { Track } from '../lib/types';
import { formatDuration } from '../lib/format';
import { usePlayer } from '../store/player';
import { useLikes } from '../store/likes';
import { useAuthUser } from '../lib/useAuth';
import { Artwork } from './Artwork';
import { OptionsSheet, type SheetOption } from './OptionsSheet';
import { colors, radii, spacing, type } from '../theme';

interface TrackListProps {
  tracks: Track[];
  onPlay?: (track: Track, index: number) => void;
  onRemove?: (track: Track, index: number) => void;
  onPlayNext?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  emptyMessage?: string;
  showIndex?: boolean;
}

export function TrackList({
  tracks,
  onPlay,
  onRemove,
  onPlayNext,
  onAddToPlaylist,
  emptyMessage = 'Nothing here yet',
  showIndex = false,
}: TrackListProps) {
  const play = usePlayer((s) => s.play);
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);

  if (!tracks.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const handlePlay = (track: Track, index: number) => {
    if (onPlay) onPlay(track, index);
    else play(tracks, index);
  };

  const optionsFor = (track: Track, index: number): SheetOption[] => {
    const opts: SheetOption[] = [];
    if (onAddToPlaylist) {
      opts.push({ key: 'add', label: 'Add to playlist', onPress: () => onAddToPlaylist(track) });
    }
    if (onPlayNext) {
      opts.push({ key: 'next', label: 'Play next', onPress: () => onPlayNext(track) });
    }
    if (onRemove) {
      opts.push({
        key: 'remove',
        label: 'Remove',
        destructive: true,
        onPress: () => onRemove(track, index),
      });
    }
    return opts;
  };

  return (
    <View style={styles.wrap}>
      {tracks.map((track, index) => (
        <TrackRow
          key={`${track.id}-${index}`}
          track={track}
          index={index}
          showIndex={showIndex}
          onPress={() => handlePlay(track, index)}
          onMenu={() => setMenuTrack(track)}
        />
      ))}
      <MenuBridge
        track={menuTrack}
        index={menuTrack ? tracks.findIndex((t) => t.id === menuTrack.id) : -1}
        optionsFor={optionsFor}
        onClose={() => setMenuTrack(null)}
      />
    </View>
  );
}

function MenuBridge({
  track,
  index,
  optionsFor,
  onClose,
}: {
  track: Track | null;
  index: number;
  optionsFor: (track: Track, index: number) => SheetOption[];
  onClose: () => void;
}) {
  if (!track || index < 0) return <OptionsSheet visible={false} options={[]} onClose={onClose} />;
  return (
    <OptionsSheet
      visible
      title={track.title}
      options={optionsFor(track, index)}
      onClose={onClose}
    />
  );
}

interface TrackRowProps {
  track: Track;
  index: number;
  showIndex: boolean;
  onPress: () => void;
  onMenu: () => void;
}

function TrackRow({ track, index, showIndex, onPress, onMenu }: TrackRowProps) {
  const user = useAuthUser();
  const ids = useLikes((s) => s.ids);
  const toggle = useLikes((s) => s.toggle);
  const isLiked = ids.has(track.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.raised }]}
    >
      {showIndex ? (
        <Text style={styles.index}>{index + 1}</Text>
      ) : (
        <Artwork
          src={track.cover_url}
          title={track.title}
          seed={track.id}
          radius={radii.sm}
          style={styles.art}
          fontSize={14}
        />
      )}
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {track.artist?.name ?? 'Unknown Artist'}
          {track.album ? ` · ${track.album.title}` : ''}
        </Text>
      </View>
      {user ? (
        <Pressable
          onPress={() => void toggle(user.id, track.id)}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Heart
            size={18}
            color={isLiked ? colors.accent : colors.faint}
            fill={isLiked ? colors.accent : 'transparent'}
          />
        </Pressable>
      ) : null}
      <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
      <Pressable onPress={onMenu} hitSlop={10} style={styles.iconBtn}>
        <MoreHorizontal size={18} color={colors.faint} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  index: {
    ...type.bodySm,
    color: colors.faint,
    width: 22,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  art: { width: 46, height: 46 },
  meta: { flex: 1, minWidth: 0, gap: 2 },
  title: { ...type.bodySm, color: colors.fg, fontWeight: '600' },
  subtitle: { ...type.caption, color: colors.muted },
  duration: {
    ...type.caption,
    color: colors.faint,
    fontVariant: ['tabular-nums'],
    width: 48,
    textAlign: 'right',
  },
  iconBtn: { padding: spacing.xs },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...type.bodySm, color: colors.muted },
});
