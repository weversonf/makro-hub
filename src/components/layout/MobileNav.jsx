import React from 'react';
import { useHub } from '../../context/HubContext';

export default function MobileNav() {
  const {
    view,
    setView,
    openNewTask,
    activities,
    isEditorialActivity,
    mobileDrawerOpen,
    setMobileDrawerOpen
  } = useHub();

  const dashActs = activities.filter((a) => !isEditorialActivity(a));
  const edActs = activities.filter((a) => isEditorialActivity(a));
  const pendTasks = dashActs.filter((a) => a.stage !== 'concluido').length;
  const pendEd = edActs.filter((a) => a.stage !== 'concluido').length;

  return (
    <nav className="mob-nav" aria-label="Navegação móvel">
      {/* 1. Início (Dashboard) */}
      <button
        type="button"
        className={`mob-nav__item ${view === 'dash' ? 'mob-nav__item--active' : ''}`}
        onClick={() => setView('dash')}
      >
        <i className="ph ph-squares-four text-2xl" />
        <span>Início</span>
      </button>

      {/* 2. Tarefas */}
      <button
        type="button"
        className={`mob-nav__item ${view === 'lista' ? 'mob-nav__item--active' : ''}`}
        onClick={() => setView('lista')}
      >
        <div className="relative inline-flex items-center justify-center">
          <i className="ph ph-check-square text-2xl" />
          {pendTasks > 0 && <span className="mob-nav__badge">{pendTasks}</span>}
        </div>
        <span>Tarefas</span>
      </button>

      {/* 3. Botão Central: Criar (+ Nova Demanda) */}
      <div className="mob-nav__fab-wrap">
        <button
          type="button"
          className="mob-nav__fab"
          onClick={() => openNewTask()}
          title="Nova Tarefa ou Post"
          aria-label="Nova Tarefa ou Publicação"
        >
          <i className="ph ph-plus text-2xl font-bold" />
        </button>
      </div>

      {/* 4. Editorial (Calendário) */}
      <button
        type="button"
        className={`mob-nav__item ${view === 'editorial' ? 'mob-nav__item--active' : ''}`}
        onClick={() => setView('editorial')}
      >
        <div className="relative inline-flex items-center justify-center">
          <i className="ph ph-calendar text-2xl" />
          {pendEd > 0 && <span className="mob-nav__badge">{pendEd}</span>}
        </div>
        <span>Editorial</span>
      </button>

      {/* 5. Menu / Mais (Abre o Drawer Lateral Completo) */}
      <button
        type="button"
        className={`mob-nav__item ${mobileDrawerOpen ? 'mob-nav__item--active' : ''}`}
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Abrir menu completo"
      >
        <i className="ph ph-list text-2xl" />
        <span>Mais</span>
      </button>
    </nav>
  );
}
