import React, { useState } from 'react';
import { useHub, fmtDate } from '../context/HubContext';

export default function ProjetosView() {
  const { activities, setView } = useHub();

  const [campaigns, setCampaigns] = useState([
    {
      id: 1,
      nome: 'Expomaq & Eventos 2026',
      descricao: 'Planejamento de estande, materiais promocionais, brindes e cobertura de mídia.',
      status: 'em-andamento',
      prazo: '2026-10-15',
      cor: '#1279FF',
      orcamento: 'R$ 45.000',
      lider: 'Weverson Nascimento',
      tags: ['Feiras', 'Presença de Marca', 'Eventos']
    },
    {
      id: 2,
      nome: 'Endomarketing & SIPAT Makro',
      descricao: 'Campanha interna de segurança do trabalho, banners, vídeos depoimentos e comunicados.',
      status: 'em-andamento',
      prazo: '2026-09-30',
      cor: '#10B981',
      orcamento: 'R$ 12.000',
      lider: 'Comunicação Interna',
      tags: ['Endomarketing', 'SIPAT', 'Segurança']
    },
    {
      id: 3,
      nome: 'Campanha Super Heavy Lift (Frota Pesada)',
      descricao: 'Divulgação dos novos guindastes telescópicos e operações especiais no LinkedIn e YouTube.',
      status: 'em-andamento',
      prazo: '2026-11-20',
      cor: '#F59E0B',
      orcamento: 'R$ 28.000',
      lider: 'Marketing Digital',
      tags: ['Guindastes', 'Frota', 'B2B']
    },
    {
      id: 4,
      nome: 'Redesign Portal & Mídia Kit 2026',
      descricao: 'Reformulação do site institucional, catálogo de frota online e atualização do mídia kit.',
      status: 'planejamento',
      prazo: '2026-12-10',
      cor: '#8B5CF6',
      orcamento: 'R$ 18.000',
      lider: 'Design & Tecnologia',
      tags: ['Branding', 'Website', 'Digital']
    }
  ]);

  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? campaigns : campaigns.filter((c) => c.status === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Header com resumo e filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)]">Campanhas & Projetos</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Grandes iniciativas e campanhas estruturadas de marketing da Makro Engenharia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`hr-btn text-xs h-8 px-3 ${filter === 'all' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
            onClick={() => setFilter('all')}
          >
            Todos ({campaigns.length})
          </button>
          <button
            type="button"
            className={`hr-btn text-xs h-8 px-3 ${filter === 'em-andamento' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
            onClick={() => setFilter('em-andamento')}
          >
            Em Andamento (3)
          </button>
          <button
            type="button"
            className={`hr-btn text-xs h-8 px-3 ${filter === 'planejamento' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
            onClick={() => setFilter('planejamento')}
          >
            Planejamento (1)
          </button>
        </div>
      </div>

      {/* Grid de Projetos / Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((proj) => {
          // Relaciona tarefas vinculadas pelo nome ou categoria
          const linkedActs = activities.filter((a) =>
            a.titulo?.toLowerCase().includes(proj.tags[0].toLowerCase()) ||
            a.descricao?.toLowerCase().includes(proj.tags[0].toLowerCase())
          );
          const done = linkedActs.filter((a) => a.stage === 'concluido').length;
          const pct = linkedActs.length > 0 ? Math.round((done / linkedActs.length) * 100) : 65;

          return (
            <div key={proj.id} className="hr-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: proj.cor }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                      {proj.lider}
                    </span>
                  </div>
                  <span className={`hr-pill ${proj.status === 'em-andamento' ? 'hr-pill--info' : 'hr-pill--warning'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {proj.status === 'em-andamento' ? 'Em Andamento' : 'Planejamento'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[var(--color-heading)]">
                  {proj.nome}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                  {proj.descricao}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {proj.tags.map((tg) => (
                    <span
                      key={tg}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-subtle)] text-[var(--color-text)] border border-[var(--color-border)]"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-muted)]">Progresso Geral</span>
                  <span className="font-mono font-bold text-[var(--color-heading)]">{pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-subtle)] overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: proj.cor }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <i className="ph ph-calendar" /> Prazo: {fmtDate(proj.prazo)}
                  </span>
                  <button
                    type="button"
                    className="text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1"
                    onClick={() => setView('lista')}
                  >
                    <span>Ver Tarefas</span>
                    <i className="ph ph-arrow-right" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
