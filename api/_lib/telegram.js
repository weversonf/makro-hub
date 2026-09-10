/**
 * Telegram Helper - Makro Hub Bot
 * Usa fetch nativo (Node 18+). Sem dependência extra.
 */

const TG_API = 'https://api.telegram.org';

export function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export async function sendMessage(chatId, text, opts = {}) {
  const token = getBotToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN ausente');
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode || 'Markdown',
    disable_web_page_preview: true,
    ...opts.extra,
  };
  // Telegram limita 4096 chars por mensagem
  const chunks = splitMessage(text, 4000);
  let last = null;
  for (const chunk of chunks) {
    const body = { ...payload, text: chunk };
    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error('[telegram] sendMessage error', json);
      throw new Error(json.description || 'Telegram sendMessage failed');
    }
    last = json;
    // se tem botões inline apenas na última mensagem
    if (opts.extra?.reply_markup) delete payload.reply_markup;
  }
  return last;
}

export async function sendTyping(chatId) {
  const token = getBotToken();
  if (!token) return;
  await fetch(`${TG_API}/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  }).catch(() => {});
}

export function splitMessage(text, maxLen) {
  if (!text || text.length <= maxLen) return [text || ''];
  const chunks = [];
  let curr = '';
  const lines = text.split('\n');
  for (const line of lines) {
    if ((curr + '\n' + line).length > maxLen) {
      if (curr) chunks.push(curr);
      if (line.length > maxLen) {
        // corta linha muito longa
        for (let i = 0; i < line.length; i += maxLen) chunks.push(line.slice(i, i + maxLen));
        curr = '';
      } else {
        curr = line;
      }
    } else {
      curr = curr ? curr + '\n' + line : line;
    }
  }
  if (curr) chunks.push(curr);
  return chunks;
}

export function escapeMarkdown(text) {
  return String(text).replace(/[_*`\[\]]/g, '\\$&');
}

export function isAuthorized(chatId) {
  const allow = (process.env.TELEGRAM_ALLOWED_IDS || process.env.TELEGRAM_CHAT_ID || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allow.length === 0) return true; // se não configurado, libera (aviso em log)
  return allow.includes(String(chatId));
}
