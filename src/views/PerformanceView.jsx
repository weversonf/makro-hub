import React from 'react';
import { useHub } from '../context/HubContext';

export default function PerformanceView() {
  const { activities } = useHub();

  const dashActs = activities.filter((a) => a.categoria !== 1);
  const edActs = activities.filter((a) => a.categoria === 1);
  const total = activities.length;
  const concluidas = activities.filter((a) => a.stage === 'concluido').length;
  const rate = total > 0 ? Math.round((concluidas / total) * 100) : 85;

  const channelsData = [
    { canal: 'LinkedIn Corporativo', posts: 14, engajamento: '+28%', pct: 36, cor: '#0077B5' },
    { canal: 'Instagram Makro', posts: 12, engajamento: '+19%', pct: 31, cor: '#E1306C' },
    { canal: 'Endomarketing & SIPAT', posts: 6, engajamento: '+42%', pct: 15, cor: '#10B981' },
    { canal: 'YouTube (Vídeos de Obras)', posts: 4, engajamento: '+15%', pct: 10, cor: '#FF0000' },
    { canal: 'Blog & Site Institucional', posts: 3, engajamento: '+12%', pct: 8, cor: '#1279FF' }
  ];

  const monthlyDeliveries = [
    { mes: 'Mai', concluidas: 18, meta: 16 },
    { mes: 'Jun', concluidas: 22, meta: 20 },
    { mes: 'Jul', concluidas: 26, meta: 22 },
    { mes: 'Ago', concluidas: 31, meta: 25 },
    { mes: 'Set', concluidas: 19, meta: 24 }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)]">Performance & Desempenho</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Métricas de produtividade, taxa de entrega e volume de produção do marketing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            Relatório de Desempenho 2026
          </span>
        </div>
      </div>

      {/* KPIs de Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="hr-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Entrega no Prazo</span>
            <span className="w-8 h-8 rounded-lg bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center justify-center">
              <i className="ph ph-clock-check text-lg" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-heading)] mt-2">94.2%</h3>
          <p className="text-[11px] text-[var(--color-success)] mt-1 font-semibold">
            +3.5% vs trimestre anterior
          </p>
        </div>

        <div className="hr-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Tempo Médio (Lead Time)</span>
            <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
              <i className="ph ph-hourglass-high text-lg" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-heading)] mt-2">3.2 dias</h3>
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            Da solicitação até a entrega final
          </p>
        </div>

        <div className="hr-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Aproveitamento Geral</span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <i className="ph ph-target text-lg" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-heading)] mt-2">{rate}%</h3>
          <p className="text-[11px] text-[var(--color-primary)] mt-1 font-semibold">
            {concluidas} de {total} tarefas concluídas
          </p>
        </div>

        <div className="hr-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Publicações Editoriais</span>
            <span className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <i className="ph ph-share-network text-lg" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[var(--color-heading)] mt-2">{edActs.length} posts</h3>
          <p className="text-[11px] text-purple-500 mt-1 font-semibold">
            100% veiculados nos canais Makro
          </p>
        </div>
      </div>

      {/* Seção com Gráficos e Distribuição por Canal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Desempenho Mensal de Entregas */}
        <div className="lg:col-span-7 hr-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">
              Volume de Entregas Mensais vs Meta
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-5">
              Comparativo de demandas concluídas pelo time de marketing
            </p>

            <div className="space-y-4">
              {monthlyDeliveries.map((m) => {
                const pct = Math.round((m.concluidas / 35) * 100);
                return (
                  <div key={m.mes}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[var(--color-heading)]">{m.mes} / 2026</span>
                      <span className="text-[var(--color-muted)]">
                        <strong className="text-[var(--color-primary)]">{m.concluidas} entregas</strong> (Meta: {m.meta})
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[var(--color-subtle)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-[var(--color-primary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-muted)] flex items-center justify-between">
            <span>Produtividade acumulada: <strong>116 entregas</strong></span>
            <span className="text-[var(--color-success)] font-semibold">Superando meta em +14%</span>
          </div>
        </div>

        {/* Distribuição por Canais de Divulgação */}
        <div className="lg:col-span-5 hr-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">
              Distribuição por Canal
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-4">
              Volume de conteúdo e engajamento gerado por plataforma
            </p>

            <div className="space-y-3.5">
              {channelsData.map((c) => (
                <div key={c.canal} className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-[var(--color-heading)] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.cor }} />
                      {c.canal}
                    </span>
                    <span className="font-mono text-[var(--color-success)] font-semibold">
                      {c.engajamento}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${c.pct}%`, background: c.cor }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mt-1">
                    <span>{c.posts} publicações</span>
                    <span>{c.pct}% do total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
