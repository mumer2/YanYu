import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import i18n from '../i18n';

export default function LanguageScreen({ navigation }) {
  const setLanguage = (lang) => {
    i18n.locale = lang;
    navigation.replace('Home'); // go to main app after language selected
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('chooseLang')}</Text>
      <View style={styles.button}>
        <Button title="English" onPress={() => setLanguage('en')} />
      </View>
      <View style={styles.button}>
        <Button title="中文" onPress={() => setLanguage('zh')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, marginBottom: 40 },
  button: { marginVertical: 10, width: 200 },
});
