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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutContainer: {
    marginTop: 32,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 8,
  },
}); 