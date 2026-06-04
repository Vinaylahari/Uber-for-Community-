import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import app, { db } from './firebase';

let messagingInstance = null;

export async function isMessagingSupported() {
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  const supported = await isMessagingSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

/**
 * Request notification permission, register SW, save FCM token on user doc.
 */
export async function registerFcmToken(userId) {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey || !userId) return null;

  const supported = await isMessagingSupported();
  if (!supported) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    await setDoc(
      doc(db, 'users', userId),
      {
        fcmTokens: arrayUnion(token),
        fcmUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return token;
  } catch (error) {
    console.warn('FCM registration failed:', error);
    return null;
  }
}

/**
 * Foreground message handler (in-app toast can be wired from hook).
 */
export async function subscribeForegroundMessages(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
