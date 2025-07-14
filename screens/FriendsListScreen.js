// screens/FriendsListScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, auth } from '../services/firebase';
import { doc, collection, getDocs } from 'firebase/firestore';

export default function FriendsListScreen({ navigation }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const loadFriends = async () => {
      const currentUid = auth.currentUser.uid;
      const friendsRef = collection(db, 'friends', currentUid, 'list');
      const snapshot = await getDocs(friendsRef);

      const friendList = [];
      for (const docSnap of snapshot.docs) {
        const userDoc = await getDoc(doc(db, 'users', docSnap.id));
        if (userDoc.exists()) {
          friendList.push({ uid: docSnap.id, ...userDoc.data() });
        }
      }

      setFriends(friendList);
    };

    loadFriends();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => navigation.navigate('Chat', { uid: item.uid, name: item.name })}
    >
      <Text style={styles.friendName}>{item.name || item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center' }}>No friends added yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  friendItem: {
    padding: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginVertical: 6,
  },
  friendName: { fontSize: 16 },
});
