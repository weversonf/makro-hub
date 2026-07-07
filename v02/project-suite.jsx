import React, { useState, useRef } from "react";
import {
  LayoutDashboard, FolderKanban, Trello, CalendarClock, Users, UserSquare2,
  Wallet, BarChart3, Settings, Search, Plus, Bell, ChevronDown, Star,
  MessageSquare, Paperclip, Clock, MoreHorizontal, CheckCircle2, Circle,
  Sun, Moon, Filter, ChevronRight
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projetos", label: "Projetos", icon: FolderKanban },
  { key: "boards", label: "Boards", icon: FolderKanban },
  { key: "kanban", label: "Kanban", icon: Trello },
  { key: "cronograma", label: "Cronograma", icon: CalendarClock },
  { key: "clientes", label: "Clientes", icon: UserSquare2 },
  { key: "equipe", label: "Equipe", icon: Users },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "relatorios", label: "Relatórios", icon: BarChart3 },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];

const KPI = [
  { label: "Projetos", value: "24", sub: "+3 este mês", color: "#3B82F6", icon: FolderKanban },
  { label: "Tarefas", value: "312", sub: "18 novas hoje", color: "#7C3AED", icon: CheckCircle2 },
  { label: "Em andamento", value: "87", sub: "62% do total", color: "#F59E0B", icon: Clock },
  { label: "Concluídas", value: "196", sub: "+12 esta semana", color: "#22C55E", icon: CheckCircle2 },
  { label: "Horas", value: "1.284h", sub: "média 6.4h/dia", color: "#3B82F6", icon: Clock },
  { label: "Clientes", value: "38", sub: "5 ativos agora", color: "#EF4444", icon: UserSquare2 },
];

const STATUS_STYLES = {
  "Done": { bg: "#DCFCE7", text: "#15803D", dot: "#22C55E" },
  "Working On It": { bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B" },
  "Stuck": { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
  "Waiting": { bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF" },
  "Review": { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  "Planning": { bg: "#EDE9FE", text: "#6D28D9", dot: "#7C3AED" },
};
const STATUS_LIST = Object.keys(STATUS_STYLES);

const PEOPLE = [
  { name: "Ana Souza", color: "#3B82F6", initials: "AS" },
  { name: "Bruno Lima", color: "#7C3AED", initials: "BL" },
  { name: "Carla Dias", color: "#F59E0B", initials: "CD" },
  { name: "Diego Alves", color: "#22C55E", initials: "DA" },
  { name: "Elis Nunes", color: "#EF4444", initials: "EN" },
];

const initialRows = [
  { id: 1, name: "Redesign do site institucional", owners: [0, 1], status: "Working On It", start: 20, len: 30, date: "12 Jul", priority: 3, tags: ["Design", "Web"], progress: 62, comments: 8, files: 4 },
  { id: 2, name: "App mobile - módulo financeiro", owners: [2], status: "Stuck", start: 10, len: 20, date: "05 Jul", priority: 4, tags: ["Mobile"], progress: 24, comments: 3, files: 1 },
  { id: 3, name: "Migração de infraestrutura AWS", owners: [3, 4], status: "Planning", start: 40, len: 25, date: "22 Jul", priority: 2, tags: ["DevOps", "Infra"], progress: 8, comments: 1, files: 0 },
  { id: 4, name: "Campanha de marketing Q3", owners: [1], status: "Review", start: 5, len: 35, date: "01 Jul", priority: 3, tags: ["Marketing"], progress: 85, comments: 15, files: 9 },
  { id: 5, name: "Integração API de pagamentos", owners: [0, 3], status: "Done", start: 0, len: 40, date: "28 Jun", priority: 5, tags: ["Backend", "API"], progress: 100, comments: 22, files: 6 },
  { id: 6, name: "Onboarding de novos clientes", owners: [2, 4], status: "Waiting", start: 55, len: 15, date: "30 Jul", priority: 1, tags: ["CS"], progress: 0, comments: 0, files: 2 },
];

const KANBAN_COLUMNS = [
  { key: "backlog", label: "Backlog", color: "#9CA3AF" },
  { key: "todo", label: "To Do", color: "#3B82F6" },
  { key: "doing", label: "Doing", color: "#F59E0B" },
  { key: "review", label: "Review", color: "#7C3AED" },
  { key: "done", label: "Done", color: "#22C55E" },
];

const initialCards = [
  { id: "c1", col: "backlog", title: "Definir identidade visual v2", desc: "Levantar referências e paleta para o novo branding.", owners: [1], checklist: [3, 5], comments: 2, files: 1, time: "2h 10m", date: "18 Jul" },
  { id: "c2", col: "backlog", title: "Pesquisa com usuários", desc: "Entrevistas com 8 clientes ativos.", owners: [0, 2], checklist: [0, 4], comments: 0, files: 0, time: "0h", date: "20 Jul" },
  { id: "c3", col: "todo", title: "Wireframes do dashboard", desc: "Baixa fidelidade, foco em hierarquia.", owners: [3], checklist: [2, 2], comments: 4, files: 3, time: "1h 40m", date: "15 Jul" },
  { id: "c4", col: "todo", title: "Configurar ambiente de staging", desc: "Docker + pipeline de deploy automático.", owners: [4], checklist: [1, 3], comments: 1, files: 0, time: "3h", date: "16 Jul" },
  { id: "c5", col: "doing", title: "Tela de login e autenticação", desc: "Incluir 2FA e login social.", owners: [0], checklist: [4, 6], comments: 6, files: 2, time: "5h 25m", date: "13 Jul" },
  { id: "c6", col: "doing", title: "Componente de tabela virtualizada", desc: "Suporte a 10k+ linhas sem travar.", owners: [3, 1], checklist: [2, 5], comments: 3, files: 1, time: "4h 05m", date: "14 Jul" },
  { id: "c7", col: "review", title: "Revisão de acessibilidade", desc: "Contraste, foco de teclado, ARIA labels.", owners: [2], checklist: [5, 5], comments: 9, files: 0, time: "1h 15m", date: "10 Jul" },
  { id: "c8", col: "done", title: "Setup do design system", desc: "Tokens de cor, tipografia e espaçamento.", owners: [1, 4], checklist: [6, 6], comments: 12, files: 5, time: "8h 30m", date: "01 Jul" },
];

/* ------------------------------------------------------------------ */
/*  SMALL UI PRIMITIVES                                                */
/* ------------------------------------------------------------------ */

function Avatar({ person, size = 28 }) {
  return (
    <div
      title={person.name}
      className="rounded-full flex items-center justify-center text-white font-medium ring-2 ring-white shrink-0 select-none"
      style={{ width: size, height: size, background: person.color, fontSize: size * 0.38 }}
    >
      {person.initials}
    </div>
  );
}

function AvatarStack({ ids }) {
  return (
    <div className="flex items-center -space-x-2 group relative">
      {ids.map((i) => (
        <Avatar key={i} person={PEOPLE[i]} />
      ))}
    </div>
  );
}

function StatusPill({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const s = STATUS_STYLES[status];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-all duration-150 hover:brightness-95 active:scale-[0.97]"
        style={{ background: s.bg, color: s.text }}
      >
        {status}
        <ChevronDown size={13} strokeWidth={2.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 w-44 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#F0F1F5] p-1.5 animate-[fadeSlide_.15s_ease]">
            {STATUS_LIST.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-[#F7F8FC] transition-colors"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_STYLES[opt].dot }} />
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PriorityStars({ level }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          strokeWidth={0}
          fill={n <= level ? "#F59E0B" : "#E5E7EB"}
        />
      ))}
    </div>
  );
}

function TimelineBar({ start, len }) {
  const color = len + start > 90 ? "#22C55E" : len > 30 ? "#3B82F6" : "#F59E0B";
  return (
    <div className="relative w-40 h-2.5 bg-[#F0F1F5] rounded-full overflow-hidden">
      <div
        className="absolute top-0 h-full rounded-full transition-all"
        style={{ left: `${start}%`, width: `${len}%`, background: color }}
      />
    </div>
  );
}

function ProgressBar({ value }) {
  const color = value === 100 ? "#22C55E" : value > 50 ? "#3B82F6" : "#F59E0B";
  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 h-2 bg-[#F0F1F5] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium text-[#6B7280] w-8 text-right">{value}%</span>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  SIDEBAR / HEADER                                                   */
/* ------------------------------------------------------------------ */

function Sidebar({ active, setActive, dark }) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[250px] flex flex-col border-r z-30"
      style={{ background: dark ? "#15171F" : "#FFFFFF", borderColor: dark ? "#22242E" : "#EEF0F5" }}
    >
      <div className="h-16 flex items-center gap-2.5 px-6">
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#3B82F6] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm">F</div>
        <span className={`font-semibold text-[15px] tracking-tight ${dark ? "text-white" : "text-[#222]"}`}>Flowspace</span>
      </div>

      <nav className="flex-1 px-3 mt-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-all duration-150 group"
              style={{
                background: isActive ? (dark ? "rgba(59,130,246,0.16)" : "#EFF4FF") : "transparent",
                color: isActive ? "#3B82F6" : dark ? "#9CA3AF" : "#4B5563",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = dark ? "#1C1E27" : "#F7F8FC"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className={`m-3 p-3.5 rounded-2xl ${dark ? "bg-[#1C1E27]" : "bg-[#F7F8FC]"}`}>
        <p className={`text-[12px] font-semibold ${dark ? "text-white" : "text-[#222]"}`}>Plano Pro</p>
        <p className="text-[11px] text-[#6B7280] mt-0.5">18 de 25 projetos usados</p>
        <div className="h-1.5 bg-[#E5E7EB] rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] rounded-full" style={{ width: "72%" }} />
        </div>
      </div>
    </aside>
  );
}

function Header({ dark, setDark, crumbs }) {
  const [notifOpen, setNotifOpen] = useState(false);
  return (
    <header
      className="fixed top-0 right-0 left-[250px] h-16 flex items-center justify-between px-8 z-20 backdrop-blur-sm border-b"
      style={{ background: dark ? "rgba(21,23,31,0.85)" : "rgba(255,255,255,0.85)", borderColor: dark ? "#22242E" : "#EEF0F5" }}
    >
      <div className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => (
          <React.Fragment key={c}>
            {i > 0 && <ChevronRight size={13} className="text-[#B0B4BF]" />}
            <span className={i === crumbs.length - 1 ? (dark ? "text-white font-semibold" : "text-[#222] font-semibold") : "text-[#9CA3AF]"}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            placeholder="Pesquisar projetos, tarefas, clientes..."
            className="pl-10 pr-4 py-2 w-72 rounded-full text-[13px] outline-none transition-all focus:w-80"
            style={{
              background: dark ? "#1C1E27" : "#F3F4F6",
              color: dark ? "#E5E7EB" : "#222",
            }}
          />
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3B82F6] text-white text-[13px] font-semibold hover:bg-[#2f6fe0] transition-all active:scale-[0.97] shadow-[0_4px_14px_rgba(59,130,246,0.35)]">
          <Plus size={15} strokeWidth={2.5} /> Novo Projeto
        </button>

        <button
          onClick={() => setDark(!dark)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${dark ? "bg-[#1C1E27] text-[#F59E0B]" : "bg-[#F3F4F6] text-[#4B5563]"}`}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-colors ${dark ? "bg-[#1C1E27] text-[#9CA3AF]" : "bg-[#F3F4F6] text-[#4B5563]"}`}
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.14)] border border-[#F0F1F5] z-20 overflow-hidden animate-[fadeSlide_.15s_ease]">
                <div className="px-4 py-3 border-b border-[#F0F1F5] flex items-center justify-between">
                  <span className="font-semibold text-[13.5px] text-[#222]">Notificações</span>
                  <span className="text-[11px] text-[#3B82F6] font-medium">3 não lidas</span>
                </div>
                {[
                  { who: "Ana Souza", what: "comentou em Redesign do site", when: "há 5 min" },
                  { who: "Bruno Lima", what: "moveu App mobile para Review", when: "há 32 min" },
                  { who: "Sistema", what: "Prazo de Campanha Q3 vence amanhã", when: "há 2h" },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 flex gap-3 hover:bg-[#F7F8FC] transition-colors cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12.5px] text-[#222] leading-snug"><span className="font-semibold">{n.who}</span> {n.what}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{n.when}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Avatar person={PEOPLE[0]} size={34} />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

function Dashboard({ dark }) {
  return (
    <div className="grid grid-cols-3 gap-5">
      {KPI.map((k) => {
        const Icon = k.icon;
        return (
          <div
            key={k.label}
            className="relative rounded-2xl p-5 flex items-center gap-4 overflow-hidden transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            style={{ background: dark ? "#1A1C25" : "#FFFFFF", boxShadow: "0 2px 12px rgba(20,20,43,0.05)" }}
          >
            <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl" style={{ background: k.color }} />
            <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: `${k.color}1A`, color: k.color }}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className={`text-[22px] font-bold leading-none ${dark ? "text-white" : "text-[#222]"}`}>{k.value}</p>
              <p className="text-[12.5px] text-[#6B7280] mt-1.5 font-medium">{k.label}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">{k.sub}</p>
            </div>
          </div>
        );
      })}

      <div className="col-span-2 rounded-2xl p-6" style={{ background: dark ? "#1A1C25" : "#FFFFFF", boxShadow: "0 2px 12px rgba(20,20,43,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={`font-semibold text-[15px] ${dark ? "text-white" : "text-[#222]"}`}>Progresso dos projetos</h3>
          <button className="text-[12px] text-[#6B7280] flex items-center gap-1"><Filter size={13} /> Filtrar</button>
        </div>
        <div className="flex items-end gap-4 h-44">
          {[62, 84, 45, 90, 30, 70, 55, 95, 40, 78].map((v, i) => (
            <div key={i} className="flex-1 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${v}%`, background: i % 3 === 0 ? "#3B82F6" : i % 3 === 1 ? "#7C3AED" : "#22C55E" }} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: dark ? "#1A1C25" : "#FFFFFF", boxShadow: "0 2px 12px rgba(20,20,43,0.05)" }}>
        <h3 className={`font-semibold text-[15px] mb-5 ${dark ? "text-white" : "text-[#222]"}`}>Status geral</h3>
        <div className="space-y-3.5">
          {[
            { l: "Concluídas", v: 63, c: "#22C55E" },
            { l: "Em andamento", v: 28, c: "#F59E0B" },
            { l: "Atrasadas", v: 9, c: "#EF4444" },
          ].map((s) => (
            <div key={s.l}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="text-[#6B7280] font-medium">{s.l}</span>
                <span className="font-semibold" style={{ color: s.c }}>{s.v}%</span>
              </div>
              <div className="h-2 bg-[#F0F1F5] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.v}%`, background: s.c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BOARDS (Monday-style table)                                        */
/* ------------------------------------------------------------------ */

function Boards({ dark }) {
  const [rows, setRows] = useState(initialRows);
  const updateStatus = (id, status) => setRows((r) => r.map((row) => (row.id === id ? { ...row, status } : row)));
  const cols = ["Nome", "Responsável", "Status", "Timeline", "Data", "Prioridade", "Tags", "Progresso", "Comentários", "Arquivos"];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: dark ? "#1A1C25" : "#FFFFFF", boxShadow: "0 2px 12px rgba(20,20,43,0.05)" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: dark ? "#22242E" : "#F0F1F5" }}>
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
          <h3 className={`font-semibold text-[15px] ${dark ? "text-white" : "text-[#222]"}`}>Board — Lançamento Q3</h3>
        </div>
        <button className="text-[12.5px] text-[#3B82F6] font-medium flex items-center gap-1 hover:underline">
          <Plus size={14} /> Adicionar item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: dark ? "#15171F" : "#FAFBFD" }}>
              {cols.map((c) => (
                <th key={c} className="text-left px-4 py-3 text-[11.5px] font-semibold text-[#9CA3AF] uppercase tracking-wide whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="group border-t transition-colors"
                style={{ borderColor: dark ? "#22242E" : "#F3F4F7" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "#1F212C" : "#FAFBFD")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-4 py-4 min-w-[220px]">
                  <span className={`text-[13.5px] font-medium ${dark ? "text-white" : "text-[#222]"}`}>{row.name}</span>
                </td>
                <td className="px-4 py-4"><AvatarStack ids={row.owners} /></td>
                <td className="px-4 py-4"><StatusPill status={row.status} onChange={(s) => updateStatus(row.id, s)} /></td>
                <td className="px-4 py-4"><TimelineBar start={row.start} len={row.len} /></td>
                <td className="px-4 py-4 text-[12.5px] text-[#6B7280] whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-4"><PriorityStars level={row.priority} /></td>
                <td className="px-4 py-4"><div className="flex gap-1.5 flex-wrap max-w-[140px]">{row.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div></td>
                <td className="px-4 py-4"><ProgressBar value={row.progress} /></td>
                <td className="px-4 py-4"><span className="flex items-center gap-1.5 text-[12.5px] text-[#6B7280]"><MessageSquare size={13} />{row.comments}</span></td>
                <td className="px-4 py-4"><span className="flex items-center gap-1.5 text-[12.5px] text-[#6B7280]"><Paperclip size={13} />{row.files}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KANBAN (Hubstaff-style)                                             */
/* ------------------------------------------------------------------ */

function KanbanCard({ card, dark, onDragStart }) {
  const [done, total] = card.checklist;
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      className="rounded-[14px] p-4 mb-3 cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5"
      style={{ background: dark ? "#1F212C" : "#FFFFFF", boxShadow: "0 2px 8px rgba(20,20,43,0.06)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className={`text-[13.5px] font-semibold leading-snug ${dark ? "text-white" : "text-[#222]"}`}>{card.title}</p>
        <MoreHorizontal size={15} className="text-[#B0B4BF] shrink-0" />
      </div>
      <p className="text-[12px] text-[#9CA3AF] leading-snug mb-3 line-clamp-2">{card.desc}</p>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-[#F0F1F5] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        <span className="text-[10.5px] text-[#9CA3AF] font-medium">{done}/{total}</span>
      </div>

      <div className="flex items-center justify-between">
        <AvatarStack ids={card.owners} />
        <div className="flex items-center gap-2.5 text-[#9CA3AF]">
          <span className="flex items-center gap-1 text-[11px]"><MessageSquare size={12} />{card.comments}</span>
          <span className="flex items-center gap-1 text-[11px]"><Paperclip size={12} />{card.files}</span>
          <span className="flex items-center gap-1 text-[11px]"><Clock size={12} />{card.time}</span>
        </div>
      </div>
    </div>
  );
}

function Kanban({ dark }) {
  const [cards, setCards] = useState(initialCards);
  const dragId = useRef(null);

  const onDragStart = (e, id) => { dragId.current = id; };
  const onDrop = (e, colKey) => {
    e.preventDefault();
    setCards((cs) => cs.map((c) => (c.id === dragId.current ? { ...c, col: colKey } : c)));
  };

  return (
    <div className="flex gap-5 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
      {KANBAN_COLUMNS.map((col) => {
        const colCards = cards.filter((c) => c.col === col.key);
        return (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, col.key)}
            className="w-[290px] shrink-0 rounded-2xl p-3.5"
            style={{ background: dark ? "#15171F" : "#F7F8FC" }}
          >
            <div className="flex items-center justify-between px-1.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className={`text-[13px] font-semibold ${dark ? "text-white" : "text-[#222]"}`}>{col.label}</span>
                <span className="text-[11px] text-[#9CA3AF] font-medium bg-[#EDEFF3] px-1.5 py-0.5 rounded-md">{colCards.length}</span>
              </div>
              <Plus size={15} className="text-[#9CA3AF] cursor-pointer hover:text-[#3B82F6] transition-colors" />
            </div>
            {colCards.map((card) => (
              <KanbanCard key={card.id} card={card} dark={dark} onDragStart={onDragStart} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP SHELL                                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "boards", label: "Boards" },
  { key: "kanban", label: "Kanban" },
];

const CRUMBS = { dashboard: ["Workspace", "Dashboard"], boards: ["Workspace", "Boards", "Lançamento Q3"], kanban: ["Workspace", "Kanban", "Sprint 14"] };

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""} style={{ background: dark ? "#0E0F14" : "#F7F8FC", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: #D8DBE3; border-radius: 8px; }
      `}</style>

      <Sidebar active={active} setActive={setActive} dark={dark} />
      <Header dark={dark} setDark={setDark} crumbs={CRUMBS[active] || CRUMBS.dashboard} />

      <main className="ml-[250px] pt-16 px-8 pb-10">
        <div className="pt-6 flex items-center justify-between">
          <div>
            <h1 className={`text-[22px] font-bold tracking-tight ${dark ? "text-white" : "text-[#222]"}`}>
              {active === "dashboard" ? "Visão geral" : active === "boards" ? "Board — Lançamento Q3" : "Kanban — Sprint 14"}
            </h1>
            <p className="text-[13px] text-[#9CA3AF] mt-1">
              {active === "dashboard" ? "Acompanhe o desempenho de todos os projetos em tempo real." : active === "boards" ? "Gerencie tarefas, prazos e responsáveis em formato de tabela." : "Arraste os cards entre as colunas para atualizar o progresso."}
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-full" style={{ background: dark ? "#1A1C25" : "#EEF0F5" }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold transition-all"
                style={{
                  background: active === t.key ? (dark ? "#2A2D3A" : "#FFFFFF") : "transparent",
                  color: active === t.key ? "#3B82F6" : "#9CA3AF",
                  boxShadow: active === t.key ? "0 2px 8px rgba(20,20,43,0.08)" : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {active === "dashboard" && <Dashboard dark={dark} />}
          {active === "boards" && <Boards dark={dark} />}
          {active === "kanban" && <Kanban dark={dark} />}
          {!["dashboard", "boards", "kanban"].includes(active) && (
            <div className="rounded-2xl p-16 text-center" style={{ background: dark ? "#1A1C25" : "#FFFFFF", boxShadow: "0 2px 12px rgba(20,20,43,0.05)" }}>
              <p className={`font-semibold text-[15px] ${dark ? "text-white" : "text-[#222]"}`}>Módulo "{NAV_ITEMS.find(n => n.key === active)?.label}" em construção</p>
              <p className="text-[13px] text-[#9CA3AF] mt-1.5">Este módulo segue a mesma linguagem visual — posso detalhá-lo no próximo passo.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
