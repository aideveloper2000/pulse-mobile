import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, TrendingUp } from 'lucide-react-native';
import type { Album, Track } from '../lib/types';
import type { ArtistStat, GenreStat } from '../lib/api';
import {
  fetchArtistStats,
  fetchGenreStats,
  fetchNewAlbums,
  fetchRecentPlays,
  fetchTracksByGenre,
  fetchTrending,
  fetchAlbumTracks,
} from '../lib/api';
import { greeting, pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useLikes } from '../store/likes';
import { useAuthUser } from '../lib/useAuth';
import { Artwork } from '../components/Artwork';
import { AlbumCard, ArtistCard, GenreCard, GenreMixCard, Section } from '../components/Cards';
import { TrackList } from '../components/TrackList';
import { colors, radii, spacing, type } from '../theme';

type QuickPick =
  | { kind: 'track'; id: number; track: Track }
  | { kind: 'album'; id: number; album: Album };

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthUser();
  const play = usePlayer((s) => s.play);
  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Album[]>([]);
  const [artists, setArtists] = useState<ArtistStat[]>([]);
  const [genres, setGenres] = useState<GenreStat[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mixBusy, setMixBusy] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [trend, fresh, art, gen] = await Promise.all([
        fetchTrending(12),
        fetchNewAlbums(10),
        fetchArtistStats(10),
        fetchGenreStats(),
      ]);
      setTrending(trend);
      setNewReleases(fresh);
      setArtists(art);
      setGenres(gen);
      if (user) {
        const rec = await fetchRecentPlays(user.id, 8);
        setRecent(rec);
      } else {
        setRecent([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (user) void useLikes.getState().load(user.id);
  }, [user?.id]);

  const quickPicks = useMemo<QuickPick[]>(() => {
    const picks: QuickPick[] = recent.slice(0, 6).map((track) => ({
      kind: 'track',
      id: track.id,
      track,
    }));
    if (picks.length < 6) {
      for (const album of newReleases) {
        if (picks.length >= 6) break;
        picks.push({ kind: 'album', id: album.id, album });
      }
    }
    return picks;
  }, [recent, newReleases]);

  const handleQuickPick = (pick: QuickPick) => {
    if (pick.kind === 'track') {
      const trackIndex = recent.findIndex((t) => t.id === pick.track.id);
      if (trackIndex >= 0) play(recent, trackIndex);
      else usePlayer.getState().playSingle(pick.track);
    } else {
      navigation.navigate('Album', { id: pick.album.id });
    }
  };

  const playMix = async (genre: string) => {
    if (mixBusy) return;
    setMixBusy(genre);
    try {
      const tracks = await fetchTracksByGenre(genre, 40);
      if (tracks.length) play(tracks, 0);
    } catch {
      // ignore
    } finally {
      setMixBusy(null);
    }
  };

  const playAlbum = async (album: Album) => {
    try {
      const albumTracks = await fetchAlbumTracks(album.id);
      if (albumTracks.length) play(albumTracks, 0);
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.raised}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting()}</Text>
        {user ? (
          <Text style={styles.user} numberOfLines={1}>
            {user.user_metadata?.display_name ?? user.email}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.quickGrid}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={styles.skeletonTile} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.quickGrid}>
            {quickPicks.map((pick) => {
              const id = pick.id;
              const title = pick.kind === 'track' ? pick.track.title : pick.album.title;
              const subtitle =
                pick.kind === 'track'
                  ? (pick.track.artist?.name ?? 'Unknown Artist')
                  : (pick.album.artist?.name ?? 'Unknown Artist');
              const cover = pick.kind === 'track' ? pick.track.cover_url : pick.album.cover_url;
              return (
                <Pressable
                  key={id}
                  onPress={() => handleQuickPick(pick)}
                  style={({ pressed }) => [styles.tile, pressed && { backgroundColor: colors.overlay }]}
                >
                  <Artwork
                    src={cover}
                    title={title}
                    seed={id}
                    radius={radii.sm}
                    style={styles.tileArt}
                    fontSize={14}
                  />
                  <View style={styles.tileMeta}>
                    <Text style={styles.tileTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    <Text style={styles.tileSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </View>
                  <View style={styles.tilePlay}>
                    <Play size={14} color={colors.accentInk} fill={colors.accentInk} />
                  </View>
                </Pressable>
              );
            })}
          </View>

          {recent.length > 0 ? (
            <Section title="Recently played" horizontal={false}>
              <View style={styles.trendingBox}>
                <TrackList tracks={recent} emptyMessage="No recent plays yet" />
              </View>
            </Section>
          ) : null}

          <Section
            title="Trending now"
            subtitle="The most played tracks on Pulse"
            actionLabel="Search"
            onAction={() => navigation.navigate('Search')}
            horizontal={false}
          >
            <View style={styles.trendingBox}>
              <TrackList tracks={trending.slice(0, 8)} emptyMessage="No trending tracks yet" />
            </View>
          </Section>

          <Section title="Made for you" subtitle="Genre mixes built from the catalog">
            {genres.slice(0, 4).map((genre) => (
              <GenreMixCard
                key={genre.genre}
                genre={genre.genre}
                count={genre.track_count}
                busy={mixBusy === genre.genre}
                onPlay={() => void playMix(genre.genre)}
              />
            ))}
          </Section>

          <Section title="New releases" actionLabel="See all" onAction={() => navigation.navigate('Search')}>
            {newReleases.map((album) => (
              <AlbumCard key={album.id} album={album} onPlay={() => void playAlbum(album)} />
            ))}
          </Section>

          <Section title="Popular artists" actionLabel="See all" onAction={() => navigation.navigate('Search')}>
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={{ id: artist.id, name: artist.name, image_url: artist.image_url, bio: null }}
              />
            ))}
          </Section>

          <Section title="Browse genres" actionLabel="See all" onAction={() => navigation.navigate('Search')}>
            {genres.slice(0, 8).map((genre) => (
              <GenreCard key={genre.genre} genre={genre.genre} count={genre.track_count} />
            ))}
          </Section>

          <View style={styles.footerNote}>
            <TrendingUp size={16} color={colors.accent} />
            <Text style={styles.footerText}>
              {pluralise(trending.length, 'trending track')} right now · search the full catalog
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xxl },
  header: { gap: 2 },
  greeting: { ...type.display, color: colors.fg },
  user: { ...type.bodySm, color: colors.muted },
  quickGrid: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  tile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    padding: spacing.sm,
    minHeight: 64,
  },
  tileArt: { width: 48, height: 48 },
  tileMeta: { flex: 1, minWidth: 0, gap: 1 },
  tileTitle: { ...type.bodySm, color: colors.fg, fontWeight: '600' },
  tileSubtitle: { ...type.caption, color: colors.muted },
  tilePlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonTile: {
    width: '100%',
    height: 64,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  trendingBox: {
    backgroundColor: 'rgba(26,26,35,0.6)',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: { ...type.bodySm, color: colors.muted, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(26,26,35,0.6)',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  footerText: { ...type.bodySm, color: colors.muted, flex: 1 },
});
