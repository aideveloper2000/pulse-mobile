import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { coverGradient } from '../lib/format';

interface ArtworkProps {
  src?: string | null;
  title?: string;
  seed: string | number;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  fontSize?: number;
}

/** Cover art with a deterministic gradient fallback when no image exists. */
export function Artwork({ src, title, seed, style, radius = 8, fontSize }: ArtworkProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initial = (title ?? String(seed)).trim().charAt(0).toUpperCase() || 'P';
  const [from, to] = coverGradient(seed);

  return (
    <View
      style={[
        { overflow: 'hidden', borderRadius: radius, backgroundColor: from },
        style,
      ]}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {showImage ? (
        <Image
          source={{ uri: src ?? undefined }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={{ color: 'rgba(255,255,255,0.92)', fontWeight: '900', fontSize: fontSize ?? 22 }}>
            {initial}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
