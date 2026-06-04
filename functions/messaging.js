import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function getTokensForUser(userId) {
  if (!userId) return [];
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return [];
  const tokens = snap.data().fcmTokens || [];
  return [...new Set(tokens)].filter(Boolean);
}

async function getAdminTokens() {
  const snap = await db.collection('users').where('role', '==', 'admin').get();
  const tokens = [];
  snap.forEach((docSnap) => {
    const t = docSnap.data().fcmTokens || [];
    tokens.push(...t);
  });
  return [...new Set(tokens)].filter(Boolean);
}

export async function sendPushToTokens(tokens, notification, data = {}) {
  if (!tokens.length) return;
  const messaging = getMessaging();
  const chunkSize = 500;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    try {
      await messaging.sendEachForMulticast({
        tokens: chunk,
        notification,
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        webpush: {
          fcmOptions: { link: data.url || '/' },
        },
      });
    } catch (err) {
      console.error('FCM send error', err);
    }
  }
}

export async function notifyUser(userId, title, body, data = {}) {
  const tokens = await getTokensForUser(userId);
  await sendPushToTokens(tokens, { title, body }, data);
}

export async function notifyAdmins(title, body, data = {}) {
  const tokens = await getAdminTokens();
  await sendPushToTokens(tokens, { title, body }, data);
}
