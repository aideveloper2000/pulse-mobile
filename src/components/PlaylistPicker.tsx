import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createPlaylist, addToPlaylist, fetchMyPlaylists } from '../lib/api';
import type { Playlist } from '../lib/types';
import { useAuthUser } from '../lib/useAuth';
import { useToasts } from '../store/toast';
import { colors, radii, spacing, type } from '../theme';

interface PlaylistPickerProps {
  visible: boolean;
  trackId: number | null;
  onClose: () => void;
}

export function PlaylistPicker({ visible, trackId, onClose }: PlaylistPickerProps) {
  const user = useAuthUser();
  const toast = useToasts((s) => s.push);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible || !user) return;
    let active = true;
    setLoading(true);
    fetchMyPlaylists(user.id)
      .then((data) => {
        if (active) setPlaylists(data);
      })
      .catch(() => {
        if (active) toast('Could not load playlists', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, user?.id]);

  if (!visible || !trackId) return null;

  const add = async (playlistId: number) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await addToPlaylist(playlistId, trackId);
      toast('Added to playlist', 'success');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add to playlist', 'error');
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!user || !newName.trim() || busy) return;
    setBusy(true);
    try {
      const playlist = await createPlaylist(user.id, newName.trim());
      await addToPlaylist(playlist.id, trackId);
      toast('Playlist created', 'success');
      setNewName('');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create playlist', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add to playlist</Text>

          <View style={styles.createRow}>
            <TextInput
              style={styles.input}
              placeholder="New playlist name"
              placeholderTextColor={colors.faint}
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={create}
              returnKeyType="done"
            />
            <Pressable
              onPress={create}
              disabled={!newName.trim() || busy}
              style={({ pressed }) => [
                styles.createBtn,
                (!newName.trim() || busy) && { opacity: 0.5 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.createBtnText}>Create</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {loading ? (
              <Text style={styles.empty}>Loading playlists…</Text>
            ) : playlists.length === 0 ? (
              <Text style={styles.empty}>No playlists yet. Create one above.</Text>
            ) : (
              playlists.map((playlist) => (
                <Pressable
                  key={playlist.id}
                  onPress={() => void add(playlist.id)}
                  disabled={busy}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.raised }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.rowSubtitle}>
                      {playlist.playlist_tracks?.length ?? 0} tracks
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.md,
  },
  title: { ...type.h2, color: colors.fg, marginBottom: spacing.md },
  createRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.fg,
    ...type.bodySm,
  },
  createBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
  list: { flexGrow: 0 },
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  rowTitle: { ...type.body, color: colors.fg, fontWeight: '600' },
  rowSubtitle: { ...type.caption, color: colors.muted, marginTop: 2 },
  empty: { ...type.bodySm, color: colors.muted, paddingVertical: spacing.lg, textAlign: 'center' },
});
