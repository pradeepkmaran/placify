import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-lite.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7DL9hn93F4rRyMk2tT_gkQS-0H12ugVs",
  authDomain: "placify-ssn.firebaseapp.com",
  projectId: "placify-ssn",
  storageBucket: "placify-ssn.firebasestorage.app",
  messagingSenderId: "992323637615",
  appId: "1:992323637615:web:be6eb6210940bf9f8b989a",
  measurementId: "G-9KVSEHH3NT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
