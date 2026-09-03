import React from 'react';
import { useHub } from '../context/HubContext';

export default function EquipeView() {
  const { activities, user } = useHub();

  const members = [
    {
      id: 1,
      nome: user?.displayName || 'Weverson Nascimento',
      cargo: 'Coordenador de Marketing & Comunicação',
      email: user?.email || 'weverson.nascimento@makroengenharia.com.br',
      ramal: '(85) 99924-1234',
      departamento: 'Marketing Central',
      foto: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      especialidades: ['Gestão de Marca', 'Estratégia B2B', 'Mídia & Relações Públicas'],
      online: true
    },
    {
      id: 2,
      nome: 'Beatriz Vasconcelos',
      cargo: 'Social Media & Gestora de Conteúdo',
      email: 'beatriz.conteudo@makroengenharia.com.br',
      ramal: '(85) 99812-4567',
      departamento: 'Editorial & Redes Sociais',
      foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      especialidades: ['Instagram', 'LinkedIn Corporativo', 'Redação'],
      online: true
    },
    {
      id: 3,
      nome: 'Lucas Mendonça',
      cargo: 'Designer Gráfico & UI',
      email: 'lucas.design@makroengenharia.com.br',
      ramal: '(85) 99765-8899',
      departamento: 'Criação Visual',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      especialidades: ['Identidade Visual', 'Diagramação', 'Peças Publicitárias'],
      online: true
    },
    {
      id: 4,
      nome: 'Mariana Duarte',
      cargo: 'Comunicação Interna & Endomarketing',
      email: 'mariana.duarte@makroengenharia.com.br',
      ramal: '(85) 99654-3322',
      departamento: 'Endomarketing',
      foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      especialidades: ['SIPAT', 'Comunicados Internos', 'Eventos Makro'],
      online: false
    },
    {
      id: 5,
      nome: 'Rafael Costa',
      cargo: 'Videomaker & Editor Audiovisual',
      email: 'rafael.video@makroengenharia.com.br',
      ramal: '(85) 99543-2211',
      departamento: 'Audiovisual & Obras',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      especialidades: ['Captação em Campo', 'Drone', 'Edição de Vídeo'],
      online: true
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)]">Equipe do Marketing</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Colaboradores, papéis, responsabilidades e contatos da equipe Makro Engenharia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
            4 online agora
          </span>
        </div>
      </div>

      {/* Grid de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="hr-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={m.foto}
                    alt={m.nome}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-border)]"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-surface)] ${
                      m.online ? 'bg-[var(--color-success)]' : 'bg-[var(--color-muted)]'
                    }`}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-heading)] truncate">
                    {m.nome}
                  </h3>
                  <p className="text-xs text-[var(--color-primary)] font-medium truncate">
                    {m.cargo}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)] truncate">
                    {m.departamento}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)] mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2 truncate">
                  <i className="ph ph-envelope-simple text-[var(--color-muted)] text-sm" />
                  <span className="truncate">{m.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ph ph-phone text-[var(--color-muted)] text-sm" />
                  <span>{m.ramal}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {m.especialidades.map((esp) => (
                  <span
                    key={esp}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-subtle)] text-[var(--color-text)] border border-[var(--color-border)]"
                  >
                    {esp}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-muted)]">
                Status: <strong className={m.online ? 'text-[var(--color-success)]' : 'text-[var(--color-muted)]'}>{m.online ? 'Disponível' : 'Ausente'}</strong>
              </span>
              <a
                href={`mailto:${m.email}`}
                className="hr-btn hr-btn--secondary text-xs h-7 px-2.5"
              >
                <i className="ph ph-chat-circle-dots" />
                <span>Mensagem</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
