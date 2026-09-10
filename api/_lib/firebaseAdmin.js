/**
 * Firebase Admin - Makro Hub Bot
 * Usa FIREBASE_SERVICE_ACCOUNT (JSON string) ou arquivo local como fallback
 * Coleção alvo: users/{masterUid}/activities (com fallback para activities raiz)
 */
import admin from 'firebase-admin';

let app = null;

function getAdmin() {
  if (admin.apps.length) return admin.apps[0];
  if (app) return app;

  let credential;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  let json = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch (e) {
      // tenta base64
      try { json = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); } catch {}
      if (!json) { console.error('[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT inválido:', e.message); throw e; }
    }
  } else if (b64) {
    try { json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')); } catch (e) { console.error('[firebaseAdmin] B64 inválido', e.message); throw e; }
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT ausente. Configure nas ENV da Vercel (JSON string ou B64).');
  }
  credential = admin.credential.cert(json);
  app = admin.initializeApp({ credential });
  return app;
}

export function getDb() {
  getAdmin();
  return admin.firestore();
}

export const MASTER_EMAIL = 'weversonf@gmail.com';

// Descobre UID do master (weversonf@gmail.com) para workspace compartilhado
export async function getMasterUid(db = getDb()) {
  // 1. tenta via Users where email
  const snap = await db.collection('users').where('email', '==', MASTER_EMAIL).limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  // 2. tenta lista total (fallback)
  const all = await db.collection('users').limit(50).get();
  for (const d of all.docs) {
    if ((d.data().email || '').toLowerCase() === MASTER_EMAIL.toLowerCase()) return d.id;
  }
  return null;
}

export async function getSharedCollection(db, colName) {
  const masterUid = await getMasterUid(db);
  if (masterUid) return db.collection('users').doc(masterUid).collection(colName);
  return db.collection(colName);
}
