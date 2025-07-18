import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { registerForPushNotificationsAsync } from './services/notifications';
import * as Notifications from 'expo-notifications';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import AddFriendScreen from './screens/AddFriendScreen';
import FriendsListScreen from './screens/FriendsListScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';

// Notification handler: show alerts in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let icon = 'ellipse';
          if (route.name === 'Home') icon = 'chatbubbles';
          else if (route.name === 'AddFriend') icon = 'person-add';
          else if (route.name === 'FriendsList') icon = 'people';
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AddFriend" component={AddFriendScreen} options={{ title: 'Add Friends' }} />
      <Tab.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Friends List' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigationRef = useRef(null); // for navigating on notification tap

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);

      if (firebaseUser) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await setDoc(
            doc(db, 'users', firebaseUser.uid),
            { pushToken: token },
            { merge: true }
          );
          console.log('✅ Push token saved:', token);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Notification events: foreground & tapped
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📩 Notification received:', notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📬 Notification tapped:', response);

      const friendId = response.notification.request.content.data?.friendId;
      if (friendId && user) {
        navigationRef.current?.navigate('Chat', { friend: { uid: friendId } });
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [user]);

  if (initializing) return <SplashScreen />;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: 'Chat' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Profile' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
