import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

 const handleRegister = async () => {
  if (!name || !email || !password) {
    Alert.alert('Error', 'Please fill in all fields.');
    return;
  }

  setLoading(true);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

    await updateProfile(userCredential.user, { displayName: name });

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      name,
      email: userCredential.user.email,
      createdAt: serverTimestamp(),
      role: 'user',
      isPaid: false,
      language: 'en',
    });

    const cleanEmail = email.trim().toLowerCase();
    await setDoc(doc(db, 'emails', cleanEmail), {
      uid: userCredential.user.uid,
    });

    await signOut(auth);
    Alert.alert('Success', 'Account created! Please log in.');
  } catch (error) {
    console.error('Registration Error:', error);
    Alert.alert('Registration Failed', error.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.logo}>YanYu 言遇</Text>
      <Text style={styles.title}>Register</Text>

      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#aaa"
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#aaa"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#aaa"
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f4f4f9' },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#3f51b5', marginBottom: 10 },
  title: { fontSize: 20, marginBottom: 20 },
  input: {
    width: '100%', height: 50, backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 15, borderWidth: 1, borderColor: '#ddd', marginBottom: 15, fontSize: 16,
  },
  button: {
    width: '100%', backgroundColor: '#3f51b5',
    padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#3f51b5', fontSize: 15 },
});
