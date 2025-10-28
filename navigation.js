// Navigation - Main navigation structure
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import NewProjectScreen from './screens/NewProjectScreen';
import AddPhotosScreen from './screens/AddPhotosScreen';
import InboxScreen from './screens/InboxScreen';
import ConversationScreen from './screens/ConversationScreen';
import ClientsScreen from './screens/ClientsScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import MoreScreen from './screens/MoreScreen';
import ProfileScreen from './screens/ProfileScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';

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
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="NewProject" component={NewProjectScreen} />
      <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
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
        initialRouteName="Home"
      >
        <Tab.Screen
          name="Projects"
          component={ProjectsStackScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Get current route in this tab
              const state = navigation.getState();
              const currentTab = state.routes.find(route => route.name === 'Projects');
              
              // If we're already on this tab and in a nested screen, reset to root
              if (currentTab && state.index === state.routes.indexOf(currentTab)) {
                const tabState = currentTab.state;
                if (tabState && tabState.index > 0) {
                  e.preventDefault();
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'ProjectsList' }],
                    })
                  );
                }
              }
            },
          })}
        />
        <Tab.Screen
          name="Inbox"
          component={InboxStackScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              const state = navigation.getState();
              const currentTab = state.routes.find(route => route.name === 'Inbox');
              
              if (currentTab && state.index === state.routes.indexOf(currentTab)) {
                const tabState = currentTab.state;
                if (tabState && tabState.index > 0) {
                  e.preventDefault();
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'InboxMain' }],
                    })
                  );
                }
              }
            },
          })}
        />
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              const state = navigation.getState();
              const currentTab = state.routes.find(route => route.name === 'Home');
              
              if (currentTab && state.index === state.routes.indexOf(currentTab)) {
                const tabState = currentTab.state;
                if (tabState && tabState.index > 0) {
                  e.preventDefault();
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'HomeMain' }],
                    })
                  );
                }
              }
            },
          })}
        />
        <Tab.Screen
          name="Clients"
          component={ClientsStackScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              const state = navigation.getState();
              const currentTab = state.routes.find(route => route.name === 'Clients');
              
              if (currentTab && state.index === state.routes.indexOf(currentTab)) {
                const tabState = currentTab.state;
                if (tabState && tabState.index > 0) {
                  e.preventDefault();
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'ClientsMain' }],
                    })
                  );
                }
              }
            },
          })}
        />
        <Tab.Screen
          name="More"
          component={MoreStackScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              const state = navigation.getState();
              const currentTab = state.routes.find(route => route.name === 'More');
              
              if (currentTab && state.index === state.routes.indexOf(currentTab)) {
                const tabState = currentTab.state;
                if (tabState && tabState.index > 0) {
                  e.preventDefault();
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'MoreMain' }],
                    })
                  );
                }
              }
            },
          })}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
