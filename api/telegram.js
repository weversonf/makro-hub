/**
 * Vercel Serverless - Telegram Webhook
 * Rota: POST https://makrohub.vercel.app/api/telegram
 * Configure no BotFather e via setWebhook
 */
import { sendMessage, sendTyping, isAuthorized } from './_lib/telegram.js';
import { fetchEditorialHistory, buildHistoryDigest, nextPostSlotISO } from './_lib/editorial.js';
import { scoutCompetitors, formatCompetitorBrief } from './_lib/competitors.js';
import { generateInsights, formatInsightsForTelegram, formatInsightsForHubCard } from './_lib/gemini.js';
import { getDb, getSharedCollection } from './_lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'Makro Hub Bot', webhook: 'POST /api/telegram' });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  // validação opcional de secret via header X-Telegram-Bot-Api-Secret-Token
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers['x-telegram-bot-api-secret-token'];
    if (got !== secret) return res.status(401).json({ ok: false, error: 'bad secret' });
  }

  const update = req.body;
  // Responde rápido p/ Telegram (evita retry)
  res.status(200).json({ ok: true });

  try {
    const msg = update.message || update.edited_message || update.callback_query?.message;
    const chatId = msg?.chat?.id || update.callback_query?.from?.id;
    const textRaw = (update.message?.text || update.callback_query?.data || '').trim();
    const from = update.message?.from || update.callback_query?.from;

    if (!chatId || !textRaw) return;
    if (!isAuthorized(chatId)) {
      await sendMessage(chatId, '⛔ Acesso não autorizado. Fale com o ADM Master (@weverson).');
      return;
    }

    const text = textRaw.toLowerCase();
    const cmd = text.split(' ')[0].replace('@', '').replace('/', '');

    console.log(`[telegram] ${from?.username || from?.id}: ${textRaw}`);

    if (['start', 'help', 'ajuda'].includes(cmd)) {
      await handleStart(chatId, from);
    } else if (['hoje', 'today', 'status'].includes(cmd)) {
      await handleHoje(chatId);
    } else if (['ideias', 'insight', 'insights', 'gerar'].includes(cmd)) {
      await handleIdeias(chatId);
    } else if (['concorrentes', 'concorrencia', 'spy'].includes(cmd)) {
      await handleConcorrentes(chatId);
    } else if (['calendario', 'agenda', 'proximos'].includes(cmd)) {
      await handleCalendario(chatId);
    } else if (['criar'].includes(cmd)) {
      const resto = textRaw.slice(textRaw.indexOf(' ') + 1);
      await handleCriar(chatId, resto);
    } else if (text.startsWith('/')) {
      await sendMessage(chatId, `Comando não reconhecido: \`${textRaw}\`\n\nUse /start para ver os comandos.`, { parse_mode: 'Markdown' });
    } else {
      // Mensagem livre -> trata como pedido de ideias com contexto
      await sendTyping(chatId);
      await handleChatLivre(chatId, textRaw);
    }
  } catch (e) {
    console.error('[telegram handler]', e);
  }
}

async function handleStart(chatId, from) {
  const nome = from?.first_name || 'Weverson';
  const msg = `👋 Olá, *${nome}*! Sou o *Makro Insights Bot* — seu assistente editorial diário.\n\n` +
    `Eu faço todo dia:\n` +
    `• Busco os *últimos 20 posts* do Makro Hub (pra não repetir)\n` +
    `• Espiono *concorrentes* (Locar, Tecnogrua, Darcy Pacheco)\n` +
    `• Gero *3 ideias novas* com ângulo diferente e alto valor técnico\n` +
    `• Entrego às *08:00 (Fortaleza)* automaticamente\n\n` +
    `*Comandos:*\n` +
    `/hoje — resumo editorial de hoje\n` +
    `/ideias — gerar 3 ideias agora (com pesquisa)\n` +
    `/concorrentes — o que concorrentes postaram\n` +
    `/calendario — próximos slots Seg/Qua/Sex\n` +
    `/criar \\<titulo\\> | \\<descricao\\> — cria tarefa editorial no Hub\n` +
    `/help — esta ajuda\n\n` +
    `_Dica: quando um tema precisar repetir, eu reescrevo com ângulo novo — nunca cópia._`;
  await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
}

async function handleHoje(chatId) {
  await sendTyping(chatId);
  try {
    const { publicados, pendentes } = await fetchEditorialHistory(20);
    const hoje = new Date().toISOString().slice(0, 10);
    const hojePosts = [...publicados, ...pendentes].filter((p) => (p.dataPostagem || p.dataVencimento) === hoje);
    const pubList = publicados.slice(0, 5).map((p) => `• [${p.dataPostagem || p.dataVencimento}] ${p.titulo} — ${p.stage}`).join('\n') || '—';
    const pendList = pendentes.slice(0, 5).map((p) => `• [${p.dataPostagem || p.dataVencimento || 'sem data'}] ${p.titulo} — ${p.stage}`).join('\n') || 'Nenhum pendente';
    const msg = `📅 *Hoje — ${hoje.split('-').reverse().join('/')}*\n\n` +
      `*Posts para hoje (${hojePosts.length}):*\n${hojePosts.length ? hojePosts.map((p) => `• ${p.titulo} — ${p.stage}`).join('\n') : 'Nenhum post agendado para hoje.'}\n\n` +
      `*Últimos 5 publicados:*\n${pubList}\n\n` +
      `*Próximos pendentes:*\n${pendList}\n\n` +
      `_Próximo slot livre: ${nextPostSlotISO()} (Seg/Qua/Sex 08:00)_`;
    await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
  } catch (e) {
    await sendMessage(chatId, `Erro ao buscar editorial: ${e.message}`);
  }
}

async function handleIdeias(chatId) {
  await sendTyping(chatId);
  await sendMessage(chatId, '🔍 Analisando últimos posts + espionando concorrentes + gerando 3 ideias com IA... (10-20s)');
  try {
    const { publicados, pendentes } = await fetchEditorialHistory(20);
    const historyDigest = buildHistoryDigest(publicados, 3500);
    const scout = await scoutCompetitors(3);
    const brief = formatCompetitorBrief(scout);
    const hojeISO = new Date().toISOString().slice(0, 10);
    const data = await generateInsights({ historyDigest, competitorBrief: brief, pendentesCount: pendentes.length, hojeISO });
    const out = formatInsightsForTelegram(data, { date: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' }) });
    // Adiciona botões inline para criar tasks
    const keyboard = {
      inline_keyboard: data.ideias.slice(0, 3).map((it, idx) => [{ text: `✅ Criar #${idx + 1}: ${it.titulo.slice(0, 24)}`, callback_data: `__noop__` }]),
    };
    // Envia principal
    await sendMessage(chatId, out, { parse_mode: 'Markdown' });
    await sendMessage(chatId, `Para criar no Hub, envie:\n\`/criar ${data.ideias[0].titulo} | ${data.ideias[0].gancho}\`\nou use o botão manual no Makro Hub > Editorial.`, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('[ideias]', e);
    await sendMessage(chatId, `❌ Erro ao gerar ideias: ${e.message}\n\nVerifique GEMINI_API_KEY e FIREBASE_SERVICE_ACCOUNT nas ENV da Vercel.`);
  }
}

async function handleConcorrentes(chatId) {
  await sendTyping(chatId);
  try {
    const scout = await scoutCompetitors(4);
    const brief = formatCompetitorBrief(scout);
    await sendMessage(chatId, `🕵️ *Radar Concorrentes — Makro Engenharia*\n\n${brief}\n\n_Obs: Instagram não é público via scraping. Para IG, use análise manual ou conecte Instagram Graph API no futuro._`, { parse_mode: 'Markdown' });
  } catch (e) {
    await sendMessage(chatId, `Erro no radar: ${e.message}`);
  }
}

async function handleCalendario(chatId) {
  const next = nextPostSlotISO();
  await sendMessage(chatId, `🗓️ *Calendário Editorial — Makro*\n\n` +
    `• Frequência: *3x/semana* (Seg / Qua / Sex) às 08:00 Fortaleza\n` +
    `• Próximo slot livre: *${next.split('-').reverse().join('/')}*\n` +
    `• Reagendamento inteligente: /ideias gera já nos slots corretos\n\n` +
    `Acesse o Hub para ver em grade: https://makrohub.vercel.app/ (menu Editorial)`, { parse_mode: 'Markdown' });
}

async function handleCriar(chatId, resto) {
  if (!resto || resto === '/criar' || resto.trim().length < 5) {
    await sendMessage(chatId, `Uso: \`/criar Titulo do post | descricao opcional\`\nEx: \`/criar Checklist NR-11 para içamento | carrossel com 5 erros comuns\``, { parse_mode: 'Markdown' });
    return;
  }
  const [titulo, ...descParts] = resto.split('|');
  const descricao = descParts.join('|').trim();
  const tituloClean = titulo.replace(/^\/criar\s*/i, '').trim();
  if (!tituloClean) { await sendMessage(chatId, 'Informe o título após /criar'); return; }
  try {
    const db = getDb();
    const col = await getSharedCollection(db, 'activities');
    const slot = nextPostSlotISO();
    // pega nextId
    const snap = await col.get();
    let maxId = 0; snap.forEach((d) => { const v = d.data().id; if (typeof v === 'number' && v > maxId) maxId = v; });
    const docRef = col.doc();
    const payload = {
      id: maxId + 1,
      titulo: tituloClean.slice(0, 120),
      descricao: descricao || 'Criado via Telegram Bot — Makro Insights',
      categoria: 1,
      stage: 'afazer',
      prioridade: 'media',
      progress: 0,
      dataVencimento: slot,
      dataPostagem: slot,
      canais: ['ig', 'li'],
      projeto: 'Editorial Makro',
      criadoEm: new Date().toISOString().slice(0, 10),
      criadoVia: 'telegram-bot',
      responsavel: 'Weverson Nascimento',
    };
    await docRef.set(payload);
    await sendMessage(chatId, `✅ Tarefa editorial criada!\n\n*${payload.titulo}*\n📅 ${slot.split('-').reverse().join('/')} — Seg/Qua/Sex\n📂 Editorial (ID ${payload.id})\n\nVeja em: https://makrohub.vercel.app/`, { parse_mode: 'Markdown' });
  } catch (e) {
    await sendMessage(chatId, `Erro ao criar tarefa: ${e.message}`);
  }
}

async function handleChatLivre(chatId, text) {
  // Responde com Gemini mas com contexto editorial (modo conversacional)
  try {
    const { publicados } = await fetchEditorialHistory(12);
    const digest = buildHistoryDigest(publicados, 2000);
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) { await sendMessage(chatId, 'Me faça um pedido mais específico. Ex: /ideias'); return; }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`;
    const prompt = `Você é o Makro Insights Bot. Usuário perguntou: "${text}".\nHistórico recente de posts (não repetir):\n${digest}\n\nResponda em até 5 linhas, direto, técnico, com 1 sugestão prática e CTA. Se for pedido de conteúdo, gere 1 ideia com título + gancho + formato.`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 700 } }) });
    const j = await res.json();
    const out = j.candidates?.[0]?.content?.parts?.[0]?.text || 'Posso ajudar! Use /ideias para gerar conteúdos ou /hoje para ver o calendário.';
    await sendMessage(chatId, out.slice(0, 3800));
  } catch (e) {
    await sendMessage(chatId, 'Use /ideias para gerar insights ou /help para comandos.');
  }
}
