import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Music, UploadCloud } from 'lucide-react-native';
import { uploadTrack, type UploadFile } from '../lib/api';
import { useAuthUser } from '../lib/useAuth';
import { useToasts } from '../store/toast';
import { colors, radii, shadow, spacing, type } from '../theme';

export function UploadScreen() {
  const user = useAuthUser();
  const navigation = useNavigation<any>();
  const toast = useToasts((s) => s.push);
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<UploadFile | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (!asset) return;

      let blob: Blob;
      if (Platform.OS === 'web' && asset.file) {
        blob = asset.file;
      } else if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        blob = await response.blob();
      } else {
        blob = new File(asset.uri);
      }

      setFile({ name: asset.name, blob, mimeType: asset.mimeType ?? 'audio/mpeg' });
      if (!title.trim()) {
        setTitle(asset.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim());
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not pick a file');
    }
  };

  const upload = async () => {
    if (!user || !file || busy) return;
    setBusy(true);
    setError(null);
    try {
      await uploadTrack(user.id, file, {
        title: title.trim() || file.name,
        artist: artist.trim() || (user.user_metadata?.display_name ?? 'Unknown Artist'),
        genre: genre.trim() || null,
      });
      toast('Upload complete', 'success');
      setFile(null);
      setTitle('');
      setArtist('');
      setGenre('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Upload</Text>
      <Text style={styles.subtitle}>
        Add your own audio to the catalog. Files are stored in your private uploads folder.
      </Text>

      <Pressable
        onPress={pick}
        style={({ pressed }) => [styles.dropzone, pressed && { borderColor: colors.accent }]}
      >
        <View style={styles.dropIcon}>
          <Music size={24} color={colors.accent} />
        </View>
        {file ? (
          <>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileMeta}>{file.mimeType} · tap to replace</Text>
          </>
        ) : (
          <>
            <Text style={styles.dropTitle}>Choose an audio file</Text>
            <Text style={styles.dropMeta}>MP3, WAV, M4A, OGG or FLAC</Text>
          </>
        )}
      </Pressable>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Track title"
          placeholderTextColor={colors.faint}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Artist</Text>
        <TextInput
          style={styles.input}
          placeholder="Artist name"
          placeholderTextColor={colors.faint}
          value={artist}
          onChangeText={setArtist}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Genre (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Electronic"
          placeholderTextColor={colors.faint}
          value={genre}
          onChangeText={setGenre}
          autoCapitalize="words"
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={upload}
        disabled={!file || busy}
        style={({ pressed }) => [
          styles.uploadBtn,
          (!file || busy) && { opacity: 0.5 },
          pressed && { opacity: 0.9 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.accentInk} />
        ) : (
          <>
            <UploadCloud size={18} color={colors.accentInk} />
            <Text style={styles.uploadText}>Upload track</Text>
          </>
        )}
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Library')} hitSlop={8}>
        <Text style={styles.link}>View your uploads in the Library</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  title: { ...type.title, color: colors.fg },
  subtitle: { ...type.bodySm, color: colors.muted },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  dropIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropTitle: { ...type.body, color: colors.fg, fontWeight: '600' },
  dropMeta: { ...type.caption, color: colors.muted },
  fileName: { ...type.body, color: colors.fg, fontWeight: '600' },
  fileMeta: { ...type.caption, color: colors.muted },
  field: { gap: spacing.xs },
  label: { ...type.label, color: colors.muted, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.fg,
    ...type.body,
  },
  errorBox: {
    backgroundColor: 'rgba(255,90,90,0.1)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,90,90,0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: { ...type.bodySm, color: '#ffb3b3' },
  uploadBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.accent,
  },
  uploadText: { ...type.body, color: colors.accentInk, fontWeight: '800' },
  link: { ...type.bodySm, color: colors.accent, textAlign: 'center', paddingVertical: spacing.sm },
});
