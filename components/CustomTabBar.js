// CustomTabBar - iOS-style tab bar with circular center button
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, SHADOWS } from '../theme';

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Check if current route has tabBarHideOnKeyboard option
  const currentRoute = state.routes[state.index];
  const currentDescriptor = descriptors[currentRoute.key];
  const shouldHide = currentDescriptor?.options?.tabBarHideOnKeyboard && keyboardVisible;

  if (shouldHide) {
    return null;
  }

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
                    color={colors.systemBackground}
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
                color={isFocused ? colors.primary : colors.gray}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    shadowColor: colors.primary,
    elevation: 8,
  },
  centerButtonActive: {
    backgroundColor: colors.primaryDark,
    transform: [{ scale: 0.95 }],
  },
});
