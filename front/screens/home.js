import React, { useEffect, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import Message from '../components/msg';
import api from '../services/api';
export default function home({ navigation }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/hello')
      .then(res => {
        setMessage(res.data.message);
        setError('');
      })
      .catch(() => {
        setError('error');
        setMessage('');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Message
        loading={loading}
        type={error ? 'error' : 'info'}
        message={error || message}
      />
      <Button title="acerca de" onPress={() => navigation.navigate('About')} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 30,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  }
});
