// ============================================
// Firebase Configuration - Colectores Platform
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBhrhuAP9xxCpG_ZVnJqRWwAGOhHQQJcrk",
    authDomain: "colectores-7284c.firebaseapp.com",
    projectId: "colectores-7284c",
    storageBucket: "colectores-7284c.firebasestorage.app",
    messagingSenderId: "332988452730",
    appId: "1:332988452730:web:dafd955458818f845b10c3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore instance
const db = firebase.firestore();

// Enable offline persistence (data available even without connection)
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence: Multiple tabs open, persistence enabled in first tab only.');
    } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence: Browser does not support persistence.');
    }
});

console.log('🔥 Firebase initialized - Project: colectores-7284c');
