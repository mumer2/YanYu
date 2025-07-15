import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function FriendsListScreen() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const listRef = collection(db, 'friends', currentUserId, 'list');

    const unsubscribe = onSnapshot(listRef, async (snapshot) => {
      try {
        const friendProfiles = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const friendId = docSnap.id;
            const userRef = doc(db, 'users', friendId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const data = userDoc.data();
              return {
                id: friendId,
                name: data.name || 'Unnamed',
                email: data.email || '',
                isPaid: data.isPaid,
              };
            } else {
              return null;
            }
          })
        );

        const filtered = friendProfiles.filter(Boolean);
        setFriends(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Error loading friends:', err);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // cleanup listener on unmount
  }, []);

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() =>
        navigation.navigate('Chat', {
          friend: {
            uid: item.id,
            name: item.name,
            email: item.email,
          },
        })
      }
      style={({ pressed }) => [
        styles.card,
        pressed && { backgroundColor: '#eef1f7' },
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={[styles.badge, item.isPaid ? styles.paid : styles.free]}>
          {item.isPaid ? '💎 Premium User' : 'Free User'}
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f9' }}>
      <FlatList
        ListHeaderComponent={
          <Text style={styles.screenTitle}>👥 Friend List</Text>
        }
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#777',
  },
  badge: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  paid: {
    backgroundColor: '#e0f8ec',
    color: '#1a9c6e',
  },
  free: {
    backgroundColor: '#eaeaea',
    color: '#444',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
