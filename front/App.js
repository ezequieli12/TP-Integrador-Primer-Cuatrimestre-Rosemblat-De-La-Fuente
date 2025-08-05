import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import login from './screens/login';
import register from './screens/register';
import eventslist from './screens/events-list';
import eventdetail from './screens/event-detail';
import profile from './screens/profile';
import home from './screens/home';
import about from './screens/about';

const Stack = createStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="login">
        <Stack.Screen name="login" component={login} options={{ title: 'inicar sesion' }} />
        <Stack.Screen name="register" component={register} options={{ title: 'registrar' }} />
        <Stack.Screen name="events-list" component={eventslist} options={{ title: 'events' }} />
        <Stack.Screen name="event-detail" component={eventdetail} options={{ title: 'event details' }} />
         <Stack.Screen name="profile" component={profile} options={{ title: 'profile' }} />
        <Stack.Screen name="home" component={home} options={{ title: 'inicar' }} />
       <Stack.Screen name="about" component={about} options={{ title: 'acerca de' }} />
      </Stack.Navigator>
    </NavigationContainer>


  )
  ;
}