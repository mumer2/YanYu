import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db, storage } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileScreen({ navigation }) {
  const user = auth.currentUser;
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user data every time screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        if (!user) return;

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.name || user.displayName || '');
            setPhotoURL(data.photoURL || user.photoURL || null);
          } else {
            setName(user.displayName || '');
            setPhotoURL(user.photoURL || null);
          }
        } catch (error) {
          console.log('⚠️ Failed to load user data:', error);
        }
      };

      loadUserData();
    }, [user])
  );

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission required to access media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setLoading(true);
      const imageUri = result.assets[0].uri;
      await uploadProfilePhoto(imageUri);
      setLoading(false);
    }
  };

  const uploadProfilePhoto = async (uri) => {
    try {
      if (!user) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `profilePhotos/${user.uid}.jpg`);
      await uploadBytes(fileRef, blob);

      const downloadURL = await getDownloadURL(fileRef);

      // Update Firebase Auth profile photoURL
      await updateProfile(user, { photoURL: downloadURL });
      setPhotoURL(downloadURL);

      // Update Firestore user document
      await setDoc(
        doc(db, 'users', user.uid),
        { photoURL: downloadURL },
        { merge: true }
      );

      Alert.alert('✅ Profile photo updated');
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      Alert.alert('Upload failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>

      <TouchableOpacity
        onPress={handlePickImage}
        style={styles.photoWrap}
        disabled={loading}
      >
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>📷</Text>
          </View>
        )}
        <Text style={[styles.changeText, loading && { color: '#999' }]}>
          {loading ? 'Uploading...' : 'Change Photo'}
        </Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{name || 'N/A'}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user?.email || 'N/A'}</Text>

        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user?.uid || 'N/A'}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.buttonText}>✏️ Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  photoWrap: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, color: '#666' },
  changeText: { marginTop: 8, color: '#007AFF', fontSize: 14 },

  card: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, color: '#333', marginTop: 4 },

  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  logoutBtn: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
