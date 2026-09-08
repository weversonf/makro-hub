import React, { useState, useMemo } from 'react';
import { useHub } from '../context/HubContext';
import { X, UserPlus, Trash2, ShieldCheck, Mail, Phone, Crown, CheckCircle2 } from 'lucide-react';

export default function EquipeView() {
  const {
    activities,
    registeredUsers,
    user,
    isMaster,
    isAdmin,
    USER_ROLES,
    MASTER_ADMIN_EMAIL,
    updateUserRole,
    addTeamMember,
    deleteTeamMember,
    showConfirm,
    showToast
  } = useHub();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cargo: '',
    departamento: 'Marketing Central',
    ramal: '',
    foto: '',
    role: 'colaborador'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista dinâmica de membros cadastrados reais
  const teamList = useMemo(() => {
    let list = Array.isArray(registeredUsers) && registeredUsers.length > 0
      ? [...registeredUsers]
      : [];

    // Se a lista do Firestore ainda não tiver carregado ou estiver vazia, garantir que o usuário atual (Weverson) apareça
    if (list.length === 0 && user) {
      list.push({
        id: user.uid || 'master',
        uid: user.uid || 'master',
        nome: user.displayName || 'Weverson Nascimento',
        displayName: user.displayName || 'Weverson Nascimento',
        email: user.email || MASTER_ADMIN_EMAIL,
        cargo: 'ADM Master & Coordenador',
        departamento: 'Marketing Central',
        ramal: '(85) 99924-1234',
        foto: user.photoURL || '',
        photoURL: user.photoURL || '',
        role: 'admin_master',
        online: true
      });
    }

    // Normalizar papéis e garantir que weversonf@gmail.com sempre tenha o nível ADM Master
    return list.map((m) => {
      const isMasterUser = m.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
      return {
        ...m,
        role: isMasterUser ? 'admin_master' : (m.role || 'colaborador')
      };
    });
  }, [registeredUsers, user, MASTER_ADMIN_EMAIL]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      nome: '',
      email: '',
      cargo: '',
      departamento: 'Marketing Central',
      ramal: '',
      foto: '',
      role: 'colaborador'
    });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast('Por favor, informe o nome do colaborador.', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Por favor, informe o e-mail do colaborador.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addTeamMember(formData);
      if (success) {
        setIsAddModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole, memberEmail) => {
    if (memberEmail?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast('O nível do ADM Master principal é fixo e permanente.', 'error');
      return;
    }
    await updateUserRole(userId, newRole);
  };

  const handleDeleteMember = (member) => {
    if (member.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast('O ADM Master principal não pode ser removido da equipe.', 'error');
      return;
    }

    showConfirm(
      'Remover colaborador?',
      `Tem certeza que deseja remover ${member.nome || member.displayName || member.email} da equipe?`,
      () => deleteTeamMember(member.id || member.uid, member.email)
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)] flex items-center gap-2">
            Equipe do Marketing
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Colaboradores, níveis de acesso, papéis e contatos oficiais
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center gap-1.5">
            <i className="ph ph-users text-sm" />
            <span>
              {teamList.length} {teamList.length === 1 ? 'colaborador cadastrado' : 'colaboradores cadastrados'}
            </span>
          </span>

          {(isMaster || isAdmin) && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="hr-btn hr-btn--primary text-xs h-8 px-3 flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition"
            >
              <UserPlus size={15} />
              <span>Adicionar Colaborador</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Explicativo de Níveis de Usuário */}
      <div className="hr-card p-4 sm:p-5 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-bold text-[var(--color-heading)]">
            Níveis de Usuário & Permissões do Sistema
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(USER_ROLES).map((role) => (
            <div
              key={role.id}
              className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-subtle)]/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">{role.icon}</span>
                  <span className="text-xs font-bold text-[var(--color-heading)]">
                    {role.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  {role.description}
                </p>
              </div>
              {role.id === 'admin_master' && (
                <span className="mt-2 text-[10px] font-semibold text-amber-500 block truncate">
                  Master: {MASTER_ADMIN_EMAIL}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teamList.map((m) => {
          const isMasterUser = m.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
          const roleInfo = USER_ROLES[m.role] || USER_ROLES.colaborador;
          const memberPhoto = m.foto || m.photoURL;
          const memberName = m.nome || m.displayName || m.email?.split('@')[0] || 'Colaborador';
          const memberCargo = m.cargo || (isMasterUser ? 'ADM Master & Coordenador' : 'Colaborador');
          const memberDepto = m.departamento || 'Marketing Central';
          const memberEmail = m.email || '—';
          const memberRamal = m.ramal || '(85) 99924-1234';

          const assignedCount = (activities || []).filter((a) => {
            if (a.responsavelId && (m.id || m.uid)) {
              return a.responsavelId === (m.id || m.uid);
            }
            if (a.responsavelEmail && m.email) {
              return a.responsavelEmail.toLowerCase() === m.email.toLowerCase();
            }
            return isMasterUser;
          }).length;

          return (
            <div
              key={m.id || m.uid || m.email}
              className="hr-card flex flex-col justify-between p-4 sm:p-5 border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all shadow-sm"
            >
              <div>
                {/* Topo do Card: Foto, Nome e Badge */}
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="relative flex-shrink-0">
                    {memberPhoto ? (
                      <img
                        src={memberPhoto}
                        alt={memberName}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-[var(--color-border)] shadow-sm"
                        style={{ width: '52px', height: '52px' }}
                      />
                    ) : (
                      <div
                        className="rounded-2xl border-2 border-[var(--color-border)] flex items-center justify-center font-bold text-sm bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm"
                        style={{ width: '52px', height: '52px' }}
                      >
                        {memberName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-surface)] ${
                        m.online !== false ? 'bg-[var(--color-success)]' : 'bg-[var(--color-muted)]'
                      }`}
                      title={m.online !== false ? 'Online / Ativo' : 'Ausente'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-sm font-bold text-[var(--color-heading)] truncate" title={memberName}>
                        {memberName}
                      </h3>
                      {isMasterUser && (
                        <span title="ADM Master Principal" className="flex-shrink-0 text-amber-500">
                          <Crown size={15} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeClass}`}
                      >
                        <span>{roleInfo.icon}</span>
                        <span>{roleInfo.label}</span>
                      </span>

                      <span
                        className="inline-flex items-center text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded border border-[var(--color-primary)]/20"
                        title={`${assignedCount} demandas sob responsabilidade`}
                      >
                        {assignedCount} {assignedCount === 1 ? 'demanda' : 'demandas'}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1 truncate">
                      {memberCargo}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted)] truncate">
                      {memberDepto}
                    </p>
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-[var(--color-muted)] flex-shrink-0" />
                    <span className="truncate" title={memberEmail}>{memberEmail}</span>
                  </div>
                  {memberRamal && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[var(--color-muted)] flex-shrink-0" />
                      <span>{memberRamal}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Card: Controle de Nível e Ações */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex flex-col gap-2.5">
                {/* Seletor de Nível (Exclusivo para o ADM Master) */}
                {isMaster && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-[var(--color-muted)]">
                      Nível de Acesso:
                    </span>
                    {isMasterUser ? (
                      <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Permanente (Master)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={m.role || 'colaborador'}
                          onChange={(e) => handleRoleChange(m.id || m.uid, e.target.value, m.email)}
                          className="text-xs py-1 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] cursor-pointer"
                        >
                          <option value="admin_master">👑 ADM Master</option>
                          <option value="admin">🛡️ Administrador</option>
                          <option value="colaborador">👤 Colaborador</option>
                          <option value="visualizador">👁️ Visualizador</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteMember(m)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition"
                          title="Remover colaborador"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                    Ativo no Makro Hub
                  </span>
                  <a
                    href={`mailto:${memberEmail}`}
                    className="hr-btn hr-btn--secondary text-xs h-7 px-3 flex items-center gap-1.5"
                  >
                    <Mail size={13} />
                    <span>Mensagem</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Adicionar Colaborador */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseAddModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface)] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                  <UserPlus size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-heading)]">
                    Adicionar Colaborador à Equipe
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    Defina os dados e o nível de permissão no sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-subtle)] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Beatriz Vasconcelos"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  E-mail do Colaborador (Google/Corporativo) *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="colaborador@makroengenharia.com.br"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    placeholder="Ex: Designer Gráfico"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => handleInputChange('departamento', e.target.value)}
                    placeholder="Marketing Central"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Telefone / Ramal
                  </label>
                  <input
                    type="text"
                    value={formData.ramal}
                    onChange={(e) => handleInputChange('ramal', e.target.value)}
                    placeholder="(85) 99812-4567"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Nível de Acesso (Papel)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition cursor-pointer"
                  >
                    <option value="colaborador">👤 Colaborador (Padrão)</option>
                    <option value="admin">🛡️ Administrador</option>
                    <option value="admin_master">👑 ADM Master</option>
                    <option value="visualizador">👁️ Visualizador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  URL da Foto (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.foto}
                  onChange={(e) => handleInputChange('foto', e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={isSubmitting}
                  className="hr-btn hr-btn--secondary text-xs h-9 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hr-btn hr-btn--primary text-xs h-9 px-4 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Colaborador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
