import React from 'react';
import { useHub, fmtDate } from '../../context/HubContext';
import { X, Bell, AlertTriangle, Clock, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function NotificationsModal() {
  const {
    notifModalOpen,
    closeNotifModal,
    notifications,
    openEditTask,
    setView
  } = useHub();

  if (!notifModalOpen) return null;

  return (
    <div className="ax-overlay open" onClick={closeNotifModal}>
      <div
        className="ax-modal max-w-lg w-full p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-danger-soft)] text-[var(--color-danger)] flex items-center justify-center font-bold relative">
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)] absolute -top-0.5 -right-0.5 ring-2 ring-[var(--color-surface)]" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--color-heading)] flex items-center gap-2">
                <span>Notificações & Pendências</span>
                {notifications.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-danger)] text-white">
                    {notifications.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                {notifications.length === 0
                  ? 'Nenhuma pendência crítica no momento'
                  : `${notifications.length} tarefa${notifications.length === 1 ? '' : 's'} necessitando de atenção`}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-subtle)] hover:text-[var(--color-heading)] transition"
            onClick={closeNotifModal}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 my-1">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <h4 className="text-sm font-bold text-[var(--color-heading)]">Tudo em dia!</h4>
              <p className="text-xs text-[var(--color-muted)] max-w-xs">
                Excelente trabalho! Você não possui nenhuma tarefa atrasada ou com prazo urgente vencendo hoje.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isOverdue = n.type === 'overdue';
              const isDueSoon = n.type === 'duesoon';
              const isUrgent = n.type === 'urgent';

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    closeNotifModal();
                    openEditTask(n.taskId);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 group ${
                    isOverdue
                      ? 'bg-red-500/5 border-red-500/25 hover:border-red-500/60 hover:bg-red-500/10'
                      : isDueSoon
                      ? 'bg-amber-500/5 border-amber-500/25 hover:border-amber-500/60 hover:bg-amber-500/10'
                      : 'bg-orange-500/5 border-orange-500/25 hover:border-orange-500/60 hover:bg-orange-500/10'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-red-500/15 text-red-500'
                        : isDueSoon
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-orange-500/15 text-orange-500'
                    }`}
                  >
                    {isOverdue && <AlertTriangle size={16} />}
                    {isDueSoon && <Clock size={16} />}
                    {isUrgent && <Flame size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                            : isDueSoon
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {n.badge}
                      </span>

                      {n.date && (
                        <span className="text-[11px] font-mono text-[var(--color-muted)]">
                          {fmtDate(n.date)}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-[var(--color-heading)] truncate group-hover:text-[var(--color-primary)] transition">
                      {n.title}
                    </h4>

                    <p className="text-[11px] text-[var(--color-muted)] mt-0.5 line-clamp-1">
                      {n.desc}
                    </p>

                    {n.task?.projeto && (
                      <span className="inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-subtle)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                        📁 {n.task.projeto}
                      </span>
                    )}
                  </div>

                  <div className="self-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all">
                    <ArrowRight size={15} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com atalhos */}
        <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between flex-shrink-0 gap-2">
          <button
            type="button"
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            onClick={() => {
              closeNotifModal();
              setView('lista');
            }}
          >
            <span>Ver quadro de tarefas</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            className="hr-btn hr-btn--secondary text-xs h-8 px-4"
            onClick={closeNotifModal}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
