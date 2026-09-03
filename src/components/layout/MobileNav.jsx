import React, { useRef, useState, useEffect } from 'react';
import { useHub } from '../../context/HubContext';
import { LayoutDashboard, CheckSquare, Calendar, Clock, Award } from 'lucide-react';

export default function MobileNav() {
  const { view, setView } = useHub();
  const navRef = useRef(null);
  const [indStyle, setIndStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const items = [
    { id: 'dash', label: 'Início', icon: LayoutDashboard },
    { id: 'lista', label: 'Tarefas', icon: CheckSquare },
    { id: 'editorial', label: 'Editorial', icon: Calendar },
    { id: 'banco-horas', label: 'Horas', icon: Clock },
    { id: 'nps', label: 'NPS', icon: Award }
  ];

  useEffect(() => {
    const update = () => {
      if (navRef.current) {
        const active = navRef.current.querySelector('.mob-nav__item--active');
        if (active) {
          setIndStyle({
            left: active.offsetLeft,
            width: active.offsetWidth,
            opacity: 1
          });
        }
      }
    };
    update();
    const t = setTimeout(update, 50);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
    };
  }, [view]);

  return (
    <nav className="mob-nav" ref={navRef}>
      {/* Indicador horizontal deslizante */}
      <div
        className="mob-nav__indicator"
        style={{
          transform: `translateX(${indStyle.left}px)`,
          width: `${indStyle.width}px`,
          opacity: indStyle.opacity
        }}
        aria-hidden="true"
      />
      {items.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button
            key={it.id}
            className={`mob-nav__item ${active ? 'mob-nav__item--active' : ''}`}
            onClick={() => setView(it.id)}
          >
            <Icon />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
