import React, { useState, useEffect, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

export default function ChatScreen({ route, navigation }) {
  const { friend } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const timerRef = useRef(null);
  const user = auth.currentUser;

  const currentUserId = user?.uid;
  const chatRoomId = [currentUserId, friend.uid].sort().join('_');

  useEffect(() => {
    navigation.setOptions({
      title: friend.name || 'Chat',
      headerBackTitleVisible: false,
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 16 }}>
          <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, friend]);

  useEffect(() => {
    if (!user || !friend) return;

    const fetchMessages = async () => {
      try {
        const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.data().text,
          sender: doc.data().sender,
        }));

        setMessages(fetched);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [user, friend]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        const updated = prev + 1;

        if (updated === 50 && !isSubscribed) {
          setShowWarningModal(true);
        }

        if (updated >= 60 && !isSubscribed) {
          clearInterval(timerRef.current);
          setShowWarningModal(false);
          setShowLockModal(true);
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || (!isSubscribed && seconds >= 60)) return;

    const newMessage = {
      text: input.trim(),
      sender: currentUserId,
      createdAt: serverTimestamp(),
    };

    try {
      const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
      const docRef = await addDoc(messagesRef, newMessage);

      setMessages((prev) => [
        { id: docRef.id, text: input.trim(), sender: currentUserId },
        ...prev,
      ]);
      setInput('');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === currentUserId;
    return (
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.userBubble : styles.friendBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  const handleSubscribe = () => {
    setIsSubscribed(true);
    setShowLockModal(false);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
        {/* Timer */}
        <View style={styles.timerBar}>
          <Text style={styles.timerText}>
            ⏱ {formatTime(seconds)} {isSubscribed ? '(Subscribed)' : '(Free)'}
          </Text>
        </View>

        {/* Chat List */}
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 12 }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            editable={isSubscribed || seconds < 60}
          />
          <Pressable
            onPress={sendMessage}
            style={[
              styles.sendButton,
              !(isSubscribed || seconds < 60) && { backgroundColor: '#aaa' },
            ]}
            disabled={!(isSubscribed || seconds < 60)}
          >
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* 🔒 Lock Modal */}
      <Modal visible={showLockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Trial Ended</Text>
            <Text style={styles.modalText}>
              Your free trial has ended. Subscribe for ¥38/month to continue chatting.
            </Text>
            <Pressable style={styles.subscribeButton} onPress={handleSubscribe}>
              <Text style={styles.subscribeText}>Subscribe Now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ⚠️ Warning Modal */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⏰ Time Running Out</Text>
            <Text style={styles.modalText}>
              You have less than 10 seconds left in your free trial.
            </Text>
            <Pressable onPress={() => setShowWarningModal(false)} style={styles.subscribeButton}>
              <Text style={styles.subscribeText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ⋮ Dotted Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <Pressable style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              // TODO: Add profile navigation
            }}>
              <Text style={styles.menuText}>👤 View Profile</Text>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => {
              setMenuVisible(false);
              // TODO: Add block/report functionality
            }}>
              <Text style={styles.menuText}>🚫 Block User</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  timerBar: {
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  friendBubble: {
    backgroundColor: '#e9e9e9',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 25,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 30,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  subscribeText: { color: '#fff', fontWeight: 'bold' },

  // Menu styles
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    width: 180,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});
