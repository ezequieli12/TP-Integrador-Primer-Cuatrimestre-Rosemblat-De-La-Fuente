import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function msg({ type = 'info', message, loading }) {
  const getMessageConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-triangle',
          color: '#ff0015ff',
          backgroundColor: '#FFF0F0',
          borderColor: '#ffffffff'
        };
      case 'success':
        return {
          icon: 'check-circle',
          color: '#2ED573',
          backgroundColor: '#F0FFF4',
          borderColor: '#C6F6D5'
        };
      case 'warning':
        return {
          icon: 'alert-octagon',
          color: '#FFA502',
          backgroundColor: '#FFF9F0',
          borderColor: '#FFE8C5'
        };
      default:
        return {
          icon: 'info',
          color: '#1E90FF',
          backgroundColor: '#F0F8FF',
          borderColor: '#BFE2FF'
        };
    }
  };

  const config = getMessageConfig();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={config.color} />
        <Text style={[styles.loadingText, { color: config.color }]}>
          {message || 'Cargando...'}
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
      <Feather name={config.icon} size={22} color={config.color} />
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
    paddingVertical: 25,
  },
  loadingText: {
    fontSize: 17,
    marginTop: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Medium'
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 0,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  messageText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
    fontFamily: 'Inter-Regular'
  },
});