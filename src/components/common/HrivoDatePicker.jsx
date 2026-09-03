import React, { useState, useRef, useEffect } from 'react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const DOW_NAMES = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function HrivoDatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', label, icon }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Inicializa visualização do calendário no mês do valor selecionado ou na data atual
  const initialDate = value ? new Date(value + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Formatação de exibição dd/mm/aaaa
  const formatDisplay = (val) => {
    if (!val) return '';
    const parts = String(val).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  // Cálculo das células do mês
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const currentDayNum = today.getDate();

  const selectedParts = value ? value.split('-').map(Number) : null;
  const isSelectedMonth = selectedParts && selectedParts[0] === viewYear && selectedParts[1] - 1 === viewMonth;
  const selectedDayNum = selectedParts ? selectedParts[2] : null;

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botão Gatilho Estilo Hrivo */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-subtle)] text-xs text-[var(--color-heading)] flex items-center justify-between gap-2 hover:border-[var(--color-primary)] transition text-left cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          {icon || <i className="ph ph-calendar text-sm text-[var(--color-muted)]" />}
          <span className={value ? 'font-medium font-mono' : 'text-[var(--color-muted)]'}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </span>
        <i className="ph ph-caret-down text-xs text-[var(--color-muted)] flex-shrink-0" />
      </button>

      {/* Popover Calendário Hrivo Dark/Light */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: Navegação de Mês */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--color-heading)] capitalize">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition"
              >
                <i className="ph ph-caret-left text-sm" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition"
              >
                <i className="ph ph-caret-right text-sm" />
              </button>
            </div>
          </div>

          {/* Dias da Semana (D, S, T, Q, Q, S, S) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DOW_NAMES.map((d, i) => (
              <span key={i} className="text-[11px] font-bold text-[var(--color-muted)]">
                {d}
              </span>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Dias do mês anterior (cinza) */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const day = prevMonthDays - firstDayOfWeek + i + 1;
              return (
                <span key={`prev-${i}`} className="text-xs text-[var(--color-faint)] opacity-40 p-1">
                  {day}
                </span>
              );
            })}

            {/* Dias do mês atual */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = isSelectedMonth && selectedDayNum === day;
              const isToday = isCurrentMonth && currentDayNum === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition mx-auto ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white shadow-md shadow-blue-500/30'
                      : isToday
                      ? 'border border-[var(--color-primary)] text-[var(--color-primary)] font-bold hover:bg-[var(--color-subtle)]'
                      : 'text-[var(--color-heading)] hover:bg-[var(--color-subtle)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Rodapé com Limpar e Hoje */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[var(--color-border-subtle)] text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-[var(--color-muted)] hover:text-[var(--color-danger)] font-medium transition"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-[var(--color-primary)] hover:underline font-bold transition"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
