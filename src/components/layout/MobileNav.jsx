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
    setMobileDrawerOpen,
    isAdmin
  } = useHub();

  const dashActs = activities.filter((a) => !isEditorialActivity(a));
  const edActs = activities.filter((a) => isEditorialActivity(a));
  const pendTasks = dashActs.filter((a) => a.stage !== 'concluido').length;
  const pendEd = edActs.filter((a) => a.stage !== 'concluido').length;

  return (
    <nav className="mob-nav" aria-label="Navegação móvel">
      {/* 1. Início (Dashboard - Apenas Administradores) */}
      {isAdmin && (
        <button
          type="button"
          className={`mob-nav__item ${view === 'dash' ? 'mob-nav__item--active' : ''}`}
          onClick={() => setView('dash')}
        >
          <i className="ph ph-squares-four text-2xl" />
          <span>Início</span>
        </button>
      )}

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
          title="Nova Tarefa"
          aria-label="Nova Tarefa"
        >
          <i className="ph ph-plus text-2xl font-bold" />
        </button>
      </div>

      {/* 4. Editorial (Calendário - Apenas Administradores) */}
      {isAdmin && (
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
      )}

      {/* 4.1 Controle de Ponto (Para Colaboradores) */}
      {!isAdmin && (
        <button
          type="button"
          className={`mob-nav__item ${view === 'banco-horas' ? 'mob-nav__item--active' : ''}`}
          onClick={() => setView('banco-horas')}
        >
          <i className="ph ph-clock-user text-2xl" />
          <span>Ponto</span>
        </button>
      )}

      {/* 5. Menu / Mais (Abre o Drawer Lateral) */}
      <button
        type="button"
        className={`mob-nav__item ${mobileDrawerOpen ? 'mob-nav__item--active' : ''}`}
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Abrir menu"
      >
        <i className="ph ph-list text-2xl" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
