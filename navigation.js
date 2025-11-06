// Navigation - Main navigation structure
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import NewProjectScreen from './screens/NewProjectScreen';
import AddPhotosScreen from './screens/AddPhotosScreen';
import DraftsScreen from './screens/DraftsScreen';
import EstimateWorkspaceScreen from './screens/EstimateWorkspaceScreen';
import InboxScreen from './screens/InboxScreen';
import ConversationScreen from './screens/ConversationScreen';
import ClientsScreen from './screens/ClientsScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import MoreScreen from './screens/MoreScreen';
import ProfileScreen from './screens/ProfileScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import UserEditScreen from './screens/UserEditScreen';
import QuickBooksScreen from './screens/QuickBooksScreen';

// Components
import CustomTabBar from './components/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create stack navigators for each tab that needs detail screens
function ProjectsStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProjectsList" component={ProjectsScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="NewProject" component={NewProjectScreen} />
      <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <Stack.Screen name="Drafts" component={DraftsScreen} />
      <Stack.Screen name="EstimateWorkspace" component={EstimateWorkspaceScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// Home center button - round orange button
function HomeStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

// NewProject tab - regular tab next to Home
function NewProjectStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewProjectMain" component={NewProjectScreen} />
      <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <Stack.Screen name="EstimateWorkspace" component={EstimateWorkspaceScreen} />
    </Stack.Navigator>
  );
}

function InboxStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InboxMain" component={InboxScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function ClientsStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientsMain" component={ClientsScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function MoreStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMain" component={MoreScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="UserEdit" component={UserEditScreen} />
      <Stack.Screen name="QuickBooks" component={QuickBooksScreen} />
      <Stack.Screen name="Clients" component={ClientsScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
      <Stack.Screen name="Drafts" component={DraftsScreen} />
      <Stack.Screen name="EstimateWorkspace" component={EstimateWorkspaceScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
        screenListeners={({ navigation, route }) => ({
          blur: () => {
            // 1) Read the full state tree
            const root = navigation.getState();

            // 2) Find this tab's route
            const tabRoute = root.routes.find(r => r.key === route.key);

            // 3) Get the child navigator state (the stack)
            const child = tabRoute?.state;

            // 4) If the stack is nested, pop it to root
            if (child?.type === 'stack' && child.index > 0) {
              const childNavKey = child.key; // Target the child navigator, not the tab route

              navigation.dispatch({
                ...StackActions.popToTop(),
                target: childNavKey, // This is the critical piece - target the child stack key
              });
            }
          },
        })}
        initialRouteName="Home"
      >
        <Tab.Screen name="Projects" component={ProjectsStackScreen} />
        <Tab.Screen
          name="Inbox"
          component={InboxStackScreen}
          options={{ tabBarHideOnKeyboard: true }}
        />
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="NewProject" component={NewProjectStackScreen} />
        <Tab.Screen name="More" component={MoreStackScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
