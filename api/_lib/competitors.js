/**
 * Competitors - Makro Engenharia
 * Lista curada + scraper leve para "o que concorrentes postaram"
 * Obs: Instagram exige auth; aqui usamos sites/blogs + busca web via Gemini grounding.
 * O scraper tenta extrair <title> e <meta> + primeiros posts de blog.
 */

export const COMPETITORS = [
  {
    id: 'locar',
    nome: 'Locar Guindastes',
    site: 'https://www.locarbrasil.com.br',
    ig: 'https://www.instagram.com/locarbrasil/',
    foco: 'Locação de guindastes, plataformas e caminhões munck',
  },
  {
    id: 'tecnogrua',
    nome: 'Tecnogrua',
    site: 'https://www.tecnogrua.com.br',
    ig: 'https://www.instagram.com/tecnogrua/',
    foco: 'Guindastes e movimentação de cargas pesadas',
  },
  {
    id: 'darcy-pacheco',
    nome: 'Darcy Pacheco',
    site: 'https://www.darcypacheco.com.br',
    ig: 'https - via site',
    foco: 'Locação de guindastes e serviços industriais - RS',
  },
  {
    id: 'makro-propria',
    nome: 'Makro Engenharia (referência interna)',
    site: 'https://makroengenharia.com.br',
    ig: 'https://www.instagram.com/makroengenharia/',
    foco: 'Frota pesada, super heavy lift, segurança e cases',
  },
  {
    id: 'guindastes-tatuape',
    nome: 'Guindastes Tatuapé / Centro-Oeste',
    site: 'https://www.guindastestatuapé.com.br',
    ig: '—',
    foco: 'Guindastes até 500t',
  },
];

const UA = 'Mozilla/5.0 (compatible; MakroHubBot/1.0; +https://makrohub.vercel.app)';

async function fetchText(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function extractMeta(html) {
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim();
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '').trim();
  const h1s = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map((m) => m[1].trim()).slice(0, 5);
  const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)].map((m) => m[1].trim()).slice(0, 8);
  // tenta links de blog/posts
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{5,80})<\/a>/gi)]
    .map((m) => ({ href: m[1], text: m[2].trim() }))
    .filter((l) => /blog|noticia|artigo|guindaste|obra|case|projeto/i.test(l.text) && l.href.startsWith('http'))
    .slice(0, 6);
  return { title, desc, h1s, h2s, links };
}

export async function scoutCompetitors(limit = 3) {
  const targets = COMPETITORS.filter((c) => c.id !== 'makro-propria').slice(0, limit);
  const results = [];
  await Promise.all(
    targets.map(async (c) => {
      try {
        const html = await fetchText(c.site, 7000);
        const meta = extractMeta(html);
        results.push({ ...c, ...meta, ok: true });
      } catch (e) {
        results.push({ ...c, ok: false, error: e.message, title: '', desc: '', h1s: [], h2s: [], links: [] });
      }
    })
  );
  return results;
}

export function formatCompetitorBrief(scout) {
  if (!scout || scout.length === 0) return 'Nenhum dado de concorrentes disponível no momento.';
  return scout
    .map((c) => {
      const heads = [...c.h1s, ...c.h2s].slice(0, 5).join(' | ') || c.title || '—';
      const links = c.links.length ? c.links.map((l) => `• ${l.text} (${l.href})`).join('\n') : '—';
      return `*${c.nome}* (${c.site})\nFoco: ${c.foco}\nDestaques: ${heads}\nPosts/Blog: \n${links}\nStatus: ${c.ok ? 'OK' : 'falha: ' + c.error}`;
    })
    .join('\n\n');
}
