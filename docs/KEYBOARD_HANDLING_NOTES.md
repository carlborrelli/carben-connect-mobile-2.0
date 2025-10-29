# ConversationScreen Keyboard Handling - Implementation Notes

## Final Working Solution

Successfully implemented iOS Messages-style keyboard handling for the messaging interface with proper input visibility, tab bar hiding, and smooth text input behavior.

---

## Architecture Overview

### Component Structure
```
SafeAreaView (edges: ['top'] only)
├── Header (fixed)
└── KeyboardAvoidingView (behavior: 'padding', offset: 0)
    ├── FlatList (messages with dynamic padding)
    └── Input Container (docked at bottom with dynamic padding)
        ├── TextInput (multiline, min/max height)
        └── Send Button
```

### Key State Management
```javascript
const [keyboardVisible, setKeyboardVisible] = useState(false);
const [inputHeight, setInputHeight] = useState(0);
const insets = useSafeAreaInsets();
const tabBarHeight = useBottomTabBarHeight();
```

---

## Critical Implementation Details

### 1. SafeAreaView Configuration
**ONLY use top edge, NOT bottom:**
```javascript
<SafeAreaView style={styles.container} edges={['top']}>
```

**Why:** Bottom safe area inset is manually controlled in the input container to account for keyboard visibility. Using `edges={['top', 'bottom']}` causes double-counting.

### 2. KeyboardAvoidingView Setup
```javascript
<KeyboardAvoidingView
  style={styles.flex1}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={0}
>
```

**Key Points:**
- `behavior="padding"` on iOS, `undefined` on Android
- `keyboardVerticalOffset={0}` - NO offset needed (we handle spacing manually)
- Wraps both messages and input container

### 3. Keyboard Visibility Tracking
```javascript
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
```

**Why:** Need to know when keyboard is visible to:
- Hide custom tab bar (built-in `tabBarHideOnKeyboard` only works with default tab bar)
- Adjust input container padding dynamically

### 4. Dynamic Input Container Padding
```javascript
const extraBottom = keyboardVisible ? 0 : tabBarHeight;
const inputPadBottom = SPACING.md + insets.bottom + extraBottom;

// Applied to input container:
style={[styles.inputContainer, { paddingBottom: inputPadBottom }]}
```

**Logic:**
- Always include: base padding (SPACING.md) + bottom safe area (insets.bottom)
- When keyboard hidden: add tab bar height
- When keyboard visible: skip tab bar height (it's hidden)

### 5. FlatList Padding for Input
```javascript
<FlatList
  contentContainerStyle={[
    styles.messagesList,
    { paddingBottom: inputHeight }
  ]}
  scrollIndicatorInsets={{ bottom: inputHeight }}
/>
```

**Measure input height dynamically:**
```javascript
<View
  onLayout={(e) => setInputHeight(e.nativeEvent.layout.height)}
  style={[styles.inputContainer, { paddingBottom: inputPadBottom }]}
>
```

**Why:** Input container height changes based on keyboard visibility, so messages need dynamic padding to avoid being covered.

### 6. TextInput Configuration (Simple, NO auto-grow state)
```javascript
<TextInput
  style={styles.input}
  multiline
  maxLength={1000}
  textAlignVertical="center"
  blurOnSubmit={false}
  underlineColorAndroid="transparent"
/>

// Styles:
input: {
  flex: 1,
  minHeight: 44,      // Single line minimum
  maxHeight: 120,     // ~5-6 lines before scrolling
  // Let TextInput handle growth natively - NO state-driven height changes
}
```

**Critical:** DO NOT use `onContentSizeChange` with state to control height - this causes jittery behavior. Let TextInput's native multiline handle it.

### 7. Custom Tab Bar Integration
```javascript
// In CustomTabBar.js:
const [keyboardVisible, setKeyboardVisible] = useState(false);

// Same keyboard tracking as ConversationScreen

if (shouldHide) {
  return null; // Hide when keyboard visible for Inbox tab
}
```

**In navigation.js:**
```javascript
<Tab.Screen
  name="Inbox"
  component={InboxStackScreen}
  options={{ tabBarHideOnKeyboard: true }}
/>
```

---

## Navigation Stack Reset (Bonus Feature)

Implemented automatic stack reset when switching tabs:

```javascript
// In navigation.js Tab.Navigator:
screenListeners={({ navigation, route }) => ({
  blur: () => {
    const root = navigation.getState();
    const tabRoute = root.routes.find(r => r.key === route.key);
    const child = tabRoute?.state;

    if (child?.type === 'stack' && child.index > 0) {
      const childNavKey = child.key;
      navigation.dispatch({
        ...StackActions.popToTop(),
        target: childNavKey, // Target child stack, not tab route
      });
    }
  },
})}
```

**Result:** When switching away from a tab, its stack automatically resets to root screen.

---

## Key Principles for Future Reference

### ✅ DO:
1. **Use SafeAreaView with only top edge** when manually controlling bottom spacing
2. **Track keyboard visibility** to dynamically adjust UI
3. **Measure actual layout heights** with `onLayout` for dynamic padding
4. **Use KeyboardAvoidingView with behavior="padding"** and zero offset
5. **Keep TextInput simple** - let native multiline handle growth
6. **Platform-specific keyboard events** (keyboardWill* for iOS, keyboardDid* for Android)

### ❌ DON'T:
1. **Don't use edges={['top', 'bottom']}** when manually controlling bottom spacing (double-counting)
2. **Don't add keyboardVerticalOffset** when using SafeAreaView bottom insets (double-counting)
3. **Don't use onContentSizeChange to drive height state changes** (causes jitter)
4. **Don't use InputAccessoryView** unless TextInput is outside it (catch-22)
5. **Don't apply flex:1 and fixed height together** on same View (layout conflict)
6. **Don't rely on built-in tabBarHideOnKeyboard** with custom tab bars (doesn't work)

---

## Common Pitfalls to Avoid

### 1. Double-Counting Bottom Spacing
**Problem:** Input appears too high or jumps off-screen.
**Cause:** Multiple sources adding same spacing (SafeAreaView bottom edge + KeyboardAvoidingView offset + manual padding).
**Solution:** Pick ONE source for bottom spacing and stick with it.

### 2. Jittery TextInput Growth
**Problem:** Input box jumps around rapidly while typing.
**Cause:** Using `onContentSizeChange` + state updates to control height.
**Solution:** Use native multiline with static min/max height constraints.

### 3. Tab Bar Covering Input
**Problem:** Half of input covered when keyboard is hidden.
**Cause:** Not accounting for tab bar height in padding when keyboard is hidden.
**Solution:** Dynamic padding based on keyboard visibility state.

### 4. Custom Tab Bar Not Hiding
**Problem:** Custom tab bar doesn't hide when keyboard shows.
**Cause:** Built-in `tabBarHideOnKeyboard` only works with default tab bar.
**Solution:** Implement keyboard visibility tracking in custom tab bar component.

---

## Performance Considerations

### Optimizations Applied:
1. **No state-driven height changes** - eliminates re-render jitter
2. **Minimal state updates** - only keyboard visibility and measured heights
3. **useCallback for handlers** - could be added but not critical for this screen
4. **FlatList optimization** - already includes `keyExtractor` and efficient rendering

### Layout Performance:
- Single `onLayout` measurement for input height (stable after first render)
- No animations or LayoutAnimation needed (native TextInput handles growth smoothly)

---

## Testing Checklist

When implementing similar keyboard handling:

- [ ] Input visible when keyboard is hidden (not covered by tab bar)
- [ ] Input stays visible when keyboard shows (not covered by keyboard)
- [ ] Tab bar hides when keyboard shows (for custom tab bars)
- [ ] Tab bar reappears when keyboard hides
- [ ] Messages scroll with input (not covered by fixed input)
- [ ] TextInput grows smoothly when typing multiple lines
- [ ] TextInput scrolls after reaching max height (~5-6 lines)
- [ ] No jitter or jumping during typing
- [ ] Safe areas respected (iPhone notch/Dynamic Island)
- [ ] Works on both physical device and simulator
- [ ] iOS and Android behavior appropriate for each platform

---

## Files Modified

1. **screens/ConversationScreen.js** - Main implementation
2. **components/CustomTabBar.js** - Keyboard visibility tracking
3. **navigation.js** - Tab bar hide option, stack reset logic

---

## Future Enhancements (Optional)

If more advanced input features needed:

1. **Animated height transitions** - Use `LayoutAnimation` or `react-native-reanimated`
2. **Input accessories** - Add photo picker, emoji selector above keyboard
3. **Typing indicators** - Show when other user is typing
4. **Voice input** - Add microphone button with speech-to-text
5. **Draft saving** - Persist unsent messages when navigating away

---

## Summary

The final working solution is **simple and stable**:
- No complex state management for input height
- Manual bottom spacing control (not SafeAreaView automatic)
- Keyboard visibility tracking for dynamic padding
- Native TextInput multiline behavior (no wrapper views)
- Custom tab bar with keyboard-aware hiding

**Key insight:** Less state management = more stable UI. Let native components handle what they're designed for (multiline text growth), and only use state for what truly needs to be dynamic (keyboard visibility, measured heights).
