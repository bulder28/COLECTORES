// Firebase v9/10 modular - Colectores Platform
// ⚠️  Credenciales cargadas desde variables de entorno (.env), nunca en texto plano.
import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)

// Use the recommended initializeFirestore with localCache instead of deprecated enableIndexedDbPersistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
})

// Solo mostrar información de conexión en modo desarrollo
if (import.meta.env.DEV) {
  console.log('🔥 Firebase initialized — Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
}
