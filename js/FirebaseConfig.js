// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDp44nlOeMDvHowzE0gepOuzck9OCSqEDI",
  authDomain: "karmeus-43cbe.firebaseapp.com",
  databaseURL: "https://karmeus-43cbe-default-rtdb.firebaseio.com",
  projectId: "karmeus-43cbe",
  storageBucket: "karmeus-43cbe.firebasestorage.app",
  messagingSenderId: "596599272256",
  appId: "1:596599272256:web:5ff93d0bbcce35713040a5",
  measurementId: "G-K7DDEFQ0MT"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = firebase.firestore();

// Initialize Realtime Database
const realtimeDB = firebase.database();

// Example: Reference for device status in Realtime DB
const deviceRef = realtimeDB.ref("deviceStatus");