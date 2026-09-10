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
import ErrorBoundary from './components/common/ErrorBoundary';
import { Plus } from 'lucide-react';

export default function App() {
  const {
    user,
    authLoading,
    signInWithGoogle,
    signInWithEmail,
    sendPasswordReset,
    changePassword,
    signOutUser,
    mustChangePasswordPrompt,
    showToast,
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
    loggingIn,
    isAdmin
  } = useHub();

  const [emailInput, setEmailInput] = React.useState('');
  const [passwordInput, setPasswordInput] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isResetOpen, setIsResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [isSendingReset, setIsSendingReset] = React.useState(false);

  // Estados para troca obrigatória de senha no primeiro login
  const [newPasswordInput, setNewPasswordInput] = React.useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = React.useState('');
  const [isSubmittingNewPassword, setIsSubmittingNewPassword] = React.useState(false);

  const handleEmailLoginSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      showToast('Preencha seu e-mail e sua senha para entrar.', 'error');
      return;
    }
    try {
      await signInWithEmail(emailInput, passwordInput);
    } catch (err) {
      // toast e erro já tratados no HubContext
    }
  };

  const handleSendResetSubmit = async () => {
    if (!resetEmail.trim()) {
      showToast('Informe o seu e-mail.', 'error');
      return;
    }
    setIsSendingReset(true);
    try {
      const ok = await sendPasswordReset(resetEmail);
      if (ok) {
        setIsResetOpen(false);
        setResetEmail('');
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPasswordInput.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      showToast('As senhas digitadas não coincidem.', 'error');
      return;
    }
    setIsSubmittingNewPassword(true);
    try {
      await changePassword(newPasswordInput);
    } finally {
      setIsSubmittingNewPassword(false);
    }
  };

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

  // Troca de Senha Obrigatória no Primeiro Acesso (para logins com e-mail e senha)
  if (user && mustChangePasswordPrompt) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--color-bg)]">
        <div className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-5 z-10">
          <img
            src="https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png"
            alt="Makro"
            className="h-9 object-contain"
          />

          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <i className="ph ph-shield-check text-2xl font-bold" />
          </div>

          <div>
            <h2 className="font-bold text-lg text-[var(--color-heading)]">Alteração Obrigatória de Senha</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1.5 leading-relaxed">
              Olá, <strong>{user.displayName || user.email}</strong>! Por motivos de segurança, você deve cadastrar uma nova senha pessoal para o seu primeiro acesso ao Makro Hub.
            </p>
          </div>

          <form onSubmit={handleChangePasswordSubmit} className="w-full space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                Nova Senha (mínimo 6 caracteres) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Digite sua nova senha pessoal"
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="Repita sua nova senha"
                className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmittingNewPassword}
                className="hr-btn hr-btn--primary w-full h-10 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmittingNewPassword ? (
                  <i className="ph ph-spinner-gap animate-spin text-base" />
                ) : (
                  <i className="ph ph-check-circle text-base" />
                )}
                <span>{isSubmittingNewPassword ? 'Salvando...' : 'Salvar Nova Senha e Acessar'}</span>
              </button>

              <button
                type="button"
                onClick={signOutUser}
                className="hr-btn hr-btn--secondary w-full h-9 text-xs"
              >
                Sair / Entrar com outra conta
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[var(--color-bg)]">
        <div className="max-w-sm w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-5 z-10">
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

          {/* Botão Entrar com Google */}
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

          {/* Divisor */}
          <div className="flex items-center gap-3 w-full my-0.5">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">ou acesse com e-mail</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Formulário de Login por E-mail */}
          <form onSubmit={handleEmailLoginSubmit} className="w-full space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--color-muted)] mb-1">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="seu.email@makroengenharia.com"
                className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[var(--color-muted)]">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-[10px] text-[var(--color-primary)] hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full h-9 px-3 pr-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  <i className={`ph ${showPassword ? 'ph-eye-slash' : 'ph-eye'} text-sm`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="hr-btn hr-btn--secondary w-full h-9 font-bold text-xs flex items-center justify-center gap-2 mt-1"
            >
              {loggingIn ? (
                <i className="ph ph-spinner-gap animate-spin text-sm" />
              ) : (
                <i className="ph ph-sign-in text-sm" />
              )}
              <span>{loggingIn ? 'Entrando...' : 'Entrar com E-mail'}</span>
            </button>
          </form>

          {authError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs text-left leading-relaxed w-full">
              <p className="font-bold flex items-center gap-1.5 mb-0.5 text-[var(--color-heading)]">
                <i className="ph ph-warning-circle text-base text-red-400" />
                Aviso de Autenticação
              </p>
              <p className="text-[11px] leading-normal">{authError}</p>
            </div>
          )}
        </div>

        {/* Modal de Esqueci a Senha */}
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="max-w-xs w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-heading)]">Recuperar Senha</h3>
                <p className="text-[11px] text-[var(--color-muted)] mt-1">
                  Informe seu e-mail cadastrado para receber o link de redefinição.
                </p>
              </div>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu.email@makroengenharia.com"
                className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  className="hr-btn hr-btn--secondary text-xs h-8 px-3"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleSendResetSubmit}
                  className="hr-btn hr-btn--primary text-xs h-8 px-3"
                >
                  {isSendingReset ? 'Enviando...' : 'Enviar Link'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Trava de segurança: Colaboradores e visualizadores têm acesso a Tarefas, Controle de Ponto e Documentos
  const allowedViews = ['lista', 'banco-horas', 'documentos'];
  const activeView = isAdmin ? view : (allowedViews.includes(view) ? view : 'lista');
  const showFab = ['lista', 'dash', 'editorial', 'projetos'].includes(activeView);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans antialiased text-[var(--color-text)]">
      <ErrorBoundary>
        <Sidebar />
        <Header />

        <main className="hr-main-shell">
          <div className="hr-container">
            <ErrorBoundary key={activeView}>
              {activeView === 'lista' && <TarefasView />}
              {activeView === 'banco-horas' && <BancoHorasView />}
              {activeView === 'documentos' && <DocumentosView />}
              {isAdmin && activeView === 'dash' && <DashboardView />}
              {isAdmin && activeView === 'projetos' && <ProjetosView />}
              {isAdmin && activeView === 'editorial' && <CalendarioView />}
              {isAdmin && activeView === 'equipe' && <EquipeView />}
              {isAdmin && activeView === 'performance' && <PerformanceView />}
              {isAdmin && (activeView === 'categorias' || activeView === 'config') && <ConfigView />}
              {isAdmin && activeView === 'nps' && <NpsView />}
            </ErrorBoundary>
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
      </ErrorBoundary>
    </div>
  );
}
