import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
export default function msg({ type = 'info', message, loading }) {
  const getMessageConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'error',
          color: '#FF6B6B',
          backgroundColor: '#FFEBEE',
          borderColor: '#FFCDD2'
        };
      case 'success':
        return {
          icon: 'check-circle',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          borderColor: '#C8E6C9'
        };
      case 'warning':
        return {
          icon: 'warning',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          borderColor: '#FFE0B2'
        };
      default:
        return {
          icon: 'info',
          color: '#007AFF',
          backgroundColor: '#E3F2FD',
          borderColor: '#BBDEFB'
        };
    }
  };
  const config = getMessageConfig();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={config.color} />
        <Text style={[styles.loadingText, { color: config.color }]}>
          {message || 'cargando'}
        </Text>
      </View>
    );
  }
  if (!message) return null;

  return (
    <View style={[
      styles.messageContainer,
      {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor
      }
    ]}>
      <MaterialIcons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.messageText, { color: config.color }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
}); 