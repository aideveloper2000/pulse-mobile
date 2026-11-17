import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToasts } from '../store/toast';
import { colors, radii, spacing, type } from '../theme';

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  const insets = useSafeAreaInsets();
  if (!toasts.length) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
    >
      {toasts.map((t) => (
        <View
          key={t.id}
          onTouchEnd={() => dismiss(t.id)}
          style={[
            styles.toast,
            t.kind === 'error' && { borderLeftColor: colors.danger },
            t.kind === 'success' && { borderLeftColor: colors.accent },
          ]}
        >
          <Text style={styles.text} numberOfLines={2}>
            {t.message}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: colors.overlay,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 3,
    borderLeftColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: {
    ...type.bodySm,
    color: colors.fg,
  },
});
