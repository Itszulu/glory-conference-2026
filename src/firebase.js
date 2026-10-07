import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig={
  projectId:'gloryconf',
  appId:'1:86977977960:web:800387690a1f1fba37e5dd',
  storageBucket:'gloryconf.firebasestorage.app',
  apiKey:'AIzaSyBuLgMlE-C4AW20GgfDouRJgf9KIcG1up8',
  authDomain:'gloryconf.firebaseapp.com',
  messagingSenderId:'86977977960',
  measurementId:'G-FJY9G0FZRE'
}

export const app=initializeApp(firebaseConfig)
export const db=getFirestore(app)
export const auth=getAuth(app)
