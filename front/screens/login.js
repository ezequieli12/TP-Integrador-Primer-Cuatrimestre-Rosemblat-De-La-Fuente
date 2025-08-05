import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Message from '../components/msg';
import api from '../services/api';
export default function login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/user/login', { username, password });
      
      if (response.data.success) {
        Alert.alert(
          'Exito',
          [
            {
              text: 'Ok',
              onPress: () => navigation.replace('EventsList')
            }
          ]
        );
      }
} catch (err) {
  const errorMessage = err.response?.data?.message || 'error';
  setError(errorMessage);
} finally {
  setLoading(false);
}
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="event" size={80} color="#007AFF" />
          <Text style={styles.title}>Eventos App</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        <Message loading={loading} type={error ? 'error' : 'info'} message={error} />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={username}
              onChangeText={setUsername}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
            style={styles.input}
            placeholder="Contraseña"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Iniciando sesion' : 'Iniciar sesion'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.navigate('register')}
          >
            <Text style={styles.registerText}>
              ¿Tenes cuenta? <Text style={styles.registerLink}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 15,
    fontFamily: 'Inter-ExtraBold'
  },
  subtitle: {
    fontSize: 17,
    color: '#94A3B8',
    marginTop: 8,
    fontFamily: 'Inter-Regular'
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#334155'
  },
  inputIcon: {
    marginRight: 12,
    color: '#64748B'
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: '#E2E8F0',
    fontFamily: 'Inter-Regular'
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8
  },
  buttonDisabled: {
    backgroundColor: '#475569',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
  registerButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular'
  },
  registerLink: {
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
});
