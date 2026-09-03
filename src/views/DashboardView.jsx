import React from 'react';
import { useHub, STAGES, fmtDate } from '../context/HubContext';

export default function DashboardView() {
  const { activities, setView, openEditTask, openNewTask, catOf, stageOf, isOverdue, isDueSoon, user, isEditorialActivity } = useHub();

  const dashActs = activities.filter((a) => !isEditorialActivity(a));
  const edActs = activities.filter((a) => isEditorialActivity(a));
  const total = dashActs.length;
  const concluidas = dashActs.filter((a) => a.stage === 'concluido').length;
  const emAndamento = dashActs.filter((a) => a.stage === 'em-andamento' || a.stage === 'execucao').length;
  const atrasadas = dashActs.filter(isOverdue).length;
  const rate = total ? Math.round((concluidas / total) * 100) : 0;

  const now = new Date();
  const hr = now.getHours();
  const greeting = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'Colaborador';
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  const shortDate = now.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });

  const recActs = dashActs
    .slice()
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, 6);

  const getStatusPill = (a) => {
    if (a.stage === 'concluido') {
      return <span className="hr-pill hr-pill--success"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" /> Concluída</span>;
    }
    if (isOverdue(a)) {
      return <span className="hr-pill hr-pill--danger"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-danger)]" /> Atrasada</span>;
    }
    if (a.stage === 'em-andamento' || a.stage === 'execucao') {
      return <span className="hr-pill hr-pill--info"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" /> Em Andamento</span>;
    }
    return <span className="hr-pill hr-pill--warning"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" /> A Fazer</span>;
  };

  // Dados para o Timeline Project
  const employees = [
    { nome: 'Weverson N.', foto: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    { nome: 'Beatriz V.', foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { nome: 'Lucas M.', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { nome: 'Mariana D.', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
    { nome: 'Rafael C.', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { nome: 'Camila S.', foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
    { nome: 'Marcos P.', foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Topo: Welcome Hero (5) + Quick Actions (4) + Today's Summary (3) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Welcome Banner */}
        <div className="lg:col-span-12 2xl:col-span-5 hr-card-hero flex flex-col justify-between min-h-[190px]">
          <div>
            <p className="text-xs font-semibold text-[var(--color-primary)] tracking-wide uppercase flex items-center gap-1.5">
              <span>👋</span> {greeting}, {firstName}!
            </p>
            <h2 className="text-2xl font-bold text-[var(--color-heading)] mt-1.5">
              Hub de Marketing Makro
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {formattedDate} · {atrasadas > 0 ? `${atrasadas} tarefas precisam de atenção prioritária.` : 'Todas as entregas estão em dia!'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              type="button"
              className="hr-btn hr-btn--primary"
              onClick={() => openNewTask()}
            >
              <i className="ph ph-plus-circle text-lg" />
              <span>Nova Tarefa</span>
            </button>
            <button
              type="button"
              className="hr-btn hr-btn--secondary"
              onClick={() => setView('editorial')}
            >
              <i className="ph ph-calendar-blank text-lg" />
              <span>Ver Calendário ({edActs.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="lg:col-span-6 2xl:col-span-4 hr-card flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[var(--color-heading)] mb-3">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className="hr-quick-action"
              onClick={() => openNewTask('afazer')}
            >
              <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                <i className="ph ph-list-plus text-lg" />
              </span>
              <span className="text-xs font-semibold truncate">Nova Tarefa</span>
            </button>

            <button
              type="button"
              className="hr-quick-action"
              onClick={() => openNewTask('afazer', { categoria: 1 })}
            >
              <span className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-500 flex items-center justify-center flex-shrink-0">
                <i className="ph ph-calendar-plus text-lg" />
              </span>
              <span className="text-xs font-semibold truncate">Agendar Post</span>
            </button>

            <button
              type="button"
              className="hr-quick-action"
              onClick={() => setView('projetos')}
            >
              <span className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center flex-shrink-0">
                <i className="ph ph-kanban text-lg" />
              </span>
              <span className="text-xs font-semibold truncate">Campanhas</span>
            </button>

            <button
              type="button"
              className="hr-quick-action"
              onClick={() => setView('documentos')}
            >
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <i className="ph ph-files text-lg" />
              </span>
              <span className="text-xs font-semibold truncate">Mídia Kit</span>
            </button>
          </div>
        </div>

        {/* CARD: Today's Summary (Conforme Imagem 2 do Hrivo) */}
        <div className="lg:col-span-6 2xl:col-span-3 hr-card flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-bold text-[var(--color-heading)]">
              Today's Summary
            </h3>
            <span className="text-xs text-[var(--color-muted)] font-medium capitalize">
              {shortDate}
            </span>
          </div>

          <div className="flex flex-col gap-3.5 flex-1 justify-center">
            {/* Check-ins / Concluídas */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                  <span className="text-[var(--color-text)] font-medium">Check-ins / Entregas</span>
                </div>
                <span className="font-bold font-mono text-[var(--color-heading)]">
                  {concluidas} / {total}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-success)] transition-all"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>

            {/* On Leave / Em Andamento */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] flex-shrink-0" />
                  <span className="text-[var(--color-text)] font-medium">Em Andamento</span>
                </div>
                <span className="font-bold font-mono text-[var(--color-heading)]">
                  {emAndamento}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-warning)] transition-all"
                  style={{ width: `${total ? Math.round((emAndamento / total) * 100) : 35}%` }}
                />
              </div>
            </div>

            {/* Late Arrivals / Atrasadas */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] flex-shrink-0" />
                  <span className="text-[var(--color-text)] font-medium">Demandas Críticas</span>
                </div>
                <span className="font-bold font-mono text-[var(--color-heading)]">
                  {atrasadas}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-danger)] transition-all"
                  style={{ width: `${total ? Math.min(100, Math.round((atrasadas / total) * 100)) : 18}%` }}
                />
              </div>
            </div>

            {/* Rodapé: Publicações / Reuniões Agendadas */}
            <div className="mt-2 pt-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs">
              <span className="text-[var(--color-primary)] font-semibold">Pautas de Marketing</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline font-semibold"
                onClick={() => setView('editorial')}
              >
                <i className="ph ph-video-camera text-sm" />
                <span>{edActs.length} Agendadas</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hrivo KPI Stats Grid (2x2 em mobile, 4 colunas em desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Tasks */}
        <div className="hr-card p-3.5 sm:p-5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-[var(--color-muted)] truncate">Total Tarefas</p>
            <h4 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] mt-0.5 sm:mt-1">{total}</h4>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-primary)] mt-0.5 block truncate">
              {concluidas} feitas
            </span>
          </div>
          <span className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
            <i className="ph ph-folder text-lg sm:text-2xl" />
          </span>
        </div>

        {/* In Progress */}
        <div className="hr-card p-3.5 sm:p-5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-[var(--color-muted)] truncate">Em Andamento</p>
            <h4 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] mt-0.5 sm:mt-1">{emAndamento}</h4>
            <span className="text-[10px] sm:text-[11px] font-semibold text-blue-500 mt-0.5 block truncate">
              Execução ativa
            </span>
          </div>
          <span className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center flex-shrink-0">
            <i className="ph ph-spinner-gap text-lg sm:text-2xl" />
          </span>
        </div>

        {/* Completion Rate */}
        <div className="hr-card p-3.5 sm:p-5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-[var(--color-muted)] truncate">Taxa Conclusão</p>
            <h4 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] mt-0.5 sm:mt-1">{rate}%</h4>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--color-success)] mt-0.5 block truncate">
              Aproveitamento
            </span>
          </div>
          <span className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center justify-center flex-shrink-0">
            <i className="ph ph-check-circle text-lg sm:text-2xl" />
          </span>
        </div>

        {/* Card 4: Atrasadas / Atenção */}
        <div className="hr-card p-3.5 sm:p-5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-[var(--color-muted)] truncate">Atrasadas</p>
            <h4 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] mt-0.5 sm:mt-1">{atrasadas}</h4>
            <span className={`text-[10px] sm:text-[11px] font-semibold ${atrasadas > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'} mt-0.5 block truncate`}>
              {atrasadas > 0 ? 'Requer atenção' : 'Tudo em dia'}
            </span>
          </div>
          <span className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${atrasadas > 0 ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]' : 'bg-[var(--color-success-soft)] text-[var(--color-success)]'} flex items-center justify-center flex-shrink-0`}>
            <i className={`ph ${atrasadas > 0 ? 'ph-warning-circle' : 'ph-shield-check'} text-lg sm:text-2xl`} />
          </span>
        </div>
      </section>

      {/* CARD: Timeline Project (Conforme Imagem 1 do Hrivo) */}
      <section className="hr-card flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--color-heading)]">
              Timeline Project
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Cronograma de entregas e campanhas distribuído por membros da equipe
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              <i className="ph ph-calendar-blank text-[var(--color-muted)]" />
              <span>Abril 10 - 16, 2026</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-colors"
            >
              <span>Esta Semana</span>
              <i className="ph ph-caret-down text-[var(--color-muted)]" />
            </button>
          </div>
        </div>

        {/* Timeline Table / Gantt */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[680px] flex flex-col">
            {/* Header de Dias */}
            <div className="grid grid-cols-[160px_1fr] gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
              <span className="text-xs font-semibold text-[var(--color-muted)] self-end">
                Colaboradores
              </span>
              <div className="grid grid-cols-7 text-center">
                <div>
                  <span className="text-sm font-semibold text-[var(--color-heading)]">10</span>
                  <span className="text-xs text-[var(--color-muted)] block">Qui</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-heading)]">11</span>
                  <span className="text-xs text-[var(--color-muted)] block">Sex</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-heading)]">12</span>
                  <span className="text-xs text-[var(--color-muted)] block">Sáb</span>
                </div>
                <div className="text-[var(--color-primary)] font-bold">
                  <span className="text-sm block">13</span>
                  <span className="text-xs block">Dom</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-heading)]">14</span>
                  <span className="text-xs text-[var(--color-muted)] block">Seg</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-heading)]">15</span>
                  <span className="text-xs text-[var(--color-muted)] block">Ter</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-heading)]">16</span>
                  <span className="text-xs text-[var(--color-muted)] block">Qua</span>
                </div>
              </div>
            </div>

            {/* Grid & Task Bars */}
            <div className="grid grid-cols-[160px_1fr] gap-3 pt-4">
              {/* Roster de Colaboradores */}
              <div className="flex flex-col justify-between gap-3 py-1">
                {employees.map((emp) => (
                  <div key={emp.nome} className="flex items-center gap-2.5 h-12">
                    <img
                      src={emp.foto}
                      alt={emp.nome}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--color-border)]"
                    />
                    <span className="text-xs font-medium text-[var(--color-heading)] truncate">
                      {emp.nome}
                    </span>
                  </div>
                ))}
              </div>

              {/* Timeline Track com as Barras */}
              <div className="relative flex flex-col justify-between py-1">
                {/* Linhas de coluna verticais */}
                <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                  <span className="border-l border-[var(--color-border-subtle)]" />
                  <span className="border-l border-[var(--color-border-subtle)]" />
                  <span className="border-l border-[var(--color-border-subtle)]" />
                  <span className="border-l border-[var(--color-border-subtle)]" />
                  <span className="border-l border-[var(--color-border-subtle)]" />
                  <span className="border-l border-[var(--color-border-subtle)]" />
                  <span className="border-l border-[var(--color-border-subtle)] border-r" />
                </div>

                {/* Linha pontilhada azul do dia 'Hoje' (Dom 13) */}
                <div className="absolute top-0 bottom-0 left-[50%] border-l border-dashed border-[var(--color-primary)] pointer-events-none opacity-60 z-10" />

                {/* Barra 1: Design System (Qui 10 - Seg 14) */}
                <div className="h-12 flex items-center z-10" style={{ marginLeft: '0%', width: '60%' }}>
                  <div className="w-full h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] px-3 flex items-center gap-2.5 shadow-sm hover:border-[var(--color-primary)] transition">
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-center justify-center flex-shrink-0">
                      <i className="ph ph-pen-nib text-sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--color-heading)] truncate leading-tight">
                        Design System Makro
                      </p>
                      <p className="text-[10px] text-[var(--color-muted)] truncate">
                        Qui 10 Abr - Seg 14 Abr
                      </p>
                    </div>
                    <button type="button" className="text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1">
                      <i className="ph ph-dots-three-vertical text-sm" />
                    </button>
                  </div>
                </div>

                {/* Espaçador entre linhas */}
                <div className="h-12" />

                {/* Barra 2: UI/UX Design & Catálogo (Sáb 12 - Qua 16) */}
                <div className="h-12 flex items-center z-10" style={{ marginLeft: '28.5%', width: '68%' }}>
                  <div className="w-full h-10 rounded-xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)] px-3 flex items-center gap-2.5 shadow-md">
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                      <i className="ph ph-stack text-sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--color-heading)] truncate leading-tight">
                        UI/UX & Catálogo de Frota
                      </p>
                      <p className="text-[10px] text-[var(--color-primary)] truncate font-medium">
                        Sáb 12 Abr - Qua 16 Abr
                      </p>
                    </div>
                    <button type="button" className="text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1">
                      <i className="ph ph-dots-three-vertical text-sm" />
                    </button>
                  </div>
                </div>

                {/* Espaçador entre linhas */}
                <div className="h-12" />
                <div className="h-12" />

                {/* Barra 3: Campanha Super Heavy Lift (Sex 11 - Ter 15) */}
                <div className="h-12 flex items-center z-10" style={{ marginLeft: '14.2%', width: '60%' }}>
                  <div className="w-full h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] px-3 flex items-center gap-2.5 shadow-sm hover:border-[var(--color-primary)] transition">
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-indigo-500 flex items-center justify-center flex-shrink-0">
                      <i className="ph ph-truck text-sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[var(--color-heading)] truncate leading-tight">
                        Campanha Super Heavy Lift
                      </p>
                      <p className="text-[10px] text-[var(--color-muted)] truncate">
                        Sex 11 Abr - Ter 15 Abr
                      </p>
                    </div>
                    <button type="button" className="text-[var(--color-muted)] hover:text-[var(--color-heading)] p-1">
                      <i className="ph ph-dots-three-vertical text-sm" />
                    </button>
                  </div>
                </div>

                {/* Espaçador */}
                <div className="h-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hrivo Recent Activities Table */}
      <section className="hr-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--color-heading)]">
              Atividades Recentes
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Últimas tarefas e entregas cadastradas no Makro Hub
            </p>
          </div>
          <button
            type="button"
            className="hr-btn hr-btn--secondary text-xs h-8 px-3"
            onClick={() => setView('lista')}
          >
            <span>Ver Kanban Completo</span>
            <i className="ph ph-arrow-right" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Categoria</th>
                <th>Progresso</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recActs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[var(--color-muted)]">
                    Nenhuma tarefa registrada ainda.
                  </td>
                </tr>
              ) : (
                recActs.map((a) => {
                  const cat = catOf(a.categoria);
                  return (
                    <tr
                      key={a.id}
                      className="cursor-pointer hover:bg-[var(--color-subtle)] transition"
                      onClick={() => openEditTask(a.id)}
                    >
                      <td>
                        <div className="font-semibold text-[var(--color-heading)] truncate max-w-xs">
                          {a.titulo}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text)]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: cat?.cor || 'var(--color-muted)' }}
                          />
                          {cat?.nome || 'Geral'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-[var(--color-subtle)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${a.progress || 0}%`,
                                background: a.progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)'
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-[var(--color-heading)]">
                            {a.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-[var(--color-muted)] font-mono">
                          {fmtDate(a.dataVencimento)}
                        </span>
                      </td>
                      <td>
                        {getStatusPill(a)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
