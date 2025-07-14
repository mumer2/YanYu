import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const chats = [
  {
    id: '1',
    name: 'Jane Doe',
    lastMessage: 'Hi! How are you?',
    time: '12:30 PM',
  },
  {
    id: '2',
    name: 'John Smith',
    lastMessage: 'Let’s meet tomorrow.',
    time: '09:15 AM',
  },
];

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await signOut(auth);
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat')}
    >
      <View style={styles.chatAvatar}>
        <Ionicons name="person-circle" size={42} color="#555" />
      </View>
      <View style={styles.chatContent}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatMessage}>{item.lastMessage}</Text>
      </View>
      <Text style={styles.chatTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>YanYu</Text>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search chats..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Chat List */}
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingBottom: 60 }} // extra bottom space
        />

        {/* Dotted Menu */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuBox}>
             <TouchableOpacity onPress={() => {
  setMenuVisible(false);
  navigation.navigate('Profile');
}}>
  <Text style={styles.menuItem}>👤 Profile</Text>
</TouchableOpacity>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Settings'); // Ensure screen exists
                }}
              >
                <Text style={styles.menuText}>Settings</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={handleLogout}>
                <Text style={[styles.menuText, { color: 'red' }]}>Logout</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  searchBar: {
    flexDirection: 'row',
    padding: 12,
    margin: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    alignItems: 'center',
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  chatAvatar: { marginRight: 12 },
  chatContent: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: 'bold' },
  chatMessage: { color: '#666', marginTop: 2 },
  chatTime: { fontSize: 12, color: '#999' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    width: 150,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuText: { fontSize: 16 },
});
