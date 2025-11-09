// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// firebase-client-config.js - COMPAT VERSION (for your existing auth.js)

const firebaseConfig = {
  apiKey: "AIzaSyCpp55ITZSKlJjVHWBkrubYPY1BVFH2UcM",
  authDomain: "ehealthcloudproject.firebaseapp.com",
  projectId: "ehealthcloudproject",
  storageBucket: "ehealthcloudproject.firebasestorage.app",
  messagingSenderId: "607633042601",
  appId: "1:607633042601:web:8f35f5cfd05e04b10d0db8",
  measurementId: "G-FMY8FHN74Y"
};

// This file just defines the config - initialization happens in auth.js
// No need to initialize here since auth.js does it

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);