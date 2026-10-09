import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDyTOJdk7EfEn6dFZF4Cq-nwNwQsYF5KTo",
  authDomain: "amar-bank-f6c98.firebaseapp.com",
  projectId: "amar-bank-f6c98",
  storageBucket: "amar-bank-f6c98.firebasestorage.app",
  messagingSenderId: "132444738008",
  appId: "1:132444738008:web:ed278456ab2ec8aa55e2ad",
  measurementId: "G-VNYHDRCTFQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
