import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Heart,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import { usePlayer } from '../store/player';
import { useLikes } from '../store/likes';
import { useAuthUser } from '../lib/useAuth';
import { Artwork } from './Artwork';
import { Slider } from './Slider';
import { colors, radii, spacing, type } from '../theme';
import { formatElapsed } from '../lib/format';

export function FullPlayer() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const user = useAuthUser();

  const current = usePlayer((s) => s.queue[s.order[s.index]] ?? null);
  const queue = usePlayer((s) => s.queue);
  const order = usePlayer((s) => s.order);
  const index = usePlayer((s) => s.index);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const progressMs = usePlayer((s) => s.progressMs);
  const durationMs = usePlayer((s) => s.durationMs);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);

  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const jumpTo = usePlayer((s) => s.jumpTo);
  const removeAt = usePlayer((s) => s.removeAt);

  const ids = useLikes((s) => s.ids);
  const toggleLike = useLikes((s) => s.toggle);
  const [tab, setTab] = useState<'track' | 'queue'>('track');

  if (!current) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.emptyTitle}>Nothing playing</Text>
        <Text style={styles.emptyText}>Pick a song to start the queue.</Text>
      </View>
    );
  }

  const shownDuration = durationMs > 0 ? durationMs : current.duration_ms ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <ChevronDown size={26} color={colors.fg} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.tabs}>
        <Pressable onPress={() => setTab('track')} style={styles.tab}>
          <Text style={[styles.tabLabel, tab === 'track' && styles.tabLabelActive]}>Song</Text>
          {tab === 'track' ? <View style={styles.tabIndicator} /> : null}
        </Pressable>
        <Pressable onPress={() => setTab('queue')} style={styles.tab}>
          <Text style={[styles.tabLabel, tab === 'queue' && styles.tabLabelActive]}>Queue</Text>
          {tab === 'queue' ? <View style={styles.tabIndicator} /> : null}
        </Pressable>
      </View>

      {tab === 'track' ? (
        <ScrollView
          contentContainerStyle={styles.trackPane}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.artWrap}>
            <Artwork
              src={current.cover_url}
              title={current.title}
              seed={current.id}
              radius={radii.xl}
              style={styles.art}
              fontSize={56}
            />
          </View>

          <View style={styles.titleRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={2}>
                {current.title}
              </Text>
              <Pressable
                onPress={() =>
                  current.artist_id
                    ? navigation.navigate('Artist', { id: current.artist_id })
                    : undefined
                }
              >
                <Text style={styles.artist} numberOfLines={1}>
                  {current.artist?.name ?? 'Unknown Artist'}
                </Text>
              </Pressable>
            </View>
            {user ? (
              <Pressable
                onPress={() => void toggleLike(user.id, current.id)}
                hitSlop={10}
                style={styles.likeBtn}
              >
                <Heart
                  size={24}
                  color={ids.has(current.id) ? colors.accent : colors.muted}
                  fill={ids.has(current.id) ? colors.accent : 'transparent'}
                />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.progressBlock}>
            <Slider
              value={progressMs}
              minimumValue={0}
              maximumValue={Math.max(1000, shownDuration)}
              onSlidingComplete={(v) => seek(v)}
            />
            <View style={styles.times}>
              <Text style={styles.time}>{formatElapsed(progressMs)}</Text>
              <Text style={styles.time}>{formatElapsed(shownDuration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable onPress={toggleShuffle} hitSlop={10} style={styles.sideBtn}>
              <Shuffle size={20} color={shuffle ? colors.accent : colors.fg} />
              {shuffle ? <View style={styles.sideDot} /> : null}
            </Pressable>
            <Pressable onPress={prev} hitSlop={10} style={styles.sideBtn}>
              <SkipBack size={28} color={colors.fg} fill={colors.fg} />
            </Pressable>
            <Pressable onPress={toggle} style={styles.playBtn}>
              {isPlaying ? (
                <Pause size={30} color={colors.accentInk} fill={colors.accentInk} />
              ) : (
                <Play size={30} color={colors.accentInk} fill={colors.accentInk} />
              )}
            </Pressable>
            <Pressable onPress={() => next()} hitSlop={10} style={styles.sideBtn}>
              <SkipForward size={28} color={colors.fg} fill={colors.fg} />
            </Pressable>
            <Pressable onPress={cycleRepeat} hitSlop={10} style={styles.sideBtn}>
              {repeat === 'one' ? (
                <Repeat1 size={20} color={colors.accent} />
              ) : (
                <Repeat size={20} color={repeat === 'all' ? colors.accent : colors.fg} />
              )}
              {repeat !== 'off' ? <View style={styles.sideDot} /> : null}
            </Pressable>
          </View>

          <View style={styles.volumeRow}>
            <Pressable onPress={toggleMute} hitSlop={10}>
              {muted || volume === 0 ? (
                <VolumeX size={18} color={colors.muted} />
              ) : (
                <Volume2 size={18} color={colors.muted} />
              )}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Slider
                value={muted ? 0 : volume}
                minimumValue={0}
                maximumValue={1}
                height={3}
                onSlidingComplete={(v) => setVolume(v)}
                thumbColor={colors.fg}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.queuePane}
          showsVerticalScrollIndicator={false}
        >
          {order.map((queueIndex, orderPos) => {
            const track = queue[queueIndex];
            if (!track) return null;
            const isCurrent = orderPos === index;
            return (
              <Pressable
                key={`${queueIndex}-${orderPos}`}
                onPress={() => jumpTo(orderPos)}
                style={({ pressed }) => [
                  styles.queueRow,
                  pressed && { backgroundColor: colors.raised },
                ]}
              >
                <Artwork
                  src={track.cover_url}
                  title={track.title}
                  seed={track.id}
                  radius={radii.sm}
                  style={styles.queueArt}
                  fontSize={12}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.queueTitle, isCurrent && { color: colors.accent }]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text style={styles.queueArtist} numberOfLines={1}>
                    {track.artist?.name ?? 'Unknown Artist'}
                  </Text>
                </View>
                {isCurrent ? (
                  <View style={styles.eq}>
                    <View style={[styles.eqBar, { height: 12 }]} />
                    <View style={[styles.eqBar, { height: 18 }]} />
                    <View style={[styles.eqBar, { height: 9 }]} />
                  </View>
                ) : null}
                <Pressable
                  onPress={() => removeAt(queueIndex)}
                  hitSlop={10}
                  style={styles.iconBtn}
                >
                  <X size={16} color={colors.faint} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerBtn: { width: 38, alignItems: 'flex-start' },
  headerCenter: { alignItems: 'center' },
  headerLabel: { ...type.label, color: colors.faint },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.sm,
  },
  tab: { paddingVertical: spacing.sm, alignItems: 'center', gap: 4 },
  tabLabel: { ...type.bodySm, color: colors.muted, fontWeight: '600' },
  tabLabelActive: { color: colors.fg },
  tabIndicator: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  trackPane: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  artWrap: { alignItems: 'center', paddingTop: spacing.md },
  art: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: radii.xl,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { ...type.title, color: colors.fg },
  artist: { ...type.body, color: colors.muted, marginTop: 4 },
  likeBtn: { padding: spacing.sm },
  progressBlock: { gap: spacing.sm },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { ...type.caption, color: colors.faint, fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  sideBtn: { padding: spacing.md, alignItems: 'center' },
  sideDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 5,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1ee06f',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  queuePane: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: 2,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  queueArt: { width: 42, height: 42 },
  queueTitle: { ...type.bodySm, color: colors.fg, fontWeight: '600' },
  queueArtist: { ...type.caption, color: colors.muted },
  eq: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 18, marginRight: spacing.sm },
  eqBar: { width: 3, backgroundColor: colors.accent, borderRadius: 2 },
  iconBtn: { padding: spacing.xs },
  empty: { flex: 1, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyTitle: { ...type.title, color: colors.fg },
  emptyText: { ...type.bodySm, color: colors.muted },
});
