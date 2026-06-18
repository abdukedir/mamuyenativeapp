import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC99J-9D_bEEWO8P0CQtwYlxYCDNXLbKP0",
  authDomain: "mamuyenativeapp.firebaseapp.com",
  projectId: "mamuyenativeapp",
  storageBucket: "mamuyenativeapp.firebasestorage.app",
  messagingSenderId: "750425842477",
  appId: "1:750425842477:web:c680b9d5f2144baf21e9a4",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;
