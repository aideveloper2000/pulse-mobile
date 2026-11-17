import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AudioLines } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useToasts } from '../store/toast';
import { colors, radii, shadow, spacing, type } from '../theme';

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToasts((s) => s.push);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() || email.split('@')[0] } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setError('Account created, but no session was returned. Try signing in.');
          return;
        }
        toast('Welcome to Pulse', 'success');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logo}>
            <AudioLines size={30} color={colors.accentInk} strokeWidth={2.5} />
          </View>
          <Text style={styles.brandName}>Pulse</Text>
          <Text style={styles.tagline}>Stream the catalog. Save your favourites. Upload your own.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.toggle}>
            {(['signin', 'signup'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleLabel, mode === m && styles.toggleLabelActive]}>
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
              </Pressable>
            ))}
          </View>

          {mode === 'signup' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.faint}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.faint}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.faint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'password'}
            />
          </View>

          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [
              styles.submit,
              pressed && { opacity: 0.9 },
              busy && { opacity: 0.7 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.accentInk} />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brand: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accent,
  },
  brandName: { ...type.display, color: colors.fg },
  tagline: { ...type.bodySm, color: colors.muted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadow.card,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.base,
    borderRadius: radii.md,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.overlay },
  toggleLabel: { ...type.bodySm, color: colors.muted, fontWeight: '600' },
  toggleLabelActive: { color: colors.fg },
  field: { gap: spacing.xs },
  label: { ...type.label, color: colors.muted, textTransform: 'uppercase' },
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
  error: {
    backgroundColor: 'rgba(255,90,90,0.1)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,90,90,0.35)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: { ...type.bodySm, color: '#ffb3b3' },
  submit: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.accent,
  },
  submitText: { ...type.body, color: colors.accentInk, fontWeight: '800' },
});
