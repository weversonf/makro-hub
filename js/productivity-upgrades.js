/* Melhorias de produtividade: modelo explícito e recursos auxiliares. */
(function () {
  'use strict';

  var UPGRADE_KEY = 'makro:productivity:v1';
  var reminderShown = {};
  var originalOpenNewTask = window.openNewTask;
  var originalOpenEditTask = window.openEditTask;
  var originalSaveTask = window.saveTask;
  var originalRenderLista = window.renderLista;
  var originalRenderDashboard = window.renderDashboard;
  var originalRenderAll = window.renderAll;

  window.isEditorialActivity = function (activity) {
    return !!activity && (activity.tipo === 'editorial' || (!activity.tipo && Number(activity.categoria) === 1));
  };

  function today() { return typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10); }
  function plusDays(date, days) { return typeof addDaysISO === 'function' ? addDaysISO(date, days) : date; }
  function escapeHtml(value) { return typeof esc === 'function' ? esc(value || '') : String(value || ''); }
  function isDemand(activity) { return !window.isEditorialActivity(activity); }

  function normalizeActivity(activity) {
    if (!activity || typeof activity !== 'object') return activity;
    activity.tipo = window.isEditorialActivity(activity) ? 'editorial' : 'demanda';
    activity.statusAprovacao = activity.statusAprovacao || (activity.tipo === 'editorial' ? 'rascunho' : null);
    activity.formato = activity.formato || (activity.tipo === 'editorial' ? 'Post' : null);
    activity.campanha = activity.campanha || '';
    activity.cta = activity.cta || '';
    activity.link = activity.link || '';
    activity.responsavel = activity.responsavel || '';
    activity.recorrencia = activity.recorrencia || 'nenhuma';
    activity.historico = Array.isArray(activity.historico) ? activity.historico : [];
    return activity;
  }

  function normalizeAll() {
    if (!window.S || !Array.isArray(S.activities)) return;
    S.activities.forEach(normalizeActivity);
  }

  function injectStyles() {
    if (document.getElementById('productivity-upgrades-style')) return;
    var style = document.createElement('style');
    style.id = 'productivity-upgrades-style';
    style.textContent = '.upgrade-quick-filters{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.upgrade-quick-filters button{border:1px solid var(--ax-border);background:var(--ax-surface-subtle);color:var(--ax-text-muted);border-radius:999px;padding:6px 10px;font:600 11px inherit;cursor:pointer}.upgrade-quick-filters button:hover,.upgrade-quick-filters button.is-active{background:var(--ax-accent);border-color:var(--ax-accent);color:var(--ax-on-accent)}.upgrade-editorial-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.upgrade-editorial-grid .ax-field{min-width:0}.upgrade-report{margin-top:16px}.upgrade-reminder{display:flex;justify-content:space-between;align-items:center;gap:12px}.upgrade-duplicate{margin-inline-end:auto}@media(max-width:600px){.upgrade-editorial-grid{grid-template-columns:1fr}.upgrade-reminder{align-items:flex-start;flex-direction:column}}';
    document.head.appendChild(style);
  }

  function field(id, label, type, placeholder) {
    return '<div class="ax-field"><label class="ax-label" for="' + id + '">' + label + '</label><input class="ax-input" id="' + id + '" type="' + type + '" placeholder="' + placeholder + '"></div>';
  }

  function injectEditorialFields() {
    var postWrap = document.getElementById('tmf-post-wrap');
    if (!postWrap || document.getElementById('upgrade-editorial-fields')) return;
    var holder = document.createElement('div');
    holder.id = 'upgrade-editorial-fields';
    holder.className = 'upgrade-editorial-grid';
    holder.innerHTML = field('tmf-campanha', 'Campanha', 'text', 'Ex.: Black Friday') + field('tmf-formato', 'Formato', 'text', 'Ex.: Carrossel') + field('tmf-cta', 'CTA', 'text', 'Ex.: Saiba mais') + field('tmf-link', 'Link de referência', 'url', 'https://') + field('tmf-responsavel', 'Responsável', 'text', 'Nome') + '<div class="ax-field"><label class="ax-label" for="tmf-aprovacao">Status de aprovação</label><div class="ax-select-wrap"><select class="ax-select" id="tmf-aprovacao"><option value="rascunho">Rascunho</option><option value="revisao">Em revisão</option><option value="aprovado">Aprovado</option><option value="publicado">Publicado</option></select></div></div>';
    postWrap.parentNode.insertBefore(holder, postWrap.nextSibling);
    var recurrence = document.createElement('div');
    recurrence.id = 'upgrade-recurrence-wrap';
    recurrence.className = 'ax-field';
    recurrence.style.marginTop = '12px';
    recurrence.innerHTML = '<label class="ax-label" for="tmf-recurrence">Recorrência</label><div class="ax-select-wrap"><select class="ax-select" id="tmf-recurrence"><option value="nenhuma">Não repetir</option><option value="semanal">Semanal (3 ocorrências)</option><option value="quinzenal">Quinzenal (3 ocorrências)</option><option value="mensal">Mensal (3 ocorrências)</option></select></div>';
    holder.parentNode.insertBefore(recurrence, holder.nextSibling);
  }

  function setEditorialFields(activity) {
    injectEditorialFields();
    var editorial = !!activity && window.isEditorialActivity(activity);
    var ids = ['upgrade-editorial-fields', 'tmf-recurrence-wrap'];
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = editorial ? '' : 'none'; });
    if (!editorial) return;
    var values = { 'tmf-campanha': activity.campanha, 'tmf-formato': activity.formato || 'Post', 'tmf-cta': activity.cta, 'tmf-link': activity.link, 'tmf-responsavel': activity.responsavel, 'tmf-aprovacao': activity.statusAprovacao || 'rascunho', 'tmf-recurrence': activity.recorrencia || 'nenhuma' };
    Object.keys(values).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = values[id] || ''; });
  }

  function readEditorialFields() {
    var result = {};
    ['campanha', 'formato', 'cta', 'link', 'responsavel'].forEach(function (name) { var el = document.getElementById('tmf-' + name); result[name] = el ? el.value.trim() : ''; });
    var approval = document.getElementById('tmf-aprovacao');
    var recurrence = document.getElementById('tmf-recurrence');
    result.statusAprovacao = approval ? approval.value : 'rascunho';
    result.recorrencia = recurrence ? recurrence.value : 'nenhuma';
    return result;
  }

  function addHistory(activity, action) {
    normalizeActivity(activity);
    activity.historico.push({ data: today(), acao: action });
    if (activity.historico.length > 30) activity.historico = activity.historico.slice(-30);
  }

  function persistAndRender() {
    if (typeof persistLocalState === 'function') persistLocalState();
    if (typeof renderAll === 'function') renderAll();
  }

  function createRecurringCopies(source, recurrence) {
    if (!source || recurrence === 'nenhuma' || !window.S || !Array.isArray(S.activities)) return;
    var interval = recurrence === 'semanal' ? 7 : recurrence === 'quinzenal' ? 14 : 30;
    for (var i = 1; i <= 3; i++) {
      let copy = clone(source);
      copy.id = S.nextId++;
      delete copy._fbId;
      copy.titulo = source.titulo + ' · ' + (i + 1);
      copy.criadoEm = today();
      copy.dataVencimento = source.dataVencimento ? plusDays(source.dataVencimento, interval * i) : null;
      copy.dataPostagem = source.dataPostagem ? plusDays(source.dataPostagem, interval * i) : null;
      copy.stage = 'afazer';
      copy.progress = 0;
      copy.concluidoEm = null;
      copy.recorrencia = 'nenhuma';
      addHistory(copy, 'Criada por recorrência');
      S.activities.push(copy);
      if (typeof _firebaseReady !== 'undefined' && _firebaseReady && typeof fb !== 'undefined') fb.addDoc(userPath('activities'), copy).then(function (doc) { copy._fbId = doc.id; }).catch(function () {});
    }
  }

  window.createEditorialFromDemand = function (id) {
    var activity = typeof getTask === 'function' ? getTask(id) : null;
    if (!activity || !isDemand(activity)) return;
    var convert = function () {
      activity.tipo = 'editorial';
      activity.categoria = 1;
      activity.dataPostagem = activity.dataPostagem || activity.dataVencimento || null;
      activity.stage = 'afazer';
      activity.progress = 0;
      activity.concluidoEm = null;
      activity.statusAprovacao = activity.statusAprovacao || 'rascunho';
      activity.formato = activity.formato || 'Post';
      activity.recorrencia = 'nenhuma';
      delete activity.roteiroEditorialId;
      delete activity.origemDemandaId;
      addHistory(activity, 'Convertida em roteiro editorial');
      if (typeof _firebaseReady !== 'undefined' && _firebaseReady && typeof fb !== 'undefined' && activity._fbId) {
        var payload = {};
        Object.keys(activity).forEach(function (key) { if (key !== '_fbId') payload[key] = activity[key]; });
        fb.updateDoc(userDoc('activities', activity._fbId), payload).catch(function () {});
      }
      persistAndRender();
      if (typeof toast === 'function') toast('Atividade convertida em roteiro editorial');
      if (typeof changeView === 'function') changeView('editorial');
      setTimeout(function () { if (typeof openEditTask === 'function') openEditTask(activity.id); }, 120);
    };
    if (typeof showConfirm === 'function') showConfirm('Converter em roteiro?', 'A atividade será transformada em conteúdo editorial e deixará de aparecer em Tarefas.', convert); else convert();
  };

  window.duplicateActivity = function (id) {
    var source = typeof getTask === 'function' ? getTask(id) : null;
    if (!source) return;
    var copy = clone(source);
    copy.id = S.nextId++;
    delete copy._fbId;
    copy.titulo = source.titulo + ' · cópia';
    copy.criadoEm = today();
    copy.stage = 'afazer';
    copy.progress = 0;
    copy.concluidoEm = null;
    copy.recorrencia = 'nenhuma';
    addHistory(copy, 'Duplicada');
    S.activities.push(copy);
    if (typeof _firebaseReady !== 'undefined' && _firebaseReady && typeof fb !== 'undefined') fb.addDoc(userPath('activities'), copy).then(function (doc) { copy._fbId = doc.id; }).catch(function () {});
    persistAndRender();
    if (typeof toast === 'function') toast('Atividade duplicada');
  };

  window.setUpgradeQuickFilter = function (kind) {
    if (!window.S) return;
    S.listQ = '';
    S.listCat = 'all';
    S.listStage = ['all'];
    S.listOverdueOnly = kind === 'atrasadas';
    if (kind === 'alta') S.listQ = '__alta__';
    if (kind === 'semana') S.listQ = '__semana__';
    if (typeof renderLista === 'function') renderLista();
    if (typeof updatePageHead === 'function') updatePageHead();
  };

  function injectQuickFilters() {
    var toolbar = document.querySelector('#view-lista .ax-toolbar');
    if (!toolbar || document.getElementById('upgrade-quick-filters')) return;
    var box = document.createElement('div');
    box.id = 'upgrade-quick-filters';
    box.className = 'upgrade-quick-filters';
    box.innerHTML = '<button type="button" onclick="setUpgradeQuickFilter(\'todas\')">Todas</button><button type="button" onclick="setUpgradeQuickFilter(\'atrasadas\')">Atrasadas</button><button type="button" onclick="setUpgradeQuickFilter(\'semana\')">Esta semana</button><button type="button" onclick="setUpgradeQuickFilter(\'alta\')">Alta prioridade</button>';
    toolbar.parentNode.appendChild(box);
  }

  function renderReport() {
    var target = document.getElementById('dash-content');
    var oldReport = document.getElementById('upgrade-report');
    if (oldReport) oldReport.remove();
    if (!target) return;
    var demands = (S.activities || []).filter(isDemand);
    var completed = demands.filter(function (a) { return a.stage === 'concluido'; }).length;
    var overdue = demands.filter(function (a) { return typeof isOverdue === 'function' && isOverdue(a); }).length;
    var high = demands.filter(function (a) { return a.prioridade === 'alta' || a.prioridade === 'urgente'; }).length;
    var card = document.createElement('section');
    card.id = 'upgrade-report';
    card.className = 'ax-card ax-col--12 upgrade-report';
    card.innerHTML = '<div class="ax-card__header"><div><h2 class="ax-card__title">Resumo de produtividade</h2><p class="ax-card__subtitle">Visão rápida das demandas atuais.</p></div><button class="ax-btn ax-btn--secondary ax-btn--sm" type="button" onclick="requestUpgradeNotifications()">Ativar lembretes</button></div><div class="ax-card__body"><div class="ax-dash-grid"><div class="ax-col--3"><b class="ax-num">' + demands.length + '</b><div class="ax-card__subtitle">Demandas</div></div><div class="ax-col--3"><b class="ax-num">' + completed + '</b><div class="ax-card__subtitle">Concluídas</div></div><div class="ax-col--3"><b class="ax-num" style="color:var(--ax-danger-500)">' + overdue + '</b><div class="ax-card__subtitle">Atrasadas</div></div><div class="ax-col--3"><b class="ax-num" style="color:var(--ax-warning-500)">' + high + '</b><div class="ax-card__subtitle">Alta prioridade</div></div></div></div>';
    target.appendChild(card);
  }

  function checkReminders() {
    if (!window.S || !Array.isArray(S.activities)) return;
    var tomorrow = plusDays(today(), 1);
    S.activities.filter(isDemand).forEach(function (a) {
      if (a.stage === 'concluido') return;
      var key = a.id + ':' + (a.dataVencimento || '');
      if (a.dataVencimento && (a.dataVencimento === today() || a.dataVencimento === tomorrow) && !reminderShown[key]) {
        reminderShown[key] = true;
        if (typeof toast === 'function') toast((a.dataVencimento === today() ? 'Vence hoje: ' : 'Vence amanhã: ') + a.titulo, 'error');
      }
    });
  }

  window.requestUpgradeNotifications = function () {
    if (!('Notification' in window)) { if (typeof toast === 'function') toast('Seu navegador não oferece notificações.', 'error'); return; }
    Notification.requestPermission().then(function (permission) {
      if (permission === 'granted') { localStorage.setItem(UPGRADE_KEY, '1'); if (typeof toast === 'function') toast('Lembretes ativados'); checkReminders(); }
      else if (typeof toast === 'function') toast('Permissão de notificações não concedida.', 'error');
    });
  };

  window.openNewTask = function (stageId, editorial) {
    var result = originalOpenNewTask.apply(this, arguments);
    var duplicate = document.getElementById('upgrade-duplicate-btn');
    if (duplicate) duplicate.remove();
    var relation = document.getElementById('upgrade-editorial-btn');
    if (relation) relation.remove();
    var history = document.getElementById('upgrade-history');
    if (history) history.remove();
    setTimeout(function () { setEditorialFields({ tipo: editorial ? 'editorial' : 'demanda', categoria: editorial ? 1 : 2 }); }, 0);
    return result;
  };
  window.openEditTask = function (id) {
    var result = originalOpenEditTask.apply(this, arguments);
    setTimeout(function () { var edited = typeof getTask === 'function' ? getTask(id) : null; setEditorialFields(edited); injectDuplicateButton(id); injectRelationButton(edited); injectHistoryPanel(edited); }, 0);
    return result;
  };
  window.saveTask = function () {
    var editingId = S.editId;
    var before = editingId && typeof getTask === 'function' ? getTask(editingId) : null;
    var editorial = before ? window.isEditorialActivity(before) : Number(document.getElementById('tmf-cat') && document.getElementById('tmf-cat').value) === 1;
    var fields = editorial ? readEditorialFields() : null;
    var result = originalSaveTask.apply(this, arguments);
    normalizeAll();
    var activity = editingId && typeof getTask === 'function' ? getTask(editingId) : null;
    if (!activity && S.activities.length) activity = S.activities[S.activities.length - 1];
    if (activity) {
      activity.tipo = editorial ? 'editorial' : 'demanda';
      if (fields) Object.keys(fields).forEach(function (key) { activity[key] = fields[key]; });
      addHistory(activity, before ? 'Atualizada' : 'Criada');
      if (typeof _firebaseReady !== 'undefined' && _firebaseReady && typeof fb !== 'undefined' && activity._fbId) {
        var synced = {};
        Object.keys(activity).forEach(function (key) { if (key !== '_fbId') synced[key] = activity[key]; });
        fb.updateDoc(userDoc('activities', activity._fbId), synced).catch(function () {});
      }
      if (!before && fields && fields.recorrencia !== 'nenhuma') createRecurringCopies(activity, fields.recorrencia);
      if (typeof persistLocalState === 'function') persistLocalState();
    }
    return result;
  };

  function injectHistoryPanel(activity) {
    var details = document.querySelector('[data-tm-panel="detalhes"]');
    if (!details) return;
    var existing = document.getElementById('upgrade-history');
    if (existing) existing.remove();
    if (!activity || !Array.isArray(activity.historico) || !activity.historico.length) return;
    var panel = document.createElement('div');
    panel.id = 'upgrade-history';
    panel.className = 'ax-note';
    panel.style.cssText = 'margin-top:14px;padding:12px;border:1px solid var(--ax-border);border-radius:var(--ax-radius-md);font-size:var(--ax-text-xs);color:var(--ax-text-muted);';
    panel.innerHTML = '<strong style="color:var(--ax-text-strong);">Histórico recente</strong><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">' + activity.historico.slice(-5).reverse().map(function (item) { return '<span class="ax-badge ax-badge--neutral ax-badge--sm">' + escapeHtml(item.data) + ' · ' + escapeHtml(item.acao) + '</span>'; }).join('') + '</div>';
    details.appendChild(panel);
  }

  function injectRelationButton(activity) {
    var foot = document.querySelector('#task-modal .ax-modal__foot');
    if (!foot || document.getElementById('upgrade-editorial-btn') || !activity) return;
    var button = document.createElement('button');
    button.id = 'upgrade-editorial-btn';
    button.type = 'button';
    button.className = 'ax-btn ax-btn--secondary upgrade-duplicate';
    if (isDemand(activity)) {
      button.textContent = activity.roteiroEditorialId ? 'Abrir roteiro editorial' : 'Converter em Roteiro';
      button.onclick = function () { createEditorialFromDemand(activity.id); };
    } else if (activity.origemDemandaId) {
      button.textContent = 'Abrir demanda de origem';
      button.onclick = function () { closeTaskModal(); if (typeof changeView === 'function') changeView('lista'); setTimeout(function () { if (typeof openEditTask === 'function') openEditTask(activity.origemDemandaId); }, 120); };
    } else return;
    foot.insertBefore(button, foot.firstChild);
  }

  function injectDuplicateButton(id) {
    var foot = document.querySelector('#task-modal .ax-modal__foot');
    if (!foot || document.getElementById('upgrade-duplicate-btn')) return;
    var button = document.createElement('button');
    button.id = 'upgrade-duplicate-btn';
    button.type = 'button';
    button.className = 'ax-btn ax-btn--ghost upgrade-duplicate';
    button.textContent = 'Duplicar';
    button.onclick = function () { duplicateActivity(id); closeTaskModal(); };
    foot.insertBefore(button, foot.firstChild);
  }

  window.renderLista = function () { var result = originalRenderLista.apply(this, arguments); injectQuickFilters(); return result; };
  window.renderDashboard = function () { normalizeAll(); var result = originalRenderDashboard.apply(this, arguments); renderReport(); checkReminders(); return result; };
  window.renderAll = function () { normalizeAll(); var result = originalRenderAll.apply(this, arguments); renderReport(); checkReminders(); return result; };

  function init() {
    injectStyles();
    normalizeAll();
    setTimeout(function () { injectQuickFilters(); if (typeof renderAll === 'function') renderAll(); }, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
