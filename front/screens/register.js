import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Message from '../components/msg';
import api from '../services/api';
export default function register({ navigation }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.username || !formData.password) {
      setError('Completa todos los campos');
      return false;
    }

    if (formData.first_name.length < 3) {
      setError('Nombre debe tener 3 o mas caracteres');
      return false;
    }

    if (formData.last_name.length < 3) {
      setError('Apellido debe tener 3  o mas caracteres');
      return false;
    }

    if (formData.password.length < 3) {
      setError('Contraseña debe tener 3 o mas caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('No coinciden las contraseñas');
      return false;
    }

  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(formData.username)) {
  setError('No es válido el email');
  return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await api.post('/user/register', registerData);

      if (response.data.success) {
        Alert.alert(
          'Exito',
     [
       {
        text: 'Ok',
         onPress: () => navigation.navigate('login')
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="person-add" size={80} color="#007AFF" />
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Completa tus datos para registrarte</Text>
        </View>

        <Message loading={loading} type={error ? 'error' : 'info'} message={error} />

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#999"
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              placeholderTextColor="#999"
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
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

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
        placeholder="Confirmar contraseña"
        placeholderTextColor="#999"
        secureTextEntry={!showConfirmPassword}
        value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <MaterialIcons 
                name={showConfirmPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creando' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('login')}
          >
            <Text style={styles.loginText}>
              ¿Tenes cuenta? <Text style={styles.loginLink}>Inicar sesion</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 35,
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
    textAlign: 'center',
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
  loginButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular'
  },
  loginLink: {
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
});
