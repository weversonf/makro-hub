import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCGemp_OA8savCmLZfX7Us0nmDpdbpv4N0",
  authDomain: "mytasks-saturday.firebaseapp.com",
  projectId: "mytasks-saturday",
  storageBucket: "mytasks-saturday.firebasestorage.app",
  messagingSenderId: "647554172397",
  appId: "1:647554172397:web:aac3ef00938ee7cd8f13e4"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export const storage = firebase.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Persistência local de autenticação
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((e) => {
  console.warn('[Auth] Erro ao definir persistência:', e);
});

// Ativação da persistência offline no Firestore (Multi-aba IndexedDB)
if (typeof db.enableMultiTabIndexedDbPersistence === 'function') {
  db.enableMultiTabIndexedDbPersistence().then(() => {
    console.log('[Firestore] Persistência offline multi-aba ativada com sucesso.');
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firestore] Multi-aba não disponível simultaneamente, fallback ativado.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firestore] Navegador atual não suporta IndexedDB persistence.');
    } else {
      console.warn('[Firestore] Erro ao habilitar persistência:', err);
    }
  });
}

// Helpers para coleções do usuário
export function getUserCollection(collectionName) {
  const uid = auth.currentUser ? auth.currentUser.uid : null;
  if (!uid) return db.collection(collectionName);
  return db.collection('users').doc(uid).collection(collectionName);
}

export function getUserDoc(collectionName, docId) {
  return getUserCollection(collectionName).doc(docId);
}

export default firebase;
