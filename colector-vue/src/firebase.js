// Firebase v9 modular - Colectores Platform
import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBhrhuAP9xxCpG_ZVnJqRWwAGOhHQQJcrk",
  authDomain: "colectores-7284c.firebaseapp.com",
  projectId: "colectores-7284c",
  storageBucket: "colectores-7284c.firebasestorage.app",
  messagingSenderId: "332988452730",
  appId: "1:332988452730:web:dafd955458818f845b10c3"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: Multiple tabs open.')
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: Not supported.')
  }
})

console.log('🔥 Firebase initialized - Project: colectores-7284c')
