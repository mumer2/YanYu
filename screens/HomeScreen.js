import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../services/firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [chats, setChats] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const friendsRef = collection(db, 'friends', user.uid, 'list');
    const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
      const newChats = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const friendId = docSnap.id;
          const userId = user.uid;
          const roomId = [userId, friendId].sort().join('_');
          const friendRef = doc(db, 'users', friendId);
          const friendSnap = await getDoc(friendRef);

          let name = 'Unknown';
          let email = '';
          if (friendSnap.exists()) {
            const data = friendSnap.data();
            name = data.name || 'No Name';
            email = data.email || '';
          }

          return {
            id: friendId,
            name,
            email,
            roomId,
            lastMessage: '',
            unreadCount: 0,
          };
        })
      );

      setChats(newChats);
    });

    return () => unsubscribe();
  }, [user]);

  // Live updates for unread counts and last messages
  useEffect(() => {
    const unsubscribers = chats.map((chat, index) => {
      const msgRef = collection(db, 'chats', chat.roomId, 'messages');
      const q = query(msgRef, orderBy('createdAt', 'desc'));

      return onSnapshot(q, (snapshot) => {
        let unread = 0;
        let lastMessage = '';

        snapshot.docs.forEach((docSnap, i) => {
          const data = docSnap.data();
          if (i === 0) {
            lastMessage = data.text || '';
          }
          if (!data.readBy?.includes(user.uid)) {
            unread++;
          }
        });

        setChats((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lastMessage,
            unreadCount: unread,
          };
          return updated;
        });
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [chats]);

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = async () => {
    await signOut(auth);
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        navigation.navigate('Chat', {
          friend: { uid: item.id, name: item.name, email: item.email },
        })
      }
    >
      <View style={styles.chatAvatar}>
        <Ionicons name="person-circle" size={42} color="#555" />
      </View>
      <View style={styles.chatContent}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.chatName}>{item.name}</Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {item.lastMessage || 'No messages yet.'}
        </Text>
      </View>
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
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={{ marginRight: 8 }}
          />
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
          contentContainerStyle={{ paddingBottom: 60 }}
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
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Profile');
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>👤 Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Settings');
                }}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>⚙️ Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogout}
                style={styles.menuItem}
              >
                <Text style={[styles.menuItemText, { color: 'red' }]}>
                  🚪 Logout
                </Text>
              </TouchableOpacity>
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
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    width: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
});
