import { useFcm } from '../hooks/useFcm';

/** Registers push notifications when user is signed in. */
export default function FcmBootstrap() {
  useFcm();
  return null;
}
