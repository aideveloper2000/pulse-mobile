import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Pause, Play, Sparkles } from 'lucide-react-native';
import type { Album, Artist, Playlist } from '../lib/types';
import { pluralise } from '../lib/format';
import { Artwork } from './Artwork';
import { colors, radii, spacing, type } from '../theme';

export const GENRE_COLORS: Record<string, string> = {
  Electronic: '#0f766e',
  Ambient: '#1e40af',
  Rock: '#be123c',
  Pop: '#c2410c',
  'Hip-Hop': '#b45309',
  Jazz: '#15803d',
  Classical: '#a16207',
  Folk: '#3f6212',
  Experimental: '#9f1239',
  Punk: '#7c2d12',
  Metal: '#44403c',
  Techno: '#0e7490',
  House: '#166534',
  Dance: '#be123c',
  'Lo-Fi': '#57534e',
  Instrumental: '#1e3a8a',
  Funk: '#92400e',
  World: '#166534',
  Blues: '#1e40af',
  Reggae: '#15803d',
  Soul: '#9f1239',
  Country: '#a16207',
  Spoken: '#57534e',
};

export function genreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? '#0f766e';
}

interface SectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  horizontal?: boolean;
  children: React.ReactNode;
}

export function Section({
  title,
  subtitle,
  actionLabel,
  onAction,
  horizontal = true,
  children,
}: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onAction && actionLabel ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionContent}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.sectionStack}>{children}</View>
      )}
    </View>
  );
}

interface GenreMixCardProps {
  genre: string;
  count: number;
  busy?: boolean;
  onPlay: () => void;
}

export function GenreMixCard({ genre, count, busy, onPlay }: GenreMixCardProps) {
  return (
    <Pressable
      onPress={onPlay}
      disabled={busy}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }, busy && { opacity: 0.6 }]}
    >
      <View style={[styles.mixArt, { backgroundColor: genreColor(genre) }]}>
        <Sparkles size={30} color="rgba(255,255,255,0.9)" />
        <View style={styles.playBadge}>
          {busy ? (
            <View style={styles.spinner} />
          ) : (
            <Play size={18} color={colors.accentInk} fill={colors.accentInk} />
          )}
        </View>
      </View>
      <View style={{ minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {genre} mix
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {pluralise(count, 'track')}
        </Text>
      </View>
    </Pressable>
  );
}

interface AlbumCardProps {
  album: Album;
  onPlay?: (album: Album) => void;
  playing?: boolean;
}

export function AlbumCard({ album, onPlay, playing }: AlbumCardProps) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Album', { id: album.id })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <View>
        <Artwork
          src={album.cover_url}
          title={album.title}
          seed={album.id}
          radius={radii.md}
          style={styles.albumArt}
          fontSize={26}
        />
        {onPlay ? (
          <Pressable
            onPress={() => onPlay(album)}
            style={[styles.playBadge, playing && { opacity: 1 }]}
            hitSlop={6}
          >
            {playing ? (
              <Pause size={18} color={colors.accentInk} fill={colors.accentInk} />
            ) : (
              <Play size={18} color={colors.accentInk} fill={colors.accentInk} />
            )}
          </Pressable>
        ) : null}
      </View>
      <View style={{ minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {album.release_year ? `${album.release_year} · ` : ''}
          {album.artist?.name ?? 'Unknown Artist'}
        </Text>
      </View>
    </Pressable>
  );
}

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Artist', { id: artist.id })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <Artwork
        src={artist.image_url}
        title={artist.name}
        seed={artist.id}
        radius={999}
        style={styles.artistArt}
        fontSize={24}
      />
      <View style={{ minWidth: 0, alignItems: 'center' }}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {artist.name}
        </Text>
        <Text style={styles.cardSubtitle}>Artist</Text>
      </View>
    </Pressable>
  );
}

interface PlaylistCardProps {
  playlist: Playlist;
  tracks: number;
}

export function PlaylistCard({ playlist, tracks }: PlaylistCardProps) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Playlist', { id: playlist.id })}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      <Artwork
        src={playlist.cover_url}
        title={playlist.name}
        seed={playlist.id}
        radius={radii.md}
        style={styles.albumArt}
        fontSize={26}
      />
      <View style={{ minWidth: 0 }}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {pluralise(tracks, 'track')}
        </Text>
      </View>
    </Pressable>
  );
}

interface GenreCardProps {
  genre: string;
  count: number;
}

export function GenreCard({ genre, count }: GenreCardProps) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('Genre', { genre })}
      style={[styles.genreCard, { backgroundColor: genreColor(genre) }]}
    >
      <Text style={styles.genreTitle} numberOfLines={2}>
        {genre}
      </Text>
      <Text style={styles.genreCount}>{pluralise(count, 'track')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end' },
  sectionTitle: { ...type.h2, color: colors.fg },
  sectionSubtitle: { ...type.bodySm, color: colors.muted, marginTop: 2 },
  sectionAction: { ...type.label, color: colors.muted, textTransform: 'uppercase' },
  sectionContent: { gap: spacing.md, paddingBottom: spacing.sm },
  sectionStack: { gap: spacing.sm },
  card: { width: 156, gap: spacing.sm },
  albumArt: { width: 156, height: 156 },
  artistArt: { width: 132, height: 132 },
  mixArt: {
    width: 156,
    height: 156,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(4,35,15,0.4)',
    borderTopColor: colors.accentInk,
  },
  cardTitle: { ...type.bodySm, color: colors.fg, fontWeight: '600' },
  cardSubtitle: { ...type.caption, color: colors.muted, marginTop: 2 },
  playBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    shadowColor: '#1ee06f',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  genreCard: {
    width: 220,
    aspectRatio: 1.6,
    borderRadius: radii.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  genreTitle: { ...type.title, color: '#ffffff', fontSize: 20 },
  genreCount: { ...type.bodySm, color: 'rgba(255,255,255,0.85)' },
});
