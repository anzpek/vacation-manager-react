// Firebase 모듈 임포트
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, set, get } from 'firebase/database';

// config/firebase-config.js 에 있는 설정 값 사용
const firebaseConfig = {
    apiKey: "AIzaSyCaQ6ndqGrR_x6fvTrZxdf5cHTNnRIj2Gg",
    authDomain: "busvacation-e894a.firebaseapp.com",
    databaseURL: "https://busvacation-e894a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "busvacation-e894a",
    storageBucket: "busvacation-e894a.appspot.com",
    messagingSenderId: "919121046118",
    appId: "1:919121046118:web:033047c3f1bba2164e5ba7"
};

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
