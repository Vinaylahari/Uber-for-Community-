import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userUnsub = () => {};

    const authUnsub = onAuthStateChanged(auth, (user) => {
      userUnsub();
      setCurrentUser(user);

      if (user) {
        userUnsub = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            setUserData(snap.exists() ? snap.data() : null);
            setLoading(false);
          },
          () => {
            setUserData(null);
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      userUnsub();
    };
  }, []);

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const setupRecaptcha = (containerId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
    }
    return window.recaptchaVerifier;
  };

  const loginWithPhone = (phoneNumber, appVerifier) =>
    signInWithPhoneNumber(auth, phoneNumber, appVerifier);

  const logout = () => signOut(auth);

  const refreshUserData = useCallback(() => {
    /* Real-time listener keeps userData in sync */
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    loginWithEmail,
    setupRecaptcha,
    loginWithPhone,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
