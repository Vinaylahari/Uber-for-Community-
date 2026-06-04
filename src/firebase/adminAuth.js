import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Secondary Firebase app so creating a volunteer does not sign out the admin. */
const secondaryApp = initializeApp(firebaseConfig, 'SahayamAdminSecondary');
export const adminAuth = getAuth(secondaryApp);

/**
 * Create Firebase Auth user (email/password) without affecting primary session.
 * @returns {Promise<string>} new user's uid
 */
export async function createVolunteerAuthUser(email, password) {
  const credential = await createUserWithEmailAndPassword(adminAuth, email, password);
  const uid = credential.user.uid;
  await signOut(adminAuth);
  return uid;
}
