import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import EventsListScreen from './screens/EventsListScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'inicar sesion' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'registrar' }} />
        <Stack.Screen name="EventsList" component={EventsListScreen} options={{ title: 'events' }} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'event details' }} />
         <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'profile' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'inicar' }} />
       <Stack.Screen name="About" component={AboutScreen} options={{ title: 'acerca de' }} />
      </Stack.Navigator>
    </NavigationContainer>


  )
  ;
}