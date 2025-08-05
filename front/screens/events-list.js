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
import Message from '../components/Message';
import api from '../services/api';

export default function EventsListScreen({ navigation }) {
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  priceContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  price: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  enrollmentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  enrollmentText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
}); 