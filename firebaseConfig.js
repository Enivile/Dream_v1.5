import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyAqLn9z1zxzSu_91TUy0m-vpUT_dpcCzSE",
    authDomain: "dream-app-8813e.firebaseapp.com",
    projectId: "dream-app-8813e",
    storageBucket: "dream-app-8813e.firebasestorage.app",
    messagingSenderId: "560359988343",
    appId: "1:560359988343:web:cfd7fceae1208a41ca3a72",
    measurementId: "G-DN7F3XQ02P"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { firestore, storage, auth };