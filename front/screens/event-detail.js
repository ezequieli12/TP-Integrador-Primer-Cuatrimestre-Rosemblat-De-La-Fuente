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
          <Text style={styles.sectionTitle}>Descripcion</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Info Evento</Text>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="event" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fecha y Hora</Text>
              <Text style={styles.infoValue}>{formatDate(event.start_date)}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Duracion</Text>
              <Text style={styles.infoValue}>{event.duration_in_minutes} Minutos</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <MaterialIcons name="people" size={20} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Capacidad</Text>
              <Text style={styles.infoValue}>{event.max_assistance} Personas</Text>
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
            <Text style={styles.sectionTitle}>Ubicacion</Text>
            
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 17,
    color: '#64748B',
    fontFamily: 'Inter-Medium'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 30,
  },
  errorText: {
    fontSize: 19,
    color: '#64748B',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold'
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 25,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  eventName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    fontFamily: 'Inter-Bold'
  },
  priceContainer: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  price: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    fontFamily: 'Inter-Bold'
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 15,
    fontFamily: 'Inter-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    fontFamily: 'Inter-Regular'
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 8
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 3,
    fontFamily: 'Inter-Medium'
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
  locationCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 10,
    fontFamily: 'Inter-Bold'
  },
  locationAddress: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular'
  },
  locationDetails: {
    marginBottom: 20,
  },
  locationDetail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
    fontFamily: 'Inter-Regular'
  },
  detailLabel: {
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'Inter-SemiBold'
  },
  mapButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'Inter-SemiBold'
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10
  },
  tagItem: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  creatorInfo: {
    marginLeft: 15,
    flex: 1,
  },
  creatorName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 5,
    fontFamily: 'Inter-Bold'
  },
  creatorEmail: {
    fontSize: 15,
    color: '#64748B',
    fontFamily: 'Inter-Regular'
  },
  enrollmentSection: {
    marginTop: 25,
  },
  enrollmentButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: '#94A3B8',
  },
  enrollmentButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'Inter-SemiBold'
  },
});