// Firebase 모듈 임포트
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, get } from 'firebase/database';

// Firebase 설정을 환경변수에서 로드 (보안 강화)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyCaQ6ndqGrR_x6fvTrZxdf5cHTNnRIj2Gg',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'busvacation-e894a.firebaseapp.com',
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || 'https://busvacation-e894a-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'busvacation-e894a',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'busvacation-e894a.firebasestorage.app',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '919121046118',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:919121046118:web:033047c3f1bba2164e5ba7',
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'G-LBH4VTYQDS'
};

// 환경변수 로드 확인 (개발 환경에서만 경고 표시)
if (process.env.NODE_ENV === 'development') {
    const requiredEnvVars = [
        'REACT_APP_FIREBASE_API_KEY',
        'REACT_APP_FIREBASE_AUTH_DOMAIN',
        'REACT_APP_FIREBASE_PROJECT_ID'
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingVars.length > 0) {
        console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
        console.warn('Using fallback configuration. Please restart development server after adding .env.local file.');
    }
}

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);
export const realtimeDb = getDatabase(app);

// Realtime Database 함수들 export
export { ref, set, get };

export default app;
