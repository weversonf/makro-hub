/**
 * Vercel Cron - Daily Insight (08:00 Fortaleza)
 * Rota: GET https://makrohub.vercel.app/api/cron/daily-insight
 * Protegido por CRON_SECRET (header Authorization: Bearer <secret>)
 * Vercel chama automaticamente via crons em vercel.json
 */
import { fetchEditorialHistory, buildHistoryDigest } from '../_lib/editorial.js';
import { scoutCompetitors, formatCompetitorBrief } from '../_lib/competitors.js';
import { generateInsights, formatInsightsForTelegram } from '../_lib/gemini.js';
import { sendMessage } from '../_lib/telegram.js';

export default async function handler(req, res) {
  // Validação Vercel Cron + secret opcional
  const auth = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET;
  const vercelCron = req.headers['x-vercel-cron'];
  // Se CRON_SECRET configurado, exige Bearer
  if (cronSecret && auth !== `Bearer ${cronSecret}` && !vercelCron) {
    // também aceita ?secret= na query para teste manual
    const qSecret = req.query?.secret;
    if (qSecret !== cronSecret) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
  }

  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ALLOWED_IDS?.split(',')[0];
  if (!chatId) {
    return res.status(500).json({ ok: false, error: 'TELEGRAM_CHAT_ID não configurado' });
  }

  try {
    console.log('[cron] Iniciando daily insight...');
    const { publicados, pendentes } = await fetchEditorialHistory(20);
    const historyDigest = buildHistoryDigest(publicados, 3500);
    const scout = await scoutCompetitors(3);
    const brief = formatCompetitorBrief(scout);
    const hojeISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' }); // YYYY-MM-DD

    const data = await generateInsights({ historyDigest, competitorBrief: brief, pendentesCount: pendentes.length, hojeISO });
    const text = formatInsightsForTelegram(data, { date: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' }) });

    const header = `☀️ *Bom dia, Weverson! Seu briefing diário chegou — ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })}*\n` +
      `_Base: ${publicados.length} posts publicados analisados + radar de ${scout.length} concorrentes_\n\n`;

    await sendMessage(chatId, header + text, { parse_mode: 'Markdown' });

    // Opcional: ping secundário se houver mais de um chat permitido
    const allIds = (process.env.TELEGRAM_ALLOWED_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const extraId of allIds.slice(1)) {
      await sendMessage(extraId, header + text, { parse_mode: 'Markdown' }).catch(() => {});
    }

    return res.status(200).json({ ok: true, sent_to: chatId, ideias: data.ideias.length });
  } catch (e) {
    console.error('[cron] erro', e);
    // Notifica erro no Telegram se possível
    try {
      if (chatId) await sendMessage(chatId, `⚠️ *Makro Bot* falhou no cron diário: ${e.message}\n\nTente /ideias manualmente ou verifique ENV (GEMINI_API_KEY, FIREBASE_SERVICE_ACCOUNT).`, { parse_mode: 'Markdown' });
    } catch {}
    return res.status(500).json({ ok: false, error: e.message });
  }
}
