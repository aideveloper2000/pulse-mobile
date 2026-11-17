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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListMusic, Plus } from 'lucide-react-native';
import type { Playlist, Track } from '../lib/types';
import {
  createPlaylist,
  deleteUpload,
  fetchLikedTracks,
  fetchMyPlaylists,
  fetchMyUploads,
} from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useLikes } from '../store/likes';
import { usePlayer } from '../store/player';
import { useToasts } from '../store/toast';
import { PlaylistCard } from '../components/Cards';
import { TrackList } from '../components/TrackList';
import { PlaylistPicker } from '../components/PlaylistPicker';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { colors, radii, spacing, type } from '../theme';

type Tab = 'playlists' | 'liked' | 'uploads';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'playlists', label: 'Playlists' },
  { key: 'liked', label: 'Liked Songs' },
  { key: 'uploads', label: 'Uploads' },
];

export function LibraryScreen() {
  const user = useAuthUser();
  const toast = useToasts((s) => s.push);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [liked, setLiked] = useState<Track[]>([]);
  const [uploads, setUploads] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerTrackId, setPickerTrackId] = useState<number | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Track | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      setLiked([]);
      setUploads([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [pl, lk, up] = await Promise.all([
        fetchMyPlaylists(user.id),
        fetchLikedTracks(user.id),
        fetchMyUploads(user.id),
      ]);
      setPlaylists(pl);
      setLiked(lk);
      setUploads(up);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (user) void useLikes.getState().load(user.id);
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user || !newName.trim() || busy) return;
    setBusy(true);
    try {
      await createPlaylist(user.id, newName.trim());
      setNewName('');
      setCreateVisible(false);
      toast('Playlist created', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create playlist', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUpload = (track: Track) => {
    setConfirmDelete(track);
  };

  const confirmDeleteUpload = async () => {
    const track = confirmDelete;
    setConfirmDelete(null);
    if (!track) return;
    try {
      await deleteUpload(track.id);
      toast('Upload deleted', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Library</Text>
        <Pressable
          onPress={() => setCreateVisible(true)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
        >
          <Plus size={18} color={colors.accentInk} />
          <Text style={styles.addBtnText}>New playlist</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : tab === 'playlists' ? (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => setCreateVisible(true)}
            style={({ pressed }) => [styles.newTile, pressed && { opacity: 0.8 }]}
          >
            <View style={styles.newIcon}>
              <Plus size={22} color={colors.fg} />
            </View>
            <Text style={styles.newTileTitle}>New playlist</Text>
            <Text style={styles.newTileSubtitle}>Name it, then add songs</Text>
          </Pressable>
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              tracks={playlist.playlist_tracks?.length ?? 0}
            />
          ))}
          {playlists.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <ListMusic size={26} color={colors.faint} />
              </View>
              <Text style={styles.emptyTitle}>No playlists yet</Text>
              <Text style={styles.emptyText}>Create one, then save any song to it.</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : tab === 'liked' ? (
        <TrackList
          tracks={liked}
          emptyMessage="Songs you like will show up here"
          onAddToPlaylist={(track) => setPickerTrackId(track.id)}
          onPlayNext={(track) => usePlayer.getState().playNext(track)}
        />
      ) : (
        <TrackList
          tracks={uploads}
          emptyMessage="Uploads you add will show up here"
          onAddToPlaylist={(track) => setPickerTrackId(track.id)}
          onPlayNext={(track) => usePlayer.getState().playNext(track)}
          onRemove={handleDeleteUpload}
        />
      )}

      <PlaylistPicker
        visible={pickerTrackId !== null}
        trackId={pickerTrackId}
        onClose={() => setPickerTrackId(null)}
      />

      <ConfirmDialog
        visible={confirmDelete !== null}
        title="Delete upload"
        message={
          confirmDelete
            ? `Delete "${confirmDelete.title}"? This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => void confirmDeleteUpload()}
        onCancel={() => setConfirmDelete(null)}
      />

      <Modal
        transparent
        animationType="fade"
        visible={createVisible}
        onRequestClose={() => setCreateVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setCreateVisible(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>New playlist</Text>
            <TextInput
              style={styles.input}
              placeholder="Playlist name"
              placeholderTextColor={colors.faint}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleCreate}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setCreateVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={!newName.trim() || busy}
                style={({ pressed }) => [
                  styles.createBtn,
                  (!newName.trim() || busy) && { opacity: 0.5 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.createText}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...type.title, color: colors.fg },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.overlay, borderColor: colors.overlay },
  tabLabel: { ...type.bodySm, color: colors.muted, fontWeight: '600' },
  tabLabelActive: { color: colors.fg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  newTile: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  newIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTileTitle: { ...type.bodySm, color: colors.fg, fontWeight: '600', textAlign: 'center' },
  newTileSubtitle: { ...type.caption, color: colors.muted, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { ...type.bodySm, color: colors.danger, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
  emptyWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { ...type.title, color: colors.fg },
  emptyText: { ...type.bodySm, color: colors.muted, width: '100%', textAlign: 'center' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modal: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalTitle: { ...type.h2, color: colors.fg },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cancelText: { ...type.bodySm, color: colors.muted, fontWeight: '600' },
  createBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  createText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
});
