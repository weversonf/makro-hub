import React, { useEffect } from 'react';
import { useHub } from './context/HubContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileNav from './components/layout/MobileNav';
import Toast from './components/common/Toast';
import ConfirmModal from './components/common/ConfirmModal';
import TaskModal from './components/modals/TaskModal';
import CategoryModal from './components/modals/CategoryModal';
import NotificationsModal from './components/modals/NotificationsModal';
import DashboardView from './views/DashboardView';
import TarefasView from './views/TarefasView';
import CalendarioView from './views/CalendarioView';
import ProjetosView from './views/ProjetosView';
import DocumentosView from './views/DocumentosView';
import EquipeView from './views/EquipeView';
import PerformanceView from './views/PerformanceView';
import CategoriasView from './views/CategoriasView';
import ConfigView from './views/ConfigView';
import BancoHorasView from './views/BancoHorasView';
import NpsView from './views/NpsView';
import { Plus } from 'lucide-react';

export default function App() {
  const {
    user,
    authLoading,
    signInWithGoogle,
    view,
    openNewTask,
    setTheme,
    setCollapsed,
    taskModalOpen,
    closeTaskModal,
    catModalOpen,
    closeCategoryModal,
    notifModalOpen,
    closeNotifModal,
    confirmModal,
    closeConfirm,
    authError,
    loggingIn
  } = useHub();

  // Atalhos Globais de Teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Esc fecha modais
      if (e.key === 'Escape') {
        if (confirmModal.open) { closeConfirm(); return; }
        if (notifModalOpen) { closeNotifModal(); return; }
        if (taskModalOpen) { closeTaskModal(); return; }
        if (catModalOpen) { closeCategoryModal(); return; }
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
          e.target.blur();
        }
        return;
      }

      // Se estiver digitando, ignora atalhos de 1 tecla
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openNewTask();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      } else if (e.key === '[') {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, taskModalOpen, catModalOpen, notifModalOpen, closeConfirm, closeTaskModal, closeCategoryModal, closeNotifModal, openNewTask, setTheme, setCollapsed]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--ax-canvas)]">
        <div className="flex flex-col items-center gap-4">
          <div className="ax-spinner" />
          <span className="text-xs text-[var(--ax-text-muted)] font-medium">Carregando Hub de Marketing…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--color-bg)]">
        <div className="max-w-sm w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center gap-6 z-10">
          <img
            src="https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png"
            alt="Makro"
            className="h-9 object-contain"
          />

          <div>
            <h2 className="font-bold text-xl text-[var(--color-heading)]">Hub de Marketing</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1.5 leading-relaxed">
              Gestão Integrada de Tarefas, Calendário Editorial e NPS Makro
            </p>
          </div>

          <button
            type="button"
            className="hr-btn hr-btn--primary w-full h-11 flex items-center justify-center gap-2.5 font-bold text-sm shadow-md hover:scale-[1.01] transition"
            onClick={signInWithGoogle}
            disabled={loggingIn}
          >
            {loggingIn ? (
              <i className="ph ph-spinner-gap animate-spin text-lg" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loggingIn ? 'Autenticando...' : 'Entrar com Google'}</span>
          </button>

          {authError && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs text-left leading-relaxed w-full">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-[var(--color-heading)]">
                <i className="ph ph-warning-circle text-base text-red-400" />
                Domínio Pendente no Firebase
              </p>
              <p className="text-[11px] leading-normal">{authError}</p>
              {authError.includes('Firebase') && (
                <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] text-[var(--color-muted)]">
                  Adicione <code>makrohub.vercel.app</code> em <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</strong>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const showFab = view !== 'banco-horas' && view !== 'nps';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans antialiased text-[var(--color-text)]">
      <Sidebar />
      <Header />

      <main className="hr-main-shell">
        <div className="hr-container">
          {view === 'dash' && <DashboardView />}
          {view === 'lista' && <TarefasView />}
          {view === 'projetos' && <ProjetosView />}
          {view === 'editorial' && <CalendarioView />}
          {view === 'documentos' && <DocumentosView />}
          {view === 'equipe' && <EquipeView />}
          {view === 'performance' && <PerformanceView />}
          {(view === 'categorias' || view === 'config') && <ConfigView />}
          {view === 'banco-horas' && <BancoHorasView />}
          {view === 'nps' && <NpsView />}
        </div>
      </main>

      {showFab && (
        <button
          className="hidden lg:flex fixed bottom-6 right-6 z-40 rounded-full bg-[var(--color-primary)] text-white shadow-xl hover:scale-105 transition items-center justify-center border-0 cursor-pointer"
          style={{ width: '52px', height: '52px' }}
          title="Nova Tarefa (N)"
          onClick={() => openNewTask()}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      <MobileNav />

      {/* Modais Globais */}
      <TaskModal />
      <CategoryModal />
      <NotificationsModal />
      <ConfirmModal />
      <Toast />
    </div>
  );
}
