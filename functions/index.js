/**
 * Makro Hub — Cloud Functions
 * 
 * Functions:
 *   scheduledPublish  — onSchedule (5 min) executa posts agendados
 *   publishNow        — onRequest  (HTTP)   publica imediatamente
 *   linkedinOAuth     — onRequest  (HTTP)   troca code OAuth por access_token
 *   saveSocialTokens  — onCall             salva tokens no Firestore
 *
 * Deploy:
 *   firebase deploy --only functions
 *
 * Variavel de ambiente (client_secret do LinkedIn):
 *   firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const db = admin.firestore();
const IG_API_BASE = 'https://graph.facebook.com/v18.0';
const LI_API_BASE = 'https://api.linkedin.com/v2';

/* ── HELPERS: publicacao server-side ─────────────────────────────── */

async function publishToInstagram(post, userDoc) {
  const userData = (await userDoc.get()).data();
  const token = userData.igToken;
  const igId = userData.igUserId;

  if (!token || !igId) throw new Error('Instagram não configurado');

  const caption = `${post.titulo}${post.descricao ? '\n\n' + post.descricao : ''}\n\n#makroengenharia`;
  const imageUrl = post.imageUrl || 'https://via.placeholder.com/1080x1080.png?text=Makro+Engenharia';

  const containerParams = new URLSearchParams({
    access_token: token,
    caption,
    media_type: 'IMAGE',
    image_url: imageUrl
  });

  const containerRes = await fetch(`${IG_API_BASE}/${igId}/media?${containerParams}`, { method: 'POST' });
  const containerData = await containerRes.json();

  if (containerData.error) throw new Error(containerData.error.message);

  let attempts = 0;
  let status = 'IN_PROGRESS';
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    const checkRes = await fetch(`${IG_API_BASE}/${containerData.id}?fields=status_code&access_token=${token}`);
    const checkData = await checkRes.json();
    status = checkData.status_code || 'FINISHED';
    attempts++;
  }

  if (status !== 'FINISHED') throw new Error('Timeout: container de mídia não ficou pronto');

  const publishParams = new URLSearchParams({
    access_token: token,
    creation_id: containerData.id
  });

  const publishRes = await fetch(`${IG_API_BASE}/${igId}/media_publish?${publishParams}`, { method: 'POST' });
  const publishData = await publishRes.json();

  if (publishData.error) throw new Error(publishData.error.message);
  return publishData;
}

async function publishToLinkedin(post, userDoc) {
  const userData = (await userDoc.get()).data();
  const token = userData.liToken;
  const urn = userData.liUrn;

  if (!token || !urn) throw new Error('LinkedIn não configurado');

  const caption = `${post.titulo}${post.descricao ? '\n\n' + post.descricao : ''}`;
  const personUrn = `urn:li:person:${urn}`;

  const shareContent = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: caption },
        shareMediaCategory: post.imageUrl ? 'ARTICLE' : 'NONE',
        ...(post.imageUrl ? {
          media: [{
            status: 'READY',
            originalUrl: post.imageUrl,
            title: { attributes: [], text: post.titulo }
          }]
        } : {})
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const res = await fetch(`${LI_API_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(shareContent)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `LinkedIn API error: ${res.status}`);
  }

  return await res.json();
}

/* ── SCHEDULED PUBLISHER (Cloud Scheduler, 5 min) ────────────────── */
/*  Problema 1: motor de execucao dos posts agendados                 */

exports.scheduledPublish = onSchedule(
  { schedule: 'every 5 minutes', region: 'us-central1' },
  async (event) => {
    const now = admin.firestore.Timestamp.now();
    const usersSnap = await db.collection('users').get();

    for (const userDocRef of usersSnap.docs) {
      const scheduledSnap = await userDocRef.ref
        .collection('scheduledPosts')
        .where('status', '==', 'agendado')
        .where('scheduledAt', '<=', now)
        .get();

      for (const postDoc of scheduledSnap.docs) {
        const post = postDoc.data();
        const targets = post.targets || ['ig'];
        const results = [];

        for (const target of targets) {
          try {
            if (target === 'ig') {
              await publishToInstagram(post, userDocRef.ref);
              results.push({ target: 'Instagram', ok: true });
            }
            if (target === 'li') {
              await publishToLinkedin(post, userDocRef.ref);
              results.push({ target: 'LinkedIn', ok: true });
            }
          } catch (e) {
            logger.error(`Error publishing to ${target}:`, e.message);
            results.push({ target, ok: false, error: e.message });
          }
        }

        const allOk = results.every(r => r.ok);
        await postDoc.ref.update({
          status: allOk ? 'publicado' : 'erro',
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          results
        });

        const actId = post.activityId;
        if (actId) {
          const actDocs = await userDocRef.ref
            .collection('activities')
            .where('id', '==', actId)
            .get();
          for (const actDoc of actDocs.docs) {
            await actDoc.ref.update({
              postStatus: allOk ? 'publicado' : 'erro'
            });
          }
        }
      }
    }

    return null;
  }
);

/* ── PUBLISH NOW (HTTP trigger) ──────────────────────────────────── */
/*  Problema 1+5: publicar imediatamente via servidor (evita CORS)    */

exports.publishNow = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    const uid = decodedToken.uid;
    const { post, targets } = req.body;

    if (!post || !post.titulo) {
      res.status(400).json({ error: 'Dados do post incompletos' });
      return;
    }

    const userDocRef = db.collection('users').doc(uid);
    const results = [];

    for (const target of (targets || ['ig'])) {
      try {
        if (target === 'ig') {
          await publishToInstagram(post, userDocRef);
          results.push({ target: 'Instagram', ok: true });
        }
        if (target === 'li') {
          await publishToLinkedin(post, userDocRef);
          results.push({ target: 'LinkedIn', ok: true });
        }
      } catch (e) {
        logger.error(`Error publishing to ${target}:`, e.message);
        results.push({ target, ok: false, error: e.message });
      }
    }

    res.json({ results });
  }
);

/* ── LINKEDIN OAUTH (troca code por access_token) ────────────────── */
/*  Problema 6: server-side para nao expor client_secret              */

exports.linkedinOAuth = onRequest(
  { region: 'us-central1', cors: true },
  async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const { code, client_id, redirect_uri } = req.body;

    if (!code || !client_id || !redirect_uri) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    if (!clientSecret) {
      res.status(500).json({
        error: 'LINKEDIN_CLIENT_SECRET não configurado. Rode: firebase functions:secrets:set LINKEDIN_CLIENT_SECRET'
      });
      return;
    }

    try {
      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id,
          client_secret: clientSecret,
          redirect_uri
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        res.status(400).json({ error: tokenData.error_description || tokenData.error });
        return;
      }

      res.json({ access_token: tokenData.access_token, expires_in: tokenData.expires_in });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

/* ── SAVE SOCIAL TOKENS (callable) ───────────────────────────────── */

exports.saveSocialTokens = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

    const uid = request.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const data = {};

    if (request.data.igToken) data.igToken = request.data.igToken;
    if (request.data.igUserId) data.igUserId = request.data.igUserId;
    if (request.data.liToken) data.liToken = request.data.liToken;
    if (request.data.liUrn) data.liUrn = request.data.liUrn;

    if (Object.keys(data).length) {
      await userRef.set(data, { merge: true });
    }

    return { success: true };
  }
);
