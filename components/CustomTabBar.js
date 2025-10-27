// CustomTabBar - iOS-style tab bar with circular center button
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SHADOWS } from '../theme';

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isHomeTab = index === 2; // Center tab

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Get icon name based on route
          let iconName;
          switch (route.name) {
            case 'Projects':
              iconName = isFocused ? 'folder' : 'folder-outline';
              break;
            case 'Inbox':
              iconName = isFocused ? 'mail' : 'mail-outline';
              break;
            case 'Home':
              iconName = 'home';
              break;
            case 'Clients':
              iconName = isFocused ? 'people' : 'people-outline';
              break;
            case 'More':
              iconName = isFocused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          // Render circular center button differently
          if (isHomeTab) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.centerButtonContainer}
              >
                <View style={[
                  styles.centerButton,
                  isFocused && styles.centerButtonActive
                ]}>
                  <Ionicons 
                    name={iconName} 
                    size={28} 
                    color={COLORS.systemBackground} 
                  />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    ...SHADOWS.medium,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    shadowColor: COLORS.primary,
    elevation: 8,
  },
  centerButtonActive: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.95 }],
  },
});
