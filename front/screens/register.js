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
      setError('completa todos los campos');
      return false;
    }

    if (formData.first_name.length < 3) {
      setError('debe tener 3 o mas caracteres');
      return false;
    }

    if (formData.last_name.length < 3) {
      setError('debe tener 3  o mas caracteres');
      return false;
    }

    if (formData.password.length < 3) {
      setError('debe tener 3 o mas caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('no coinciden');
      return false;
    }

  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(formData.username)) {
  setError('no es válido');
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
          'exito',
     [
       {
        text: 'ok',
         onPress: () => navigation.navigate('Login')
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
        placeholder="confirmar contraseña"
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
              {loading ? 'creando' : 'crear cuenta'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              tenes cuenta? <Text style={styles.loginLink}>inicar sesion</Text>
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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
}); 