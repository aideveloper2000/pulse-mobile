import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Shuffle } from 'lucide-react-native';
import type { Track } from '../lib/types';
import { fetchTracksByGenre } from '../lib/api';
import { pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { genreColor } from '../components/Cards';
import { TrackList } from '../components/TrackList';
import { PlaylistPicker } from '../components/PlaylistPicker';
import { colors, radii, spacing, type } from '../theme';

export function GenreScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const genre = String(route.params?.genre ?? '');
  const insets = useSafeAreaInsets();
  const play = usePlayer((s) => s.play);
  const playShuffled = usePlayer((s) => s.playShuffled);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerTrackId, setPickerTrackId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTracks(await fetchTracksByGenre(genre, 60));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load genre');
    } finally {
      setLoading(false);
    }
  }, [genre]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <ChevronLeft size={26} color={colors.fg} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: genreColor(genre) }]}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {genre}
            </Text>
            <Text style={styles.heroMeta}>{pluralise(tracks.length, 'track')}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => tracks.length && play(tracks, 0)}
              disabled={!tracks.length}
              style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.9 }]}
            >
              <Play size={18} color={colors.accentInk} fill={colors.accentInk} />
              <Text style={styles.playText}>Play all</Text>
            </Pressable>
            <Pressable
              onPress={() => tracks.length && playShuffled(tracks)}
              disabled={!tracks.length}
              style={({ pressed }) => [styles.shuffleBtn, pressed && { opacity: 0.8 }]}
            >
              <Shuffle size={16} color={colors.fg} />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </Pressable>
          </View>

          <TrackList
            tracks={tracks}
            emptyMessage="No tracks in this genre yet"
            onAddToPlaylist={(track) => setPickerTrackId(track.id)}
            onPlayNext={(track) => usePlayer.getState().playNext(track)}
          />
        </ScrollView>
      )}

      <PlaylistPicker
        visible={pickerTrackId !== null}
        trackId={pickerTrackId}
        onClose={() => setPickerTrackId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerBtn: { width: 40, alignItems: 'center', padding: spacing.xs },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  hero: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroTitle: { ...type.display, color: '#ffffff', fontSize: 26 },
  heroMeta: { ...type.bodySm, color: 'rgba(255,255,255,0.85)' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  playText: { ...type.bodySm, color: colors.accentInk, fontWeight: '800' },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  shuffleText: { ...type.bodySm, color: colors.fg, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...type.bodySm, color: colors.danger, textAlign: 'center' },
  backBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
});
