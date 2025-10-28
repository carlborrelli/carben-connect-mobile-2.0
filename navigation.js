// Navigation - Main navigation structure
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen from './screens/HomeScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import InboxScreen from './screens/InboxScreen';
import ClientsScreen from './screens/ClientsScreen';
import MoreScreen from './screens/MoreScreen';

// Components
import CustomTabBar from './components/CustomTabBar';

const Tab = createBottomTabNavigator();
const ProjectsStack = createNativeStackNavigator();

// Projects Stack Navigator (includes list and detail)
function ProjectsStackScreen() {
  return (
    <ProjectsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProjectsStack.Screen name="ProjectsList" component={ProjectsScreen} />
      <ProjectsStack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
    </ProjectsStack.Navigator>
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
        <Tab.Screen name="Projects" component={ProjectsStackScreen} />
        <Tab.Screen name="Inbox" component={InboxScreen} />
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Clients" component={ClientsScreen} />
        <Tab.Screen name="More" component={MoreScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
