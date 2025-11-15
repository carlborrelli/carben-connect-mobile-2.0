// GlowingCallButton - Premium call button with gradient border and glow effect
import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

export default function GlowingCallButton({
  title,
  onPress,
  style,
  minHeight = 72,
  disabled = false,
  reverse = false, // reverses gradient direction (blue to orange instead of orange to blue)
}) {
  const { colors } = useTheme();
  const [h, setH] = useState(minHeight);
  const r = Math.round(h * 0.28);          // corner radius scales with height
  const padH = Math.round(h * 0.24);       // horizontal padding
  const fontSize = Math.round(h * 0.32);   // text scales with height
  const iconSize = Math.round(h * 0.36);   // icon scales with height
  const halo = Math.max(8, Math.round(h * 0.18)); // glow spread

  const onLayout = (e) => {
    const measuredH = e.nativeEvent.layout.height;
    if (measuredH && Math.abs(measuredH - h) > 1) setH(measuredH);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <View style={[{ minHeight }, style]} onLayout={onLayout}>
      {/* Outer gradient border */}
      <LinearGradient
        colors={['#FF8A00', '#0084C2']} // orange (top) -> blue (bottom)
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.border, { borderRadius: r }]}
      >
        {/* Halo (soft glow) */}
        <LinearGradient
          colors={['rgba(255,138,0,0.55)', 'rgba(0,132,194,0.55)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: r + halo,
              // expand a bit beyond the button for glow
              top: -halo,
              bottom: -halo,
              left: -halo,
              right: -halo,
              opacity: 0.45,
            },
          ]}
        />

        {/* Inner button surface */}
        <Pressable
          disabled={disabled}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.surface,
            {
              borderRadius: r - 2,
              paddingHorizontal: padH,
              minHeight,
              backgroundColor: pressed
                ? colors.tertiarySystemBackground
                : colors.secondarySystemGroupedBackground,
              // iOS glow/shadow
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowRadius: Math.max(6, h * 0.12),
              shadowOffset: { width: 0, height: 2 },
              // Android
              elevation: 2,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              color: colors.label,
              fontWeight: '700',
              letterSpacing: 0.5,
              fontSize,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    flex: 1,
    padding: 2, // gradient "edge" thickness
  },
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
