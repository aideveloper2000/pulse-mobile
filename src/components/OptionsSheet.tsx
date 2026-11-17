import React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, type } from '../theme';

export interface SheetOption {
  key: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

interface OptionsSheetProps {
  visible: boolean;
  title?: string;
  options: SheetOption[];
  onClose: () => void;
}

export function OptionsSheet({ visible, title, options, onClose }: OptionsSheetProps) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {options.map((opt) => (
            <Pressable
              key={opt.key}
              style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.raised }]}
              onPress={() => {
                onClose();
                opt.onPress();
              }}
            >
              <Text style={[styles.optionLabel, opt.destructive && { color: colors.danger }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.raised }]}
            onPress={onClose}
          >
            <Text style={[styles.optionLabel, { color: colors.muted }]}>Cancel</Text>
          </Pressable>
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
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    ...type.bodySm,
    color: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  option: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionLabel: {
    ...type.body,
    color: colors.fg,
  },
});
