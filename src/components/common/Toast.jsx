import React from 'react';
import { useHub } from '../../context/HubContext';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Toast() {
  const { toasts } = useHub();

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const isErr = t.type === 'error';
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm transition-all pointer-events-auto ${
              isErr
                ? 'bg-[var(--ax-surface-solid)] border-[var(--ax-danger-500)] text-[var(--ax-text-strong)]'
                : 'bg-[var(--ax-surface-solid)] border-[var(--ax-border)] text-[var(--ax-text-strong)]'
            }`}
            style={{ borderLeftWidth: '4px', borderLeftColor: isErr ? 'var(--ax-danger-500)' : 'var(--ax-success-500)' }}
          >
            {isErr ? (
              <AlertCircle size={18} style={{ color: 'var(--ax-danger-500)' }} />
            ) : (
              <CheckCircle2 size={18} style={{ color: 'var(--ax-success-500)' }} />
            )}
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
