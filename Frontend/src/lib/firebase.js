import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const readEnv = (key) => import.meta.env[key]?.trim();

const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY') || 'AIzaSyDBVqDR7J-YiiULCt24kd86jZtqEP3WfqQ',
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'omnexa-26a79.firebaseapp.com',
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID') || 'omnexa-26a79',
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'omnexa-26a79.firebasestorage.app',
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '458613702242',
  appId: readEnv('VITE_FIREBASE_APP_ID') || '1:458613702242:web:c8dbc3de2a8830303c5b3b',
  measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID') || 'G-97Q04BM2QD',
};

export const FIREBASE_VAPID_KEY =
  readEnv('VITE_FIREBASE_VAPID_KEY') ||
  'BEKXYPpn_x_WaOTB7lZaiabtLj7TrWvOYIwGaEmxYAN17XHs3Y1obV5E6-aGbvs_pq7EZGwUwfyRoc86eEZ3KTs';

let firebaseAppInstance;

export const getFirebaseApp = () => {
  if (!firebaseAppInstance) {
    firebaseAppInstance = initializeApp(firebaseConfig);
  }

  return firebaseAppInstance;
};

export const getFirebaseMessaging = async () => {
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  return getMessaging(getFirebaseApp());
};
