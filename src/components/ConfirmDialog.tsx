import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {message ? (
            <Text style={styles.message} numberOfLines={4}>
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn} hitSlop={8}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                destructive && { backgroundColor: colors.danger },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={[
                  styles.confirmText,
                  destructive && { color: '#ffffff' },
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { ...type.h2, color: colors.fg },
  message: { ...type.bodySm, color: colors.muted },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cancelText: { ...type.bodySm, color: colors.muted, fontWeight: '600' },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  confirmText: { ...type.bodySm, color: colors.accentInk, fontWeight: '700' },
});
