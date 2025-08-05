import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
export default function profile({ navigation }) {
  const [user] = useState({
    name: 'Usuario Demo',
    email: 'usuario@demo.com',
    eventsCreated: 5,
    eventsEnrolled: 12
  });

  const handleLogout = () => {
    Alert.alert(
      'cerrar sesion',
      'seguro?',
      [
        {
          text: 'cancelar',
          style: 'cancel',
        },
        {
          text: 'cerrar sesion',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
        },
      },
  ]
);
  };
  const menuItems = [
    {
      icon: 'event',
      title: 'mis eventos',
      subtitle: 'eventos creados',
      onPress: () => Alert.alert('mis eventos'),
    },
       {
      icon: 'location-on',
      title: 'mis ubicaciones',
      subtitle: 'ubicaciones creadas',
      onPress: () => Alert.alert('mis ubicaciones'),
    },
    {
      icon: 'people',
      title: 'eventos inscritos',
      subtitle: 'eventos inscritos',
      onPress: () => Alert.alert('eventos inscritos'),
    },
 
    {
      icon: 'settings',
      title: 'config',
      subtitle: 'ajustes',
      onPress: () => Alert.alert('config'),
    },
    {
      icon: 'help',
      title: 'ayuda',
      subtitle: 'ayuda',
      onPress: () => Alert.alert('ayuda'),
    },
  ];
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color="#007AFF" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialIcons name="event" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{user.eventsCreated}</Text>
          <Text style={styles.statLabel}>Eventos Creados</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="people" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{user.eventsEnrolled}</Text>
          <Text style={styles.statLabel}>Eventos Inscritos</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemContent}>
              <MaterialIcons name={item.icon} size={24} color="#007AFF" />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#FF6B6B" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  avatarContainer: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    fontFamily: 'Inter-Bold'
  },
  userEmail: {
    fontSize: 17,
    color: '#64748B',
    fontFamily: 'Inter-Regular'
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    marginBottom: 6,
    fontFamily: 'Inter-Bold'
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Inter-Medium'
  },
  menuContainer: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 15,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold'
  },
  menuItemSubtitle: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: 'Inter-Regular'
  },
  logoutContainer: {
    marginTop: 35,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  logoutButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 12,
    fontFamily: 'Inter-SemiBold'
  },
});
