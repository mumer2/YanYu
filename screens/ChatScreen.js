import React, { useState, useEffect, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../services/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const timerRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const userId = user.uid;
      const messagesRef = collection(db, 'chats', userId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        sender: doc.data().sender,
      }));

      setMessages(fetched);
    };

    fetchMessages();
  }, [user]);

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
      text: input,
      sender: 'user',
      createdAt: serverTimestamp(),
    };

    try {
      const userId = user.uid;
      const messagesRef = collection(db, 'chats', userId, 'messages');

      const docRef = await addDoc(messagesRef, newMessage);

      setMessages((prev) => [
        { id: docRef.id, text: input, sender: 'user' },
        ...prev,
      ]);
      setInput('');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

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
      <SafeAreaView style={styles.wrapper} edges={['bottom']}>
        <View style={styles.container}>
          {/* Timer */}
          <View style={styles.timerBar}>
            <Text style={styles.timerText}>
              ⏱ {formatTime(seconds)} {isSubscribed ? '(Subscribed)' : '(Free)'}
            </Text>
          </View>

          {/* Messages */}
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
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
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                !(isSubscribed || seconds < 60) && { backgroundColor: '#aaa' },
              ]}
              disabled={!(isSubscribed || seconds < 60)}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  timerBar: {
    paddingVertical: 8,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
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
  botBubble: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
  },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingBottom: Platform.OS === 'android' ? 20 : 10,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
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
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: 'bold' },
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
});
