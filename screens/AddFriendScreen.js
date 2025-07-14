// screens/AddFriendScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

export default function AddFriendScreen() {
  const [email, setEmail] = useState('');

  const handleAddFriend = async () => {
    if (!email.trim()) return Alert.alert('Please enter an email.');

    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDoc(doc(db, 'emails', email)); // mapping email -> uid
      if (!querySnapshot.exists()) {
        return Alert.alert('User not found.');
      }

      const friendUid = querySnapshot.data().uid;
      const currentUid = auth.currentUser.uid;

      if (friendUid === currentUid) {
        return Alert.alert('You cannot add yourself.');
      }

      // Add each other as friends (no request logic for simplicity)
      await setDoc(doc(db, 'friends', currentUid, 'list', friendUid), { uid: friendUid }, { merge: true });
      await setDoc(doc(db, 'friends', friendUid, 'list', currentUid), { uid: currentUid }, { merge: true });

      Alert.alert('✅ Friend added!');
      setEmail('');
    } catch (error) {
      console.log('Add Friend Error:', error);
      Alert.alert('Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Friend by Email</Text>
      <TextInput
        placeholder="Enter friend's email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleAddFriend}>
        <Text style={styles.buttonText}>➕ Add Friend</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
