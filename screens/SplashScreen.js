// screens/SplashScreen.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007aff" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 12, fontSize: 16, color: '#666' },
});
