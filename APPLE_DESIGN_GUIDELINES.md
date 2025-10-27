# Carben Connect Mobile 2.0 - Apple Design Language Guidelines

## Design Philosophy

**Goal:** Create an app that feels native to iOS, following Apple's Human Interface Guidelines while maintaining Carben Connect branding.

**Core Principles:**
1. **Clarity** - Content is paramount. Subtle, unobtrusive UI.
2. **Deference** - UI shouldn't compete with content.
3. **Depth** - Visual layers and realistic motion provide hierarchy.

## Typography

### SF Pro Font System
Use system fonts (automatically SF Pro on iOS):

```javascript
fontFamily: Platform.select({
  ios: 'System',
  android: 'Roboto'
})
```

### Type Scale
```javascript
const typography = {
  largeTitle: { fontSize: 34, fontWeight: 'bold', lineHeight: 41 },
  title1: { fontSize: 28, fontWeight: 'bold', lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: 'bold', lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  headline: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: '400', lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  caption2: { fontSize: 11, fontWeight: '400', lineHeight: 13 },
};
```

### Font Weights
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700

### Usage Examples
- **Screen Titles:** title2 or title3
- **Card Headers:** headline
- **Body Text:** body
- **Supporting Text:** subhead or footnote
- **Labels:** callout or caption1

## Colors

### iOS Semantic Colors
Use system colors that automatically adapt to light/dark mode:

```javascript
import { useColorScheme } from 'react-native';

const scheme = useColorScheme();
const colors = {
  // Background Colors
  systemBackground: scheme === 'dark' ? '#000000' : '#FFFFFF',
  secondarySystemBackground: scheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
  tertiarySystemBackground: scheme === 'dark' ? '#2C2C2E' : '#FFFFFF',

  // Grouped Background Colors (for lists)
  systemGroupedBackground: scheme === 'dark' ? '#000000' : '#F2F2F7',
  secondarySystemGroupedBackground: scheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
  tertiarySystemGroupedBackground: scheme === 'dark' ? '#2C2C2E' : '#F2F2F7',

  // Label Colors
  label: scheme === 'dark' ? '#FFFFFF' : '#000000',
  secondaryLabel: scheme === 'dark' ? '#EBEBF599' : '#3C3C4399',
  tertiaryLabel: scheme === 'dark' ? '#EBEBF54D' : '#3C3C434D',
  quaternaryLabel: scheme === 'dark' ? '#EBEBF52E' : '#3C3C432E',

  // Separator Colors
  separator: scheme === 'dark' ? '#38383A' : '#C6C6C8',
  opaqueSeparator: scheme === 'dark' ? '#38383A' : '#C6C6C8',

  // Carben Branding (constant across themes)
  carbenOrange: '#F97316',
  carbenOrangeDark: '#EA580C',
};
```

### Color Usage
- **Backgrounds:** Use systemBackground hierarchy
- **Text:** Use label hierarchy for proper contrast
- **Separators:** Use separator for lines
- **Brand Color:** Use carbenOrange for primary actions and accents
- **Interactive Elements:** Use carbenOrange for buttons, links, selected states

## Layout & Spacing

### Safe Area Insets
Always respect safe areas:

```javascript
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container}>
  {/* Content */}
</SafeAreaView>
```

### Spacing Scale
Consistent spacing using 4pt grid:

```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
```

### Margins & Padding
- **Screen Edges:** 16-20px horizontal padding
- **Card Padding:** 16px all sides
- **List Item Padding:** 16px horizontal, 12px vertical
- **Section Spacing:** 24-32px between sections
- **Element Spacing:** 8-12px between related elements

### Tap Targets
- **Minimum:** 44pt x 44pt (44px x 44px)
- **Comfortable:** 48pt x 48pt
- **Icons:** 24pt with 10pt padding = 44pt target

## Components

### Cards & Containers

**Inset Grouped Style (iOS native feel):**
```javascript
const cardStyle = {
  backgroundColor: colors.secondarySystemGroupedBackground,
  borderRadius: 12,
  marginHorizontal: 16,
  marginVertical: 8,
  padding: 16,
  // iOS shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};
```

**Elevated Card:**
```javascript
const elevatedCard = {
  backgroundColor: colors.systemBackground,
  borderRadius: 16,
  padding: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
```

### Buttons

**Primary Button (Filled):**
```javascript
const primaryButton = {
  backgroundColor: colors.carbenOrange,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
  alignItems: 'center',
  justifyContent: 'center',
};
```

**Secondary Button (Outlined):**
```javascript
const secondaryButton = {
  backgroundColor: 'transparent',
  borderColor: colors.carbenOrange,
  borderWidth: 1.5,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  minHeight: 48,
};
```

**Text Button:**
```javascript
const textButton = {
  paddingVertical: 8,
  paddingHorizontal: 12,
};
```

### Lists

**Grouped List (iOS Settings style):**
```javascript
// Container
const listContainer = {
  backgroundColor: colors.systemGroupedBackground,
};

// Section Header
const sectionHeader = {
  paddingHorizontal: 16,
  paddingTop: 24,
  paddingBottom: 8,
};

// List Item
const listItem = {
  backgroundColor: colors.secondarySystemGroupedBackground,
  paddingVertical: 12,
  paddingHorizontal: 16,
  minHeight: 44,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// Separator
const separator = {
  height: StyleSheet.hairlineWidth,
  backgroundColor: colors.separator,
  marginLeft: 16,
};
```

### Text Inputs

**iOS-style Input:**
```javascript
const textInput = {
  backgroundColor: colors.tertiarySystemGroupedBackground,
  borderRadius: 10,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 17,
  color: colors.label,
  minHeight: 44,
  borderWidth: 1,
  borderColor: colors.separator,
};

// Focused state
const textInputFocused = {
  ...textInput,
  borderColor: colors.carbenOrange,
  borderWidth: 1.5,
};
```

### Modals

**Bottom Sheet Modal:**
```javascript
const modal = {
  flex: 1,
  backgroundColor: colors.systemBackground,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingTop: 8,
};

// Modal Handle (drag indicator)
const modalHandle = {
  width: 36,
  height: 5,
  borderRadius: 3,
  backgroundColor: colors.tertiaryLabel,
  alignSelf: 'center',
  marginVertical: 8,
};
```

### Navigation

**Tab Bar:**
```javascript
const tabBar = {
  backgroundColor: colors.systemBackground,
  borderTopColor: colors.separator,
  borderTopWidth: StyleSheet.hairlineWidth,
  paddingBottom: 20, // Safe area
  paddingTop: 8,
  height: 85,
};

// Active tab
const activeTab = {
  color: colors.carbenOrange,
};

// Inactive tab
const inactiveTab = {
  color: colors.secondaryLabel,
};
```

**Navigation Bar:**
```javascript
const navigationBar = {
  backgroundColor: colors.systemBackground,
  borderBottomColor: colors.separator,
  borderBottomWidth: StyleSheet.hairlineWidth,
  height: 44,
};

// Large title (iOS 11+)
const largeTitle = {
  fontSize: 34,
  fontWeight: 'bold',
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 8,
};
```

## Animations & Interactions

### Timing Functions
Use iOS-native timing curves:

```javascript
import { Easing } from 'react-native';

const timings = {
  // iOS spring animation
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },

  // iOS ease
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),

  // iOS ease-in
  easeIn: Easing.bezier(0.42, 0, 1, 1),

  // iOS ease-out
  easeOut: Easing.bezier(0, 0, 0.58, 1),

  // iOS ease-in-out
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
};

const durations = {
  short: 200,
  medium: 300,
  long: 400,
};
```

### Haptic Feedback
```javascript
import * as Haptics from 'expo-haptics';

// Light impact (selection)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium impact (button press)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy impact (important action)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Selection change (picker, segmented control)
Haptics.selectionAsync();

// Notification (success, warning, error)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

### Gestures

**Swipe to Delete:**
```javascript
import { Swipeable } from 'react-native-gesture-handler';

<Swipeable
  renderRightActions={() => (
    <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  )}
>
  {/* List item content */}
</Swipeable>
```

**Pull to Refresh:**
```javascript
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.carbenOrange}
    />
  }
>
  {/* Content */}
</ScrollView>
```

## Icons

### SF Symbols Style
Use Ionicons that match SF Symbols aesthetic:

```javascript
// Prefer outlined icons for inactive states
<Ionicons name="home-outline" size={24} color={colors.secondaryLabel} />

// Filled icons for active states
<Ionicons name="home" size={24} color={colors.carbenOrange} />
```

### Icon Sizes
- **Tab Bar:** 24-28pt
- **Navigation Bar:** 22-24pt
- **List Items:** 20-22pt
- **Buttons:** 20-24pt
- **Small Icons:** 16-18pt

## Dark Mode

### Automatic Support
```javascript
import { useColorScheme } from 'react-native';

const MyComponent = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View style={{
      backgroundColor: isDark ? '#000' : '#FFF',
    }}>
      {/* Content */}
    </View>
  );
};
```

### Best Practices
1. Use semantic colors (systemBackground, label, etc.)
2. Test all screens in both light and dark mode
3. Ensure sufficient contrast in both modes
4. Don't hardcode colors - use dynamic values
5. Icons should adapt to theme (use label colors)

## Accessibility

### VoiceOver Support
```javascript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add new project"
  accessibilityHint="Opens form to create a new construction project"
  accessibilityRole="button"
>
  <Text>Add Project</Text>
</TouchableOpacity>
```

### Dynamic Type
```javascript
import { Text } from 'react-native';

// Automatically responds to system font size
<Text style={styles.body}>
  This text will scale with system preferences
</Text>
```

### High Contrast Mode
Test with Settings > Accessibility > Display & Text Size > Increase Contrast

## Implementation Checklist

### Phase 1: Typography & Colors
- [ ] Implement SF Pro font scale
- [ ] Create semantic color system
- [ ] Support dark mode
- [ ] Test with Dynamic Type

### Phase 2: Components
- [ ] Redesign buttons with new styles
- [ ] Update cards to inset grouped style
- [ ] Implement iOS-style inputs
- [ ] Add bottom sheet modals

### Phase 3: Navigation
- [ ] Update tab bar styling
- [ ] Add large titles to screens
- [ ] Implement swipe-back gesture
- [ ] Add haptic feedback

### Phase 4: Interactions
- [ ] Add pull-to-refresh everywhere
- [ ] Implement swipe-to-delete
- [ ] Add loading states
- [ ] Smooth transitions

### Phase 5: Polish
- [ ] Test dark mode thoroughly
- [ ] Verify accessibility
- [ ] Check all tap targets 44pt+
- [ ] Final visual refinement

---

**Reference:** Apple Human Interface Guidelines
**Last Updated:** 2025-10-27
