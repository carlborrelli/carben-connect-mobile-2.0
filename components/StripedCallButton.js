// StripedCallButton - Custom call button with gradient stripes
import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function StripedCallButton({
  title,
  onPress,
  style,
  subtle = true,
  height = 88,
}) {
  const { colors } = useTheme();

  // align opacities for subtle vs bold
  const stripeOpacityTop = subtle ? 0.5 : 1;
  const stripeOpacityBottom = subtle ? 0.5 : 1;

  // Theme-aware colors
  const backgroundColor = colors.secondarySystemGroupedBackground;
  const textColor = colors.label;
  const iconColor = '#FF9B00';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          minHeight: height,
          opacity: pressed ? 0.95 : 1,
          backgroundColor: backgroundColor,
        },
        style,
      ]}
    >
      {/* top stripes */}
      <View style={styles.topStripes}>
        <LinearGradient
          colors={['#FF9B00', '#FF6A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stripe, { opacity: stripeOpacityTop }]}
        />
        <LinearGradient
          colors={['#FF9B00', '#FF6A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stripe, { marginTop: 3, opacity: stripeOpacityTop * 0.9 }]}
        />
      </View>

      {/* label row */}
      <View style={styles.content}>
        <Ionicons name="call" size={18} color={iconColor} />
        <Text numberOfLines={1} style={[styles.label, { color: textColor }]}>
          {title}
        </Text>
      </View>

      {/* bottom stripes */}
      <View style={styles.bottomStripes}>
        <LinearGradient
          colors={['#0084C2', '#001E38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stripe, { opacity: stripeOpacityBottom }]}
        />
        <LinearGradient
          colors={['#0084C2', '#001E38']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stripe, { marginTop: 3, opacity: stripeOpacityBottom * 0.9 }]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    overflow: 'hidden', // keeps stripes rounded
  },
  topStripes: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
  },
  bottomStripes: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
  },
  stripe: {
    height: 2,
    borderRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
