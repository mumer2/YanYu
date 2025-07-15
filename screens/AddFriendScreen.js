import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { db, auth } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AddFriendScreen() {
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentUid = auth.currentUser?.uid;

  const searchUserByEmail = async () => {
    if (!email.trim()) return Alert.alert('Enter an email to search.');

    setLoading(true);
    setFoundUser(null);

    try {
      const safeEmail = email.trim().toLowerCase();
      const emailDoc = await getDoc(doc(db, 'emails', safeEmail));
      
      if (!emailDoc.exists()) {
        setLoading(false);
        return Alert.alert('❌ User not found.');
      }

      const friendUid = emailDoc.data()?.uid;
      if (!friendUid) {
        setLoading(false);
        return Alert.alert('❌ UID not found in email mapping.');
      }

      if (friendUid === currentUid) {
        setLoading(false);
        return Alert.alert('⚠️ You cannot add yourself.');
      }

      const userDoc = await getDoc(doc(db, 'users', friendUid));
      if (!userDoc.exists()) {
        setLoading(false);
        return Alert.alert('⚠️ User data not found.');
      }

      // Check if already added
      const friendListDoc = await getDoc(doc(db, 'friends', currentUid, 'list', friendUid));
      if (friendListDoc.exists()) {
        setLoading(false);
        return Alert.alert('✅ Already added as a friend.');
      }

      const userData = userDoc.data();
      setFoundUser({ uid: friendUid, ...userData });
    } catch (error) {
      console.error('🔥 Search Error:', error);
      Alert.alert('Something went wrong while searching.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!foundUser) return;

    try {
      const friendUid = foundUser.uid;

      // Save friendship both ways
      await setDoc(doc(db, 'friends', currentUid, 'list', friendUid), {
        uid: friendUid,
        name: foundUser.name || '',
        email: foundUser.email || '',
        addedAt: Date.now(),
      });

      await setDoc(doc(db, 'friends', friendUid, 'list', currentUid), {
        uid: currentUid,
        name: auth.currentUser.displayName || '',
        email: auth.currentUser.email || '',
        addedAt: Date.now(),
      });

      Alert.alert('🎉 Friend added successfully!');
      setEmail('');
      setFoundUser(null);
    } catch (error) {
      console.error('🔥 Add Friend Error:', error);
      Alert.alert('Failed to add friend.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>🔍 Add a New Friend</Text>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter email to search"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchUserByEmail}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {foundUser && (
        <View style={styles.card}>
          <Text style={styles.name}>{foundUser.name || 'Unnamed User'}</Text>
          <Text style={styles.email}>{foundUser.email}</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
            <Text style={styles.addButtonText}>➕ Add Friend</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
