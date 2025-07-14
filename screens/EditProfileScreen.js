import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

export default function EditProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [name, setName] = useState('');

  // 🔄 Load current name from Auth and Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setName(user.displayName || '');

        // Optional: Fetch Firestore user doc if needed later
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.name && !user.displayName) {
            setName(data.name);
          }
        }
      } catch (e) {
        console.error('❌ Failed to load user profile:', e);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      // 🔄 Update display name in Firebase Auth
      await updateProfile(user, { displayName: name });

      // 🔄 Also store in Firestore for backup
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { name }, { merge: true });

      Alert.alert('✅ Success', 'Name updated!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error updating:', error);
      Alert.alert('Update Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✏️ Edit Profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Enter your name"
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>💾 Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
