/**
 * Gemini - geração de insights com anti-repetição + valor agregado
 * Usa Gemini 1.5 Flash (rápido e barato). Troque para gemini-1.5-pro se quiser mais qualidade.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const API_KEY = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export async function generateInsights({ historyDigest, competitorBrief, pendentesCount, hojeISO }) {
  const apiKey = API_KEY();
  if (!apiKey) throw new Error('GEMINI_API_KEY ausente');

  const systemPrompt = `Você é o ESTRATEGISTA DE CONTEÚDO SÊNIOR da Makro Engenharia — empresa de locação de guindastes, movimentação de cargas super pesadas, içamentos críticos e serviços industriais (Fortaleza/CE, atuação nacional).

DIRETRIZES INVIOLÁVEIS:
- NUNCA repetir tema/título recente. Se precisar revisitar, reescreva com ângulo completamente novo (ex: "segurança em içamento" vira "checklist de 7 falhas invisíveis que quase causam acidente").
- Todo conteúdo deve AGREGAR VALOR REAL: dado técnico, insight de segurança, case, conta, norma (NR-11, NR-12, NBR), cálculo prático ou bastidor operacional — não frases genéricas.
- Pesquise mentalmente concorrentes (Locar, Tecnogrua, Darcy Pacheco) e PROPONHA ALGO DIFERENTE do que eles já fazem.
- Foque no público: engenheiros, gestores de obra, segurança do trabalho, compradores industriais.
- Formatos variados e atuais: Reels, Carrossel técnico, Estudo de caso, Checklist, Bastidores, Comparativo, Mito vs Verdade.
- CTA forte e adequado a cada rede.

ENTREGA: JSON válido (sem markdown) com estrutura:
{
  "resumo": "1 frase sobre o momento editorial",
  "ideias": [
    {
      "titulo": "título curto impactante (max 55 chars)",
      "gancho": "frase de abertura que para o scroll (max 120 chars)",
      "formato": "Reels | Carrossel | Post único | Vídeo bastidor | Artigo LinkedIn",
      "pilar": "Segurança | Técnica | Case | Institucional | Comercial | Educativo",
      "angulo_novo": "como este tema se diferencia dos últimos posts",
      "referencia_concorrente": "o que concorrentes fizeram parecido e como superamos",
      "roteiro": ["3 a 5 bullets do roteiro/estrutura do post"],
      "legenda_esqueleto": "esqueleto de legenda com 3 parágrafos + CTA (max 600 chars)",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "cta": "chamada final",
      "prioridade": "Alta | Média | Baixa",
      "risco_repeticao": "Baixo | Médio | Alto - justificativa"
    }
  ],
  "dica_anti_repeticao": "1 dica prática para não repetir na próxima semana"
}

Gere EXATAMENTE 3 ideias. Diversifique pilares. Uma delas deve ser de ALTO VALOR TÉCNICO.`;

  const userPrompt = `CONTEXTO ATUAL — Makro Hub
Hoje: ${hojeISO}
Pendentes no calendário: ${pendentesCount}

HISTÓRICO DOS ÚLTIMOS CONTEÚDOS PUBLICADOS (evitar repetição):
${historyDigest}

BRIEFING DE CONCORRENTES (o que eles têm postado ultimamente — use para diferenciar):
${competitorBrief}

TAREFA: Gere 3 ideias de conteúdo para os próximos slots (Seg/Qua/Sex), que superem os concorrentes em valor técnico e que não repitam o histórico. Se algum tema for revisitado, explique o ângulo novo. Responda APENAS com JSON válido.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
    ],
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 3500,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('[gemini] error', JSON.stringify(json).slice(0, 2000));
    throw new Error(json.error?.message || `Gemini HTTP ${res.status}`);
  }

  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  // tenta parsear JSON direto (responseMimeType já garante, mas fallback)
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('[gemini] parse falhou, raw:', raw.slice(0, 1000));
    // tenta extrair JSON com regex
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Resposta da IA não é JSON válido');
  }
}

export function formatInsightsForTelegram(data, opts = {}) {
  const { resumo, ideias, dica_anti_repeticao } = data;
  const lines = [];
  lines.push(`🧭 *Makro Insights — ${opts.date || new Date().toLocaleDateString('pt-BR')}*`);
  lines.push('');
  if (resumo) lines.push(`_${resumo}_`);
  lines.push('');
  ideias.forEach((it, idx) => {
    lines.push(`*${idx + 1}. ${it.titulo}* — _${it.formato} • ${it.pilar}_`);
    lines.push(`🎣 Gancho: ${it.gancho}`);
    lines.push(`💡 Ângulo novo: ${it.angulo_novo}`);
    lines.push(`🏗️ Ref. concorrente: ${it.referencia_concorrente}`);
    lines.push(`📝 Roteiro:`);
    (it.roteiro || []).forEach((b) => lines.push(`  • ${b}`));
    lines.push(`✍️ Legenda:`);
    lines.push(`${it.legenda_esqueleto}`);
    lines.push(`🏷️ ${ (it.hashtags || []).join(' ')}`);
    lines.push(`👉 CTA: ${it.cta} — Prioridade: *${it.prioridade}* | Repetição: ${it.risco_repeticao}`);
    lines.push('');
  });
  if (dica_anti_repeticao) {
    lines.push(`⚠️ *Dica anti-repetição:* ${dica_anti_repeticao}`);
    lines.push('');
  }
  lines.push(`_Próximos slots: Seg / Qua / Sex às 08:00 • Use /criar para gerar tarefas no Hub_`);
  return lines.join('\n');
}

export function formatInsightsForHubCard(data) {
  // versão compacta para criar tasks no Firestore se desejar
  return data.ideias.map((it) => ({
    titulo: it.titulo,
    descricao: `${it.gancho}\n\n${(it.roteiro||[]).join('\n• ')}\n\nLegenda:\n${it.legenda_esqueleto}\n\nHashtags: ${(it.hashtags||[]).join(' ')}`,
    formato: it.formato,
    pilar: it.pilar,
    prioridade: it.prioridade === 'Alta' ? 'alta' : it.prioridade === 'Média' ? 'media' : 'baixa',
  }));
}
