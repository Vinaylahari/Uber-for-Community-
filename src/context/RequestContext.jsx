import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './AuthContext';

const RequestContext = createContext();

const initialState = {
  memberRequests: [],
  volunteerFeed: [],
  loading: true,
  error: null,
};

function requestReducer(state, action) {
  switch (action.type) {
    case 'SET_MEMBER_REQUESTS':
      return { ...state, memberRequests: action.payload, loading: false, error: null };
    case 'SET_VOLUNTEER_FEED':
      return { ...state, volunteerFeed: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export function RequestProvider({ children }) {
  const [state, dispatch] = useReducer(requestReducer, initialState);
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    if (!currentUser || !userData) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return undefined;
    }

    let unsub = () => {};

    if (userData.role === 'member') {
      dispatch({ type: 'SET_LOADING', payload: true });
      const q = query(
        collection(db, 'requests'),
        where('memberId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          dispatch({ type: 'SET_MEMBER_REQUESTS', payload: list });
        },
        (err) => dispatch({ type: 'SET_ERROR', payload: err.message })
      );
    } else if (userData.role === 'volunteer') {
      dispatch({ type: 'SET_LOADING', payload: true });
      const q = query(
        collection(db, 'requests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          dispatch({ type: 'SET_VOLUNTEER_FEED', payload: list });
        },
        (err) => dispatch({ type: 'SET_ERROR', payload: err.message })
      );
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    return () => unsub();
  }, [currentUser, userData]);

  const value = {
    ...state,
    dispatch,
  };

  return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>;
}

export function useRequestContext() {
  return useContext(RequestContext);
}
