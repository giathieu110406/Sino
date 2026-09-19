/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// Đọc cấu hình hoàn toàn từ file .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.startsWith('https://') 
    ? import.meta.env.VITE_FIREBASE_PROJECT_ID.replace('https://', '').split('-default-rtdb')[0] 
    : import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const hasCredentials = !!firebaseConfig.apiKey;

export let app: any = null;
export let auth: any = null;
export let db: any = null;

if (hasCredentials) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Sử dụng long polling để tránh lỗi "client is offline" trong môi trường iframe
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (err) {
    console.error("Lỗi khởi tạo Firebase:", err);
  }
} else {
  console.warn("Firebase configuration is missing! Vui lòng cập nhật thông tin trong file `.env` ở thư mục gốc.");
}
