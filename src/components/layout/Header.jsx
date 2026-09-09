import React from 'react';
import { useHub } from '../../context/HubContext';

export default function Header() {
  const {
    theme,
    setTheme,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    openNewTask,
    activities,
    collapsed,
    setCollapsed,
    toggleSidebar,
    user,
    signOutUser,
    setMobileDrawerOpen,
    toggleTheme,
    openNotifModal,
    notifications,
    isAdmin,
    isMaster,
    userLevelInfo
  } = useHub();

  const initials = (name) => {
    if (!name) return 'MK';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const viewTitles = {
    dash: 'Dashboard',
    lista: 'Tarefas & Kanban',
    projetos: 'Projetos',
    editorial: 'Calendário Editorial',
    documentos: 'Documentos & Mídia Kit',
    equipe: 'Equipe do Marketing',
    performance: 'Performance & Desempenho',
    categorias: 'Categorias de Marketing',
    'banco-horas': 'Controle de Ponto & Banco de Horas',
    nps: 'Pesquisa de Satisfação NPS',
    config: 'Configurações'
  };

  const urgentCount = activities.filter((a) => a.stage !== 'concluido' && (a.prioridade === 'alta' || a.prioridade === 'urgente')).length;

  return (
    <header className="hr-topbar hidden lg:flex" id="topbar">
      {/* Left: Page Title & Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Desktop Sidebar Toggle (Retrátil) */}
        <button
          type="button"
          className="hidden lg:inline-flex hr-icon-btn text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-subtle)] transition"
          onClick={toggleSidebar}
          title={collapsed ? "Expandir menu lateral ( [ )" : "Recolher menu lateral ( [ )"}
          aria-label="Alternar menu lateral"
        >
          <i className={`ph ${collapsed ? 'ph-sidebar-simple text-[var(--color-primary)] font-bold' : 'ph-sidebar-simple'} text-xl`} />
        </button>

        <button
          type="button"
          className="hr-icon-btn hr-mobile-toggle"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Menu"
        >
          <i className="ph ph-list text-xl" />
        </button>
        <img
          src="https://makroengenharia.com.br/wp-content/uploads/2026/08/ICONE-ESTRELA-LOGO-MAKRO-VERMELHA.png"
          alt="Makro"
          className="w-6 h-6 object-contain sm:hidden flex-shrink-0"
        />
        <h1 className="text-base sm:text-xl font-bold text-[var(--color-heading)] m-0 truncate max-w-[160px] sm:max-w-none">
          {viewTitles[view] || 'Dashboard'}
        </h1>
      </div>

      {/* Right: Search, Actions, Theme Toggle, New Task Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search */}
        <div className="hr-search-wrap hidden md:flex">
          <i className="ph ph-magnifying-glass text-[var(--color-faint)] text-lg" />
          <input
            type="text"
            className="hr-search-input"
            placeholder="Buscar atividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]">
            /
          </kbd>
        </div>

        {/* Calendar Quick Link (Apenas Administradores) */}
        {isAdmin && (
          <button
            type="button"
            className="hr-icon-btn"
            onClick={() => setView('editorial')}
            title="Calendário"
          >
            <i className="ph ph-calendar-dots text-lg sm:text-xl" />
          </button>
        )}

        {/* Notifications / Alerts */}
        <button
          type="button"
          className="hr-icon-btn relative"
          onClick={openNotifModal}
          title={notifications.length > 0 ? `${notifications.length} notificações pendentes` : 'Notificações'}
        >
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold leading-none flex items-center justify-center">
              {notifications.length}
            </span>
          )}
          <i className="ph ph-bell text-lg sm:text-xl" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          className="hr-icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          <i className={`ph ${theme === 'dark' ? 'ph-sun' : 'ph-moon'} text-lg sm:text-xl`} />
        </button>

        {/* New Task Action Button */}
        <button
          type="button"
          className="hr-btn hr-btn--primary"
          onClick={() => openNewTask()}
        >
          <i className="ph ph-plus-circle text-lg" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </button>

        {/* User Profile Pill & Logout Button in Header */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[var(--color-border)]">
          <div
            className="flex items-center gap-2 py-1 px-1.5 rounded-xl text-left"
            title={`${user?.displayName || user?.email} (${userLevelInfo?.label || 'Colaborador'})`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center border border-[var(--color-border)] shadow-xs">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{initials(user?.displayName || user?.email)}</span>
              )}
            </div>
            <div className="hidden xl:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-[var(--color-heading)] truncate max-w-[120px]">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-[var(--color-muted)] truncate max-w-[120px] mt-0.5">
                {isMaster ? 'ADM Master' : (userLevelInfo?.label || 'Colaborador')}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="hr-icon-btn text-[var(--color-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
            onClick={signOutUser}
            title="Sair da Conta (Logout)"
            aria-label="Sair da Conta"
          >
            <i className="ph ph-sign-out text-lg" />
          </button>
        </div>
      </div>
    </header>
  );
}
