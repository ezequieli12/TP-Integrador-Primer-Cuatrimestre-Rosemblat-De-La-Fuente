import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Message from '../components/msg';
import api from '../services/api';

export default function eventdetail({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const fetchEventDetail = async () => {
    try {
      const response = await api.get(`/event/${eventId}`);
      setEvent(response.data);
      setError('');
    } catch (err) {
      setError('error');
      console.error('error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/event/${eventId}/enrollment`);
      setIsEnrolled(true);
      Alert.alert('exito');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'error';
      Alert.alert('error', errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCancelEnrollment = async () => {
    setEnrolling(true);
    try {
      await api.delete(`/event/${eventId}/enrollment`);
      setIsEnrolled(false);
      Alert.alert('exito');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'error';
      Alert.alert('error', errorMessage);
    } finally {
      setEnrolling(false);
    }
  };
  const formatDate = (dateString) => {
const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `$${parseInt(price).toLocaleString()}`;
  };

  const openMaps = () => {
    if (event?.event_location?.latitude && event?.event_location?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${event.event_location.latitude},${event.event_location.longitude}`;
      Linking.openURL(url);
    }
  };
  useEffect(() => {
  fetchEventDetail();
  }, [eventId]);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>loading</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>{error || 'no encontrado'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEventDetail}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eventName}>{event.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(event.price)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>descripcion</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>info evento</Text>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="event" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>fecha y hora</Text>
              <Text style={styles.infoValue}>{formatDate(event.start_date)}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>duracion</Text>
              <Text style={styles.infoValue}>{event.duration_in_minutes} minutos</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="people" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Capacidad</Text>
              <Text style={styles.infoValue}>{event.max_assistance} personas</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons 
              name={event.enabled_for_enrollment === '1' ? 'check-circle' : 'cancel'} 
              size={20} 
              color={event.enabled_for_enrollment === '1' ? '#4CAF50' : '#FF9800'} 
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Inscripciones</Text>
              <Text style={styles.infoValue}>
                {event.enabled_for_enrollment === '1' ? 'abiertas' : 'cerradas'}
              </Text>
            </View>
          </View>
        </View>
        {event.event_location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ubicacion</Text>
            
      <View style={styles.locationCard}>
      <View style={styles.locationHeader}>
      <MaterialIcons name="location-on" size={24} color="#007AFF" />
      <Text style={styles.locationName}>{event.event_location.name}</Text>
      </View>
              <Text style={styles.locationAddress}>{event.event_location.full_address}</Text>
              <View style={styles.locationDetails}>
                <Text style={styles.locationDetail}>
                  <Text style={styles.detailLabel}>localidad:</Text> {event.event_location.location?.name}
                </Text>
                <Text style={styles.locationDetail}>
                  <Text style={styles.detailLabel}>provincia:</Text> {event.event_location.location?.province?.name}
                </Text>
                <Text style={styles.locationDetail}>
                  <Text style={styles.detailLabel}>capacidad:</Text> {event.event_location.max_capacity} personas
                </Text>
              </View>

              <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
                <MaterialIcons name="map" size={20} color="#fff" />
                <Text style={styles.mapButtonText}>mapa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {event.tags && event.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>label</Text>
            <View style={styles.tagsContainer}>
              {event.tags.map((tag, index) => (
              <View key={index} style={styles.tagItem}>
            <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {event.creator_user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>organizer</Text>
            <View style={styles.creatorCard}>
              <MaterialIcons name="person" size={24} color="#007AFF" />
              <View style={styles.creatorInfo}>
                <Text style={styles.creatorName}>
                  {event.creator_user.first_name} {event.creator_user.last_name}
                </Text>
                <Text style={styles.creatorEmail}>{event.creator_user.username}</Text>
              </View>
            </View>
          </View>
        )}

        {event.enabled_for_enrollment === '1' && (
          <View style={styles.enrollmentSection}>
            <TouchableOpacity 
              style={[
                styles.enrollmentButton,
                isEnrolled && styles.cancelButton,
                enrolling && styles.buttonDisabled
              ]}
              onPress={isEnrolled ? handleCancelEnrollment : handleEnroll}
              disabled={enrolling}
            >
              <MaterialIcons 
                name={isEnrolled ? "cancel" : "add"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.enrollmentButtonText}>
                {enrolling 
                  ? 'cargando' 
                  : isEnrolled 
                    ? 'cancelar' 
                    : 'inscribirse'
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceContainer: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  price: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationDetails: {
    marginBottom: 16,
  },
  locationDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  mapButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  creatorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  creatorEmail: {
    fontSize: 14,
    color: '#666',
  },
  enrollmentSection: {
    marginTop: 20,
  },
  enrollmentButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  enrollmentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 