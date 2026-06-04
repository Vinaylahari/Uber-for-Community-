import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { registerFcmToken, subscribeForegroundMessages } from '../firebase/messaging';
import toast from 'react-hot-toast';

export function useFcm() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return undefined;

    let unsubForeground = () => {};

    (async () => {
      await registerFcmToken(currentUser.uid);
      unsubForeground = await subscribeForegroundMessages((payload) => {
        const title = payload.notification?.title || 'Sahayam';
        const body = payload.notification?.body || '';
        toast(`${title}${body ? `: ${body}` : ''}`, { duration: 5000 });
      });
    })();

    return () => {
      if (typeof unsubForeground === 'function') unsubForeground();
    };
  }, [currentUser]);
}
