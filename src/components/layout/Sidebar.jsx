import React, { useRef, useState, useEffect } from 'react';
import { useHub } from '../../context/HubContext';

export default function Sidebar() {
  const {
    view,
    setView,
    activities,
    categories,
    user,
    signOutUser,
    collapsed,
    setCollapsed,
    isEditorialActivity,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    theme,
    setTheme
  } = useHub();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hr-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hr-theme', 'light');
    }
  };
  const navRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 48, opacity: 0 });

  const dashActs = activities.filter((a) => !isEditorialActivity(a));
  const edActs = activities.filter((a) => isEditorialActivity(a));
  const pend = dashActs.filter((a) => a.stage !== 'concluido').length;

  const initials = (name) => {
    if (!name) return 'MK';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) {
      document.documentElement.classList.add('sidebar-collapsed');
      localStorage.setItem('hr-sidebar', 'collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      localStorage.setItem('hr-sidebar', 'expanded');
    }
  };

  // Efeito deslizante magnético que desliza suavemente até o item selecionado
  useEffect(() => {
    const updateIndicator = () => {
      if (navRef.current) {
        const activeEl = navRef.current.querySelector('.hr-nav-item--active');
        if (activeEl) {
          setIndicatorStyle({
            top: activeEl.offsetTop,
            height: activeEl.offsetHeight,
            opacity: 1
          });
        } else {
          setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        }
      }
    };

    updateIndicator();
    const t1 = setTimeout(updateIndicator, 50);
    const t2 = setTimeout(updateIndicator, 200);
    window.addEventListener('resize', updateIndicator);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [view, collapsed]);

  return (
    <>
      {/* Backdrop escuro para Mobile Drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`hr-sidebar ${mobileDrawerOpen ? 'open' : ''}`} id="sidebar">
        {/* Brand Header */}
        <div className="hr-sidebar__brand">
          <a
            className="flex items-center gap-2 overflow-hidden cursor-pointer"
            onClick={collapsed ? toggleSidebar : () => setView('dash')}
            title={collapsed ? 'Clique para expandir o menu' : 'Makro'}
          >
            <img
              className="hr-sidebar__logo-full"
              src="https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png"
              alt="Makro Engenharia"
            />
            <img
              className="hr-sidebar__logo-icon"
              src="https://makroengenharia.com.br/wp-content/uploads/2026/08/ICONE-ESTRELA-LOGO-MAKRO-VERMELHA.png"
              alt="Makro"
            />
          </a>

          {/* Botão recolher no Desktop */}
          <button
            type="button"
            className="hidden lg:inline-flex hr-icon-btn hr-sidebar-toggle-btn w-8 h-8 rounded-lg text-[var(--color-sidebar-muted)] hover:text-white hover:bg-white/10 transition-colors"
            onClick={toggleSidebar}
            title="Recolher Menu"
            aria-label="Toggle sidebar"
          >
            <i className="ph ph-sidebar-simple text-lg" />
          </button>

          {/* Ações no Mobile Drawer (Lado Direito): Alternar Tema + Fechar */}
          <div className="lg:hidden flex items-center gap-1.5">
            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-sidebar-muted)] hover:text-white hover:bg-white/10 transition-colors"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              aria-label="Alternar tema"
            >
              <i className={`ph ${theme === 'dark' ? 'ph-sun' : 'ph-moon'} text-lg`} />
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-sidebar-muted)] hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
              title="Fechar Menu"
              aria-label="Close menu"
            >
              <i className="ph ph-x text-lg" />
            </button>
          </div>
        </div>

      {/* Navigation Links */}
      <nav className="hr-sidebar__nav" ref={navRef}>
        {/* Indicador Circular Deslizante Animado */}
        <div
          className="hr-nav-indicator"
          style={{
            transform: `translateY(${indicatorStyle.top}px)`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity
          }}
          aria-hidden="true"
        />
        {/* Main Section */}
        <div>
          <p className="hr-nav-section">Principal</p>
          <button
            className={`hr-nav-item ${view === 'dash' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('dash')}
            data-tooltip="Dashboard"
          >
            <i className="ph ph-squares-four text-xl flex-shrink-0" />
            <span className="hr-nav-label">Dashboard</span>
            <span className="hr-nav-badge">{dashActs.length}</span>
          </button>
        </div>

        {/* Workspace Section */}
        <div>
          <p className="hr-nav-section">Workspace</p>
          <button
            className={`hr-nav-item ${view === 'lista' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('lista')}
            data-tooltip="Tarefas & Kanban"
          >
            <i className="ph ph-list-checks text-xl flex-shrink-0" />
            <span className="hr-nav-label">Tarefas</span>
            <span className="hr-nav-badge">{pend}</span>
          </button>

          <button
            className={`hr-nav-item ${view === 'projetos' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('projetos')}
            data-tooltip="Campanhas & Projetos"
          >
            <i className="ph ph-kanban text-xl flex-shrink-0" />
            <span className="hr-nav-label">Campanhas / Projetos</span>
          </button>

          <button
            className={`hr-nav-item ${view === 'editorial' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('editorial')}
            data-tooltip="Calendário Editorial"
          >
            <i className="ph ph-calendar-blank text-xl flex-shrink-0" />
            <span className="hr-nav-label">Calendário</span>
            <span className="hr-nav-badge">{edActs.length}</span>
          </button>

          <button
            className={`hr-nav-item ${view === 'documentos' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('documentos')}
            data-tooltip="Documentos & Mídia Kit"
          >
            <i className="ph ph-files text-xl flex-shrink-0" />
            <span className="hr-nav-label">Documentos / Mídia Kit</span>
          </button>
        </div>

        {/* Pessoas & Equipe */}
        <div>
          <p className="hr-nav-section">Pessoas & Equipe</p>
          <button
            className={`hr-nav-item ${view === 'equipe' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('equipe')}
            data-tooltip="Equipe do Marketing"
          >
            <i className="ph ph-users-three text-xl flex-shrink-0" />
            <span className="hr-nav-label">Equipe do Marketing</span>
          </button>
        </div>

        {/* Métricas & Gestão */}
        <div>
          <p className="hr-nav-section">Métricas & Gestão</p>
          <button
            className={`hr-nav-item ${view === 'performance' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('performance')}
            data-tooltip="Performance & Desempenho"
          >
            <i className="ph ph-chart-line-up text-xl flex-shrink-0" />
            <span className="hr-nav-label">Performance</span>
          </button>

          <button
            className={`hr-nav-item ${view === 'banco-horas' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('banco-horas')}
            data-tooltip="Banco de Horas"
          >
            <i className="ph ph-clock-user text-xl flex-shrink-0" />
            <span className="hr-nav-label">Banco de Horas</span>
          </button>

          <button
            className={`hr-nav-item ${view === 'nps' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('nps')}
            data-tooltip="Pesquisa NPS"
          >
            <i className="ph ph-medal text-xl flex-shrink-0" />
            <span className="hr-nav-label">Pesquisa NPS</span>
          </button>
        </div>

        {/* Sistema Section */}
        <div className="mt-auto">
          <p className="hr-nav-section">Sistema</p>
          <button
            className={`hr-nav-item ${view === 'config' ? 'hr-nav-item--active' : ''}`}
            onClick={() => setView('config')}
            data-tooltip="Configurações"
          >
            <i className="ph ph-gear text-xl flex-shrink-0" />
            <span className="hr-nav-label">Configurações</span>
          </button>
        </div>
      </nav>

      {/* User Footer */}
      <div className="hr-sidebar__footer">
        <div className="hr-user-wrap flex items-center gap-3 w-full">
          <div className="hr-user-avatar-wrap relative flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center">
                {initials(user?.displayName || user?.email)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--color-success)] border-2 border-[var(--color-sidebar)]" />
          </div>

          <div className="hr-user-meta min-w-0 flex-1 leading-tight">
            <p className="text-xs font-semibold text-white truncate">
              {user?.displayName || (user?.email ? user.email.split('@')[0] : 'Colaborador')}
            </p>
            <p className="text-[11px] text-[var(--color-sidebar-muted)] truncate">{user?.email || 'Makro Engenharia'}</p>
          </div>

          <button
            type="button"
            className="hr-user-logout-btn text-[var(--color-sidebar-muted)] hover:text-white p-1 rounded-lg transition"
            title="Sair"
            onClick={signOutUser}
          >
            <i className="ph ph-sign-out text-lg" />
          </button>
        </div>
      </div>
    </aside>
  </>
  );
}
