import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './useAuth';

export function useVolunteer() {
  const { currentUser } = useAuth();
  const [volunteer, setVolunteer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setVolunteer(null);
      setLoading(false);
      return undefined;
    }

    const unsub = onSnapshot(
      doc(db, 'volunteers', currentUser.uid),
      (snap) => {
        setVolunteer(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [currentUser]);

  return { volunteer, loading };
}
