import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsScreen({ navigation }) {
  const user = auth.currentUser;
  const [selectedLang, setSelectedLang] = useState('English');

  useEffect(() => {
    const fetchLang = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.language) setSelectedLang(data.language);
        }
      } catch (e) {
        console.error('Failed to load language:', e);
      }
    };

    fetchLang();
  }, []);

  const changeLanguage = async (lang) => {
    setSelectedLang(lang);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { language: lang }, { merge: true });
      Alert.alert('Language updated to', lang);
    } catch (e) {
      console.error('Failed to update language:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Select Language</Text>

      {['English', '中文'].map((lang) => (
        <TouchableOpacity
          key={lang}
          style={[
            styles.langOption,
            selectedLang === lang && styles.activeLang,
          ]}
          onPress={() => changeLanguage(lang)}
        >
          <Text style={styles.langText}>
            {selectedLang === lang ? '✅ ' : ''}{lang}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
  style={{ marginTop: 30 }}
  onPress={() => navigation.navigate('DeleteAccount')}
>
  <Text style={{ color: 'red', fontSize: 16 }}>Delete My Account</Text>
</TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  langOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  langText: { fontSize: 18 },
  activeLang: {
    backgroundColor: '#e6f0ff',
  },
});
