import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Pause, Play, SkipForward } from 'lucide-react-native';
import { usePlayer } from '../store/player';
import { Artwork } from './Artwork';
import { colors, radii, spacing, type } from '../theme';

export function MiniPlayer() {
  const navigation = useNavigation<any>();
  const current = usePlayer((s) => s.queue[s.order[s.index]] ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const progress = usePlayer((s) => s.progressMs);
  const duration = usePlayer((s) => s.durationMs);

  if (!current) return null;
  const ratio = duration > 0 ? Math.min(1, progress / duration) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      </View>
      <Pressable
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.85 }]}
        onPress={() => navigation.navigate('Player')}
      >
        <Artwork
          src={current.cover_url}
          title={current.title}
          seed={current.id}
          radius={radii.sm}
          style={styles.art}
          fontSize={13}
        />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={1}>
            {current.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {current.artist?.name ?? 'Unknown Artist'}
          </Text>
        </View>
        <Pressable onPress={toggle} hitSlop={10} style={styles.control}>
          {isPlaying ? (
            <Pause size={24} color={colors.fg} fill={colors.fg} />
          ) : (
            <Play size={24} color={colors.fg} fill={colors.fg} />
          )}
        </Pressable>
        <Pressable onPress={() => next()} hitSlop={10} style={styles.control}>
          <SkipForward size={22} color={colors.fg} fill={colors.fg} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.raised,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.accent,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  art: { width: 42, height: 42 },
  meta: { flex: 1, minWidth: 0, gap: 1 },
  title: { ...type.bodySm, color: colors.fg, fontWeight: '600' },
  artist: { ...type.caption, color: colors.muted },
  control: { padding: spacing.xs },
});
