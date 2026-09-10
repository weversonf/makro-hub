/**
 * Editorial - acesso à base do Makro Hub
 * Anti-repetição + deduplicação inteligente
 */

import { getDb, getSharedCollection } from './firebaseAdmin.js';

function isEditorial(a, categories = []) {
  if (!a) return false;
  if (String(a.categoria) === '1') return true;
  if (categories?.length) {
    const cat = categories.find((c) => String(c.id) === String(a.categoria));
    if (cat?.nome) {
      const n = cat.nome.toLowerCase();
      if (n.includes('editorial') || n.includes('social') || n.includes('rede') || n.includes('instagram') || n.includes('post')) return true;
    }
  }
  if (Array.isArray(a.canais) && a.canais.length) return true;
  if (a.dataPostagem || a.tipo === 'editorial' || a.isEditorial) return true;
  return false;
}

export async function fetchEditorialHistory(limit = 30) {
  const db = getDb();
  const col = await getSharedCollection(db, 'activities');
  // Firestore não tem índice garantido para orderBy dataPostagem; fazemos fetch + sort em memória
  const snap = await col.limit(300).get();
  const all = [];
  snap.forEach((d) => all.push({ _fbId: d.id, ...d.data() }));

  // categorias para filtro mais preciso
  let categories = [];
  try {
    const catCol = await getSharedCollection(db, 'categories');
    const catSnap = await catCol.get();
    catSnap.forEach((d) => categories.push(d.data()));
  } catch {}

  const editorial = all.filter((a) => isEditorial(a, categories));

  // separa publicados vs agendados
  const publicados = editorial
    .filter((a) => a.stage === 'concluido' || a.status === 'concluido' || a.publicado === true)
    .sort((a, b) => {
      const da = a.dataPostagem || a.dataVencimento || a.criadoEm || '';
      const dbv = b.dataPostagem || b.dataVencimento || b.criadoEm || '';
      return dbv.localeCompare(da);
    })
    .slice(0, limit);

  const pendentes = editorial
    .filter((a) => a.stage !== 'concluido' && a.status !== 'concluido')
    .sort((a, b) => {
      const da = a.dataPostagem || a.dataVencimento || '';
      const dbv = b.dataPostagem || b.dataVencimento || '';
      return da.localeCompare(dbv);
    })
    .slice(0, 20);

  return { editorial, publicados, pendentes, categories };
}

export function buildHistoryDigest(publicados, maxChars = 3500) {
  if (!publicados.length) return 'Nenhum conteúdo editorial publicado ainda.';
  const lines = publicados.map((p, i) => {
    const date = p.dataPostagem || p.dataVencimento || p.criadoEm || 'sem data';
    const canais = Array.isArray(p.canais) ? p.canais.join(',') : p.canais || '—';
    const titulo = (p.titulo || p.nome || 'Sem título').trim();
    const desc = (p.descricao || p.description || '').trim().slice(0, 120);
    return `${i + 1}. [${date}] "${titulo}" | canais: ${canais} | ${desc}`;
  });
  let out = lines.join('\n');
  if (out.length > maxChars) out = out.slice(0, maxChars) + '\n... (truncado)';
  return out;
}

export function detectRepetitionRisk(tituloProposto, history) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9à-ú ]/g, '').trim();
  const nProp = norm(tituloProposto);
  const tokens = nProp.split(/\s+/).filter((w) => w.length > 3);
  for (const h of history) {
    const nHist = norm(h.titulo || '');
    let overlap = 0;
    for (const tok of tokens) if (nHist.includes(tok)) overlap++;
    const ratio = tokens.length ? overlap / tokens.length : 0;
    if (ratio >= 0.6) return { risk: true, matched: h.titulo, ratio };
  }
  return { risk: false };
}

export function nextPostSlotISO() {
  // sugere próximo slot Seg/Qua/Sex às 08:00 Fortaleza (UTC-3)
  const now = new Date();
  // converte p/ Fortaleza manualmente: UTC-3 sem DST
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let cur = new Date(now);
  cur.setDate(cur.getDate() + 1);
  for (let i = 0; i < 14; i++) {
    const dow = cur.getDay(); // 1=Seg
    if ([1, 3, 5].includes(dow)) return fmt(cur);
    cur.setDate(cur.getDate() + 1);
  }
  return fmt(cur);
}
