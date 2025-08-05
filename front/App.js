import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import login from './screens/login';
import register from './screens/register';
import eventslist from './screens/events-list';
import eventdetail from './screens/event-detail';
import profile from './screens/profile';
import home from './screens/home';
import about from './screens/about';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Events') {
            iconName = 'calendar';
          } else if (route.name === 'Profile') {
            iconName = 'user';
          } else if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'About') {
            iconName = 'info';
          }

          return <Feather name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginBottom: 5
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Home" component={home} />
      <Tab.Screen name="Events" component={eventslist} />
      <Tab.Screen name="Profile" component={profile} />
      <Tab.Screen name="About" component={about} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2
          },
          headerTintColor: '#1E293B',
          headerTitleStyle: {
            fontWeight: '600',
            fontFamily: 'Inter-SemiBold'
          },
          headerBackTitleVisible: false
        }}
      >
        <Stack.Screen 
          name="login" 
          component={login} 
          options={{ 
            title: 'Iniciar Sesión',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="register" 
          component={register} 
          options={{ 
            title: 'Registrarse',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="event-detail" 
          component={eventdetail} 
          options={{ 
            title: 'Detalles del Evento',
            headerBackImage: () => (
              <Feather name="chevron-left" size={24} color="#3B82F6" style={{ marginLeft: 15 }} />
            )
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}