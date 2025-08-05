import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>DEMO EVENTOS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    color: '#0ff',
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  textSmall: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
}); 