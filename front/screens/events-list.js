import React, { useEffect, useState } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Message from '../components/msg';
import api from '../services/api';

export default function eventslist({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchEvents = async (pageNum = 1, searchTerm = '') => {
    try {
      const params = { page: pageNum, limit: 10 };
      if (searchTerm) params.name = searchTerm;
      
      const response = await api.get('/event', { params });
      
      if (pageNum === 1) {
        setEvents(response.data.collection || []);
      } else {
        setEvents(prev => [...prev, ...(response.data.collection || [])]);
      }
      
      setHasMore(response.data.pagination?.nextPage !== null);
      setError('');
    } catch (err) {
      setError('error');
      console.error('error:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchEvents(1, search);
    setRefreshing(false);
  };
  const loadMore = async () => {
    if (!hasMore || loading) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchEvents(nextPage, search);
  };
  const handleSearch = () => {
    setPage(1);
    fetchEvents(1, search);
  };
  const handleEventPress = (event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
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

useEffect(() => {
    fetchEvents(1, search);
    setLoading(false);
  }, []);

  const renderEventItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventItem} 
      onPress={() => handleEventPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>
      </View>
      
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.eventDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="event" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(item.start_date)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>{item.duration_in_minutes} min</Text>
        </View>
        
        <View style={styles.detailItem}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.event_location?.name || 'no disponible'}
          </Text>
        </View>
      </View>
      
      <View style={styles.eventFooter}>
        <View style={styles.capacityContainer}>
          <MaterialIcons name="people" size={16} color="#666" />
          <Text style={styles.capacityText}>
            {item.max_assistance} personas
          </Text>
        </View>
        <View style={[
          styles.enrollmentStatus,
          { backgroundColor: item.enabled_for_enrollment === '1' ? '#4CAF50' : '#FF9800' }
        ]}>
        <Text style={styles.enrollmentText}>
    {item.enabled_for_enrollment === '1' ? 'abiertas' : 'cerradas'}
        </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>cargando</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>cargando</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="buscando"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); handleSearch(); }}>
              <MaterialIcons name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <MaterialIcons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Message loading={false} type={error ? 'error' : 'info'} message={error} />

      <FlatList
        data={events}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderEventItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No se encontraron eventos</Text>
              <Text style={styles.emptySubtext}>
                {search ? 'intenta de nuevo' : 'no hay eventos disponibles'}
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular'
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  listContainer: {
    padding: 18,
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 12,
    fontFamily: 'Inter-Bold'
  },
  priceContainer: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },
  price: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold'
  },
  eventDescription: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular'
  },
  eventDetails: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-Medium'
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
    fontFamily: 'Inter-Medium'
  },
  enrollmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  enrollmentText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Inter-Bold'
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#64748B',
    fontSize: 15,
    fontFamily: 'Inter-Medium'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 70,
  },
  emptyText: {
    fontSize: 19,
    color: '#64748B',
    marginTop: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold'
  },
  emptySubtext: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Inter-Regular'
  },
});
