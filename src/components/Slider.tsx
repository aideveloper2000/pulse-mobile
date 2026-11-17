import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
}

/** Minimal cross-platform slider (web + native) built on PanResponder. */
export function Slider({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingComplete,
  height = 4,
  trackColor = '#3a3a46',
  fillColor = colors.accent,
  thumbColor = '#ffffff',
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const widthRef = useRef(0);
  const valueRef = useRef(value);
  const range = Math.max(1e-6, maximumValue - minimumValue);

  valueRef.current = value;

  const commit = (x: number) => {
    const w = widthRef.current;
    if (!w) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    const next = minimumValue + ratio * range;
    valueRef.current = next;
    setDragValue(next);
    onValueChange?.(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => commit(e.nativeEvent.locationX),
      onPanResponderMove: (e) => commit(e.nativeEvent.locationX),
      onPanResponderRelease: () => {
        onSlidingComplete?.(valueRef.current);
        setDragValue(null);
      },
      onPanResponderTerminate: () => {
        onSlidingComplete?.(valueRef.current);
        setDragValue(null);
      },
    }),
  ).current;

  const shown = dragValue ?? value;
  const ratio = Math.min(1, Math.max(0, (shown - minimumValue) / range));

  return (
    <View
      style={[styles.hit, { height: Math.max(height, 24) }]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      {...pan.panHandlers}
    >
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
        <View
          style={{
            height,
            borderRadius: height / 2,
            backgroundColor: fillColor,
            width: width ? `${ratio * 100}%` : 0,
          }}
        />
      </View>
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor,
            width: height * 3,
            height: height * 3,
            borderRadius: height * 1.5,
            left: width ? `${ratio * 100}%` : 0,
            marginLeft: width ? -(height * 1.5) : 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
