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
import type { Album, Track } from '../lib/types';
import { fetchAlbum, fetchAlbumTracks } from '../lib/api';
import { formatCount, pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { Artwork } from '../components/Artwork';
import { TrackList } from '../components/TrackList';
import { PlaylistPicker } from '../components/PlaylistPicker';
import { colors, radii, spacing, type } from '../theme';

export function AlbumScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = Number(route.params?.id);
  const insets = useSafeAreaInsets();
  const play = usePlayer((s) => s.play);
  const playShuffled = usePlayer((s) => s.playShuffled);
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerTrackId, setPickerTrackId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [a, t] = await Promise.all([fetchAlbum(id), fetchAlbumTracks(id)]);
      setAlbum(a);
      setTracks(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load album');
    } finally {
      setLoading(false);
    }
  }, [id]);

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
      ) : error || !album ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Album not found'}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Artwork
              src={album.cover_url}
              title={album.title}
              seed={album.id}
              radius={radii.xl}
              style={styles.cover}
              fontSize={48}
            />
            <Text style={styles.title} numberOfLines={2}>
              {album.title}
            </Text>
            <Pressable
              onPress={() =>
                album.artist_id ? navigation.navigate('Artist', { id: album.artist_id }) : undefined
              }
            >
              <Text style={styles.artist} numberOfLines={1}>
                {album.artist?.name ?? 'Unknown Artist'}
              </Text>
            </Pressable>
            <Text style={styles.meta}>
              {[album.release_year, album.genre].filter(Boolean).join(' · ')}
            </Text>
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
            emptyMessage="No tracks on this album"
            onAddToPlaylist={(track) => setPickerTrackId(track.id)}
            onPlayNext={(track) => usePlayer.getState().playNext(track)}
          />
          <Text style={styles.count}>
            {pluralise(tracks.length, 'track')}
            {tracks.length && tracks[0].plays_count
              ? ` · ${formatCount(tracks.reduce((sum, t) => sum + (t.plays_count ?? 0), 0))} plays`
              : ''}
          </Text>
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
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  cover: { width: 210, height: 210 },
  title: { ...type.title, color: colors.fg, textAlign: 'center' },
  artist: { ...type.body, color: colors.accent, fontWeight: '600' },
  meta: { ...type.bodySm, color: colors.muted },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.lg,
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
  count: { ...type.caption, color: colors.faint, textAlign: 'center', marginTop: spacing.lg },
});
