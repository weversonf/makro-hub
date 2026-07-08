const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const db = admin.firestore();
const IG_API_BASE = 'https://graph.facebook.com/v18.0';
const LI_API_BASE = 'https://api.linkedin.com/v2';

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

exports.scheduledPublish = functions.pubsub.schedule('every 5 minutes').onRun(async () => {
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
          console.error(`Error publishing to ${target}:`, e.message);
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
        const actRef = userDocRef.ref.collection('activities').doc(String(actId));
        const actSnap = await actRef.get();
        if (actSnap.exists) {
          const actDocs = await userDocRef.ref.collection('activities')
            .where('id', '==', actId).get();
          for (const actDoc of actDocs.docs) {
            await actDoc.ref.update({
              postStatus: allOk ? 'publicado' : 'erro'
            });
          }
        }
      }
    }
  }

  return null;
});

exports.linkedinOAuth = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, client_id, redirect_uri } = req.body;

  if (!code || !client_id || !redirect_uri) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const clientSecret = functions.config().linkedin?.client_secret;
  if (!clientSecret) {
    res.status(500).json({ error: 'LinkedIn client_secret not configured. Run: firebase functions:config:set linkedin.client_secret="YOUR_SECRET"' });
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
});

exports.saveSocialTokens = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const uid = context.auth.uid;
  const userRef = db.collection('users').doc(uid);

  if (data.igToken) await userRef.set({ igToken: data.igToken }, { merge: true });
  if (data.igUserId) await userRef.set({ igUserId: data.igUserId }, { merge: true });
  if (data.liToken) await userRef.set({ liToken: data.liToken }, { merge: true });
  if (data.liUrn) await userRef.set({ liUrn: data.liUrn }, { merge: true });

  return { success: true };
});
