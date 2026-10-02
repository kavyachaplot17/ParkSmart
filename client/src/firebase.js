import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCqhxzPk6gRo6ol4MihiwEwzXUxMtB8lls",
  authDomain: "parksmart-88511.firebaseapp.com",
  projectId: "parksmart-88511",
  storageBucket: "parksmart-88511.firebasestorage.app",
  messagingSenderId: "582439360172",
  appId: "1:582439360172:web:c2a46c191f138f1073b109"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();