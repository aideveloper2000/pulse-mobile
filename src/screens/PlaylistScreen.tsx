import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal, Play, Plus, Shuffle } from 'lucide-react-native';
import type { Playlist, Track } from '../lib/types';
import {
  addToPlaylist,
  fetchPlaylist,
  removeFromPlaylist,
  renamePlaylist,
  deletePlaylist,
  search,
} from '../lib/api';
import { pluralise } from '../lib/format';
import { usePlayer } from '../store/player';
import { useToasts } from '../store/toast';
import { Artwork } from '../components/Artwork';
import { TrackList } from '../components/TrackList';
import { PlaylistPicker } from '../components/PlaylistPicker';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { colors, radii, shadow, spacing, type } from '../theme';

export function PlaylistScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = Number(route.params?.id);
  const toast = useToasts((s) => s.push);
  const insets = useSafeAreaInsets();
  const play = usePlayer((s) => s.play);
  const playShuffled = usePlayer((s) => s.playShuffled);

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newName, setNewName] = useState('');
  const [addVisible, setAddVisible] = useState(false);
  const [pickerTrackId, setPickerTrackId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchPlaylist(id);
      setPlaylist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      search(q)
        .then((res) => setResults(res.tracks))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing.xxl }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !playlist) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + spacing.xxl }]}>
        <Text style={styles.errorText}>{error ?? 'Playlist not found'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const tracks: Track[] = (playlist.playlist_tracks ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((pt) => pt.track)
    .filter((t): t is Track => Boolean(t));

  const cover = playlist.cover_url ?? tracks[0]?.cover_url ?? null;

  const handleRename = async () => {
    if (!newName.trim()) return;
    try {
      await renamePlaylist(playlist.id, newName.trim());
      setRenameVisible(false);
      toast('Playlist renamed', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Rename failed', 'error');
    }
  };

  const handleDelete = () => {
    setConfirmDelete(true);
  };

  const confirmDeletePlaylist = async () => {
    setConfirmDelete(false);
    try {
      await deletePlaylist(playlist.id);
      navigation.goBack();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const handleRemove = async (track: Track) => {
    try {
      await removeFromPlaylist(playlist.id, track.id);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error');
    }
  };

  const handleAdd = async (track: Track) => {
    try {
      await addToPlaylist(playlist.id, track.id);
      toast('Added to playlist', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add', 'error');
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.headerBtn}>
          <ChevronLeft size={26} color={colors.fg} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setMenuVisible(true)} hitSlop={10} style={styles.headerBtn}>
          <MoreHorizontal size={22} color={colors.fg} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Artwork
            src={cover}
            title={playlist.name}
            seed={playlist.id}
            radius={radii.xl}
            style={styles.cover}
            fontSize={48}
          />
          <Text style={styles.name} numberOfLines={2}>
            {playlist.name}
          </Text>
          <Text style={styles.meta}>
            {pluralise(tracks.length, 'track')}
            {playlist.description ? ` · ${playlist.description}` : ''}
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
          <Pressable
            onPress={() => setAddVisible(true)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          >
            <Plus size={16} color={colors.fg} />
            <Text style={styles.shuffleText}>Add songs</Text>
          </Pressable>
        </View>

        <TrackList
          tracks={tracks}
          emptyMessage="This playlist is empty. Add some songs."
          onRemove={handleRemove}
          onAddToPlaylist={(track) => setPickerTrackId(track.id)}
          onPlayNext={(track) => usePlayer.getState().playNext(track)}
        />
      </ScrollView>

      <Modal transparent animationType="fade" visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menu} onPress={() => {}}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.raised }]}
              onPress={() => {
                setMenuVisible(false);
                setNewName(playlist.name);
                setRenameVisible(true);
              }}
            >
              <Text style={styles.menuText}>Rename playlist</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.raised }]}
              onPress={() => {
                setMenuVisible(false);
                handleDelete();
              }}
            >
              <Text style={[styles.menuText, { color: colors.danger }]}>Delete playlist</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="fade" visible={renameVisible} onRequestClose={() => setRenameVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setRenameVisible(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>Rename playlist</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleRename}
              returnKeyType="done"
            />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setRenameVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleRename} disabled={!newName.trim()} style={styles.createBtn}>
                <Text style={styles.createText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent animationType="slide" visible={addVisible} onRequestClose={() => setAddVisible(false)}>
        <View style={[styles.addModal, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.addHeader}>
            <Text style={styles.dialogTitle}>Add songs</Text>
            <Pressable onPress={() => setAddVisible(false)} hitSlop={10}>
              <Text style={styles.cancelText}>Close</Text>
            </Pressable>
          </View>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Search the catalog"
              placeholderTextColor={colors.faint}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
            />
          </View>
          {searching ? (
            <View style={styles.searching}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <TrackList
              tracks={results}
              emptyMessage={query.trim() ? 'No matching songs' : 'Search to find songs to add'}
              onPlay={(track) => void handleAdd(track)}
            />
          )}
        </View>
      </Modal>

      <PlaylistPicker
        visible={pickerTrackId !== null}
        trackId={pickerTrackId}
        onClose={() => setPickerTrackId(null)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete playlist"
        message={`Delete "${playlist.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => void confirmDeletePlaylist()}
        onCancel={() => setConfirmDelete(false)}
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
  cover: { width: 210, height: 210, ...shadow.card },
  name: { ...type.title, color: colors.fg, textAlign: 'center' },
  meta: { ...type.bodySm, color: colors.muted, textAlign: 'center' },
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
  addBtn: {
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
  center: { flex: 1, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...type.bodySm, color: colors.danger, textAlign: 'center' },
  backBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  menu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  menuItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  menuText: { ...type.body, color: colors.fg },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    margin: spacing.xl,
    gap: spacing.lg,
  },
  dialogTitle: { ...type.h2, color: colors.fg },
  input: {
    backgroundColor: colors.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.fg,
    ...type.body,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cancelText: { ...type.bodySm, color: colors.muted, fontWeight: '600' },
  createBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
  addModal: {
    flex: 1,
    backgroundColor: colors.base,
    paddingHorizontal: spacing.lg,
  },
  addHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  searchRow: { marginBottom: spacing.md },
  searching: { padding: spacing.xl, alignItems: 'center' },
});
