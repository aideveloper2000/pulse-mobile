import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, X } from 'lucide-react-native';
import type { SearchResults } from '../lib/api';
import { fetchGenreStats, search } from '../lib/api';
import type { GenreStat } from '../lib/api';
import { genreColor, AlbumCard, ArtistCard, Section } from '../components/Cards';
import { TrackList } from '../components/TrackList';
import { colors, radii, spacing, type } from '../theme';

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<GenreStat[]>([]);

  useEffect(() => {
    let active = true;
    fetchGenreStats()
      .then((data) => {
        if (active) setGenres(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      search(q)
        .then(setResults)
        .catch((err) => setError(err instanceof Error ? err.message : 'Search failed'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isEmpty =
    results &&
    !results.tracks.length &&
    !results.artists.length &&
    !results.albums.length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchRow}>
          <Search size={18} color={colors.faint} />
          <TextInput
            style={styles.input}
            placeholder="Songs, artists, albums"
            placeholderTextColor={colors.faint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <X size={18} color={colors.faint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !query.trim() ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.genreContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.genreHeading}>Browse genres</Text>
          <View style={styles.genreGrid}>
            {genres.map((genre) => (
              <GenreTile key={genre.genre} genre={genre.genre} count={genre.track_count} />
            ))}
          </View>
        </ScrollView>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyText}>Try a different title, artist, or album.</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {results && results.artists.length > 0 ? (
            <Section title="Artists">
              {results.artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </Section>
          ) : null}

          {results && results.albums.length > 0 ? (
            <Section title="Albums">
              {results.albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </Section>
          ) : null}

          {results && results.tracks.length > 0 ? (
            <Section title="Songs" horizontal={false}>
              <TrackList tracks={results.tracks} emptyMessage="No songs found" />
            </Section>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function GenreTile({ genre, count }: { genre: string; count: number }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Genre', { genre })}
      style={[styles.genreTile, { backgroundColor: genreColor(genre) }]}
    >
      <Text style={styles.genreTileTitle} numberOfLines={2}>
        {genre}
      </Text>
      <Text style={styles.genreTileCount}>{count} tracks</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { ...type.title, color: colors.fg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  input: { flex: 1, ...type.body, color: colors.fg, padding: 0 },
  genreContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  genreHeading: { ...type.h2, color: colors.fg, marginBottom: spacing.md },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genreTile: {
    width: '48.5%',
    minHeight: 92,
    borderRadius: radii.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  genreTileTitle: { ...type.h2, color: '#ffffff', fontSize: 17 },
  genreTileCount: { ...type.caption, color: 'rgba(255,255,255,0.85)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  errorText: { ...type.bodySm, color: colors.danger, textAlign: 'center' },
  emptyTitle: { ...type.title, color: colors.fg },
  emptyText: { ...type.bodySm, color: colors.muted, textAlign: 'center' },
  resultsContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.xxl, paddingBottom: spacing.xxxl },
});
