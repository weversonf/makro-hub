import React, { useState } from 'react';
import { useHub, fmtDate, DEFAULT_PROJECTS } from '../context/HubContext';
import { Plus, FolderKanban, Calendar, ArrowRight, X } from 'lucide-react';

export default function ProjetosView() {
  const { activities, projects, createProject, setView, openNewTask } = useHub();

  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');
  const [novaCor, setNovaCor] = useState('#1279FF');

  const projsList = projects && projects.length > 0 ? projects : DEFAULT_PROJECTS;
  const filtered = filter === 'all' ? projsList : projsList.filter((c) => c.status === filter);

  const handleSalvarProjeto = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    await createProject({
      nome: novoNome.trim(),
      descricao: novaDescricao.trim(),
      prazo: novoPrazo || null,
      cor: novaCor,
      status: 'em-andamento',
      tags: ['Projeto']
    });
    setNovoNome('');
    setNovaDescricao('');
    setNovoPrazo('');
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header com resumo, filtros e botão Novo Projeto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)] flex items-center gap-2">
            <FolderKanban className="text-[var(--color-primary)]" size={22} />
            <span>Projetos</span>
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Grandes iniciativas e projetos estratégicos de marketing da Makro Engenharia
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`hr-btn text-xs h-8 px-3 ${filter === 'all' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
              onClick={() => setFilter('all')}
            >
              Todos ({projsList.length})
            </button>
            <button
              type="button"
              className={`hr-btn text-xs h-8 px-3 ${filter === 'em-andamento' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
              onClick={() => setFilter('em-andamento')}
            >
              Em Andamento ({projsList.filter((p) => p.status === 'em-andamento').length})
            </button>
            <button
              type="button"
              className={`hr-btn text-xs h-8 px-3 ${filter === 'planejamento' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
              onClick={() => setFilter('planejamento')}
            >
              Planejamento ({projsList.filter((p) => p.status === 'planejamento').length})
            </button>
          </div>

          <button
            type="button"
            className="hr-btn hr-btn--primary text-xs h-8 px-3.5 flex items-center gap-1.5 font-bold shadow-sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* Grid de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((proj) => {
          // Relaciona tarefas vinculadas pelo campo projeto ou nome
          const linkedActs = activities.filter((a) =>
            (a.projeto && a.projeto.toLowerCase() === (proj.nome || '').toLowerCase()) ||
            (a.titulo && a.titulo.toLowerCase().includes((proj.nome || '').toLowerCase()))
          );
          const done = linkedActs.filter((a) => a.stage === 'concluido').length;
          const pct = linkedActs.length > 0 ? Math.round((done / linkedActs.length) * 100) : 0;

          return (
            <div key={proj.id || proj._fbId || proj.nome} className="hr-card flex flex-col justify-between hover:border-[var(--color-primary)]/50 transition">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: proj.cor || '#1279FF' }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                      {proj.lider || 'Equipe Makro'}
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
                {proj.descricao && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                    {proj.descricao}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(proj.tags || ['Projeto']).map((tg) => (
                    <span
                      key={tg}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-subtle)] text-[var(--color-text)] border border-[var(--color-border)]"
                    >
                      #{tg}
                    </span>
                  ))}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    {linkedActs.length} {linkedActs.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--color-muted)]">Progresso das Tarefas</span>
                  <span className="font-mono font-bold text-[var(--color-heading)]">
                    {pct}% ({done}/{linkedActs.length})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-subtle)] overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: proj.cor || '#1279FF' }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> Prazo: {proj.prazo ? fmtDate(proj.prazo) : 'Em aberto'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-[var(--color-muted)] hover:text-[var(--color-primary)] font-semibold flex items-center gap-1 transition"
                      onClick={() => openNewTask({ isProjeto: true, projeto: proj.nome })}
                      title="Criar tarefa para este projeto"
                    >
                      <Plus size={12} />
                      <span>Nova Tarefa</span>
                    </button>
                    <button
                      type="button"
                      className="text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1"
                      onClick={() => setView('lista')}
                    >
                      <span>Ver Tarefas</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Criar Novo Projeto */}
      {modalOpen && (
        <div className="ax-overlay open" onClick={() => setModalOpen(false)}>
          <div
            className="ax-modal max-w-md w-full p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
              <h3 className="text-sm font-bold text-[var(--color-heading)] flex items-center gap-2">
                <FolderKanban size={16} className="text-[var(--color-primary)]" />
                <span>Novo Projeto</span>
              </h3>
              <button
                type="button"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-subtle)]"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSalvarProjeto} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Expomaq 2026, Novo Site..."
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1">
                  Descrição do Projeto
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o escopo e objetivos do projeto..."
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--color-heading)] block mb-1">
                    Prazo Previsto
                  </label>
                  <input
                    type="date"
                    value={novoPrazo}
                    onChange={(e) => setNovoPrazo(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--color-heading)] block mb-1">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="color"
                      value={novaCor}
                      onChange={(e) => setNovaCor(e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-[var(--color-border)] bg-transparent p-0.5"
                    />
                    <span className="text-xs font-mono text-[var(--color-muted)]">{novaCor}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  className="hr-btn hr-btn--secondary text-xs h-8 px-3"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="hr-btn hr-btn--primary text-xs h-8 px-4 font-bold"
                >
                  Cadastrar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
