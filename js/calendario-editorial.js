/* ============================================================ */
/* CALENDÁRIO EDITORIAL (estilo Vireo)                          */
/* ============================================================ */
var CAL_MONTHS = 'Janeiro Fevereiro Março Abril Maio Junho Julho Agosto Setembro Outubro Novembro Dezembro'.split(' ');
var CAL_DOW_SHORT = 'Dom Seg Ter Qua Qui Sex Sáb'.split(' ');
var CAL_DOW_MINI = 'D S T Q Q S S'.split(' ');
var calDate = new Date();

function calToday() { calDate = new Date(); renderCalendario(); }
function calPrev() { calDate.setMonth(calDate.getMonth() - 1); renderCalendario(); }
function calNext() { calDate.setMonth(calDate.getMonth() + 1); renderCalendario(); }

function renderCalendario() {
  var y = calDate.getFullYear();
  var m = calDate.getMonth();
  var label = CAL_MONTHS[m] + ' ' + y;
  document.getElementById('cal-month-title').textContent = label;
  document.getElementById('mini-month-label').textContent = label;

  var tasks = S.activities.filter(function (a) { return a.categoria === 1; });
  var dayMap = {};
  for (var i = 0; i < tasks.length; i++) {
    var key = tasks[i].dataPostagem || tasks[i].dataVencimento;
    if (!key) continue;
    if (!dayMap[key]) dayMap[key] = [];
    dayMap[key].push(tasks[i]);
  }

  renderMiniMonth(y, m, dayMap);
  renderMiniUpcoming(tasks);
  updateCalCounts(tasks);

  /* DOW header */
  var dowHTML = '';
  for (var d = 0; d < 7; d++) {
    dowHTML += '<div style="padding:var(--ax-space-2) var(--ax-space-3);font-size:var(--ax-text-2xs);font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ax-text-subtle);text-align:center;' +
      (d < 6 ? 'border-inline-end:1px solid var(--ax-border);' : '') +
      'background:var(--ax-surface-subtle);">' + CAL_DOW_SHORT[d] + '</div>';
  }
  document.getElementById('cal-dow').innerHTML = dowHTML;

  /* Month grid cells */
  var firstDay = new Date(y, m, 1).getDay();
  var daysInMonth = new Date(y, m + 1, 0).getDate();
  var prevDays = new Date(y, m, 0).getDate();
  var today = todayISO();
  var totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  /* Previous month year/month for muted cells */
  var prevM = m === 0 ? 11 : m - 1;
  var prevY = m === 0 ? y - 1 : y;
  var nextM = m === 11 ? 0 : m + 1;
  var nextY = m === 11 ? y + 1 : y;

  var cellHTML = '';
  var day = 1;
  for (var row = 0; row < totalCells / 7; row++) {
    for (var col = 0; col < 7; col++) {
      var cellNum = row * 7 + col + 1;

      if (cellNum <= firstDay) {
        /* Previous month muted cell */
        var pDay = prevDays - firstDay + cellNum;
        var pDate = prevY + '-' + String(prevM + 1).padStart(2, '0') + '-' + String(pDay).padStart(2, '0');
        cellHTML += '<button type="button" class="ax-cal-cell" onclick="openNewTaskAtDate(\'' + pDate + '\')">' +
          '<span class="ax-cal-cell__n ax-cal-cell__n--muted ax-num">' + pDay + '</span></button>';

      } else if (day > daysInMonth) {
        /* Next month muted cell */
        var nDay = day - daysInMonth;
        var nDate = nextY + '-' + String(nextM + 1).padStart(2, '0') + '-' + String(nDay).padStart(2, '0');
        cellHTML += '<button type="button" class="ax-cal-cell" onclick="openNewTaskAtDate(\'' + nDate + '\')">' +
          '<span class="ax-cal-cell__n ax-cal-cell__n--muted ax-num">' + nDay + '</span></button>';
        day++;

      } else {
        var dDate = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        var isToday = dDate === today;
        var evts = dayMap[dDate] || [];

        cellHTML += '<button type="button" class="ax-cal-cell' + (isToday ? ' ax-cal-cell--today' : '') + '" onclick="calOpenDay(\'' + dDate + '\')">' +
          '<span class="ax-cal-cell__n ax-num' + (isToday ? ' ax-cal-cell__n--today' : '') + '">' + day + '</span>' +
          renderCalEventsVireo(evts, 3, dDate) +
          '</button>';
        day++;
      }
    }
  }

  document.getElementById('cal-grid-vireo').innerHTML = cellHTML;
  updateNavBadges();
}

function renderCalEventsVireo(arr, limit, dateStr) {
  if (!arr || !arr.length) return '';
  var out = '';
  var max = limit || 99;
  for (var i = 0; i < Math.min(arr.length, max); i++) {
    var ev = arr[i];
    var isPost = !!ev.dataPostagem;
    var color = isPost ? 'var(--ax-accent)' : 'var(--ax-viz-violet)';
    if (ev.stage === 'concluido') color = 'var(--ax-viz-emerald)';
    out += '<span class="ax-cal-event" style="--c:' + color + ';" onclick="event.stopPropagation();openEditTask(' + ev.id + ')" title="' + esc((isPost ? 'Post: ' : 'Venc: ') + ev.titulo) + '">' +
      esc(ev.titulo) + '</span>';
  }
  if (arr.length > max) {
    out += '<span class="ax-cal-more" onclick="event.stopPropagation();calOpenDay(\'' + dateStr + '\')">+' + (arr.length - max) + ' mais</span>';
  }
  return out;
}

function calOpenDay(dateStr) {
  var tasks = S.activities.filter(function (a) { return a.categoria === 1; });
  var dayTasks = tasks.filter(function (a) {
    var key = a.dataPostagem || a.dataVencimento;
    return key && key === dateStr;
  });
  var parts = dateStr.split('-');
  var title = parts[2] + '/' + parts[1] + '/' + parts[0];

  /* Mostra modal de detalhes em vez de alert bloqueante */
  var modal = document.getElementById('confirm-modal');
  var mTitle = document.getElementById('confirm-title');
  var mMsg = document.getElementById('confirm-msg');
  var mCancel = document.getElementById('confirm-cancel');
  var mOk = document.getElementById('confirm-ok');

  mTitle.textContent = title;
  var listHTML = '<div class="ax-list ax-list--flush">';
  if (dayTasks.length === 0) {
    listHTML += '<p style="color:var(--ax-text-subtle);font-size:var(--ax-text-sm);padding:8px 0;">Nenhuma atividade editorial nesta data.</p>';
  } else {
    for (var i = 0; i < dayTasks.length; i++) {
      var a = dayTasks[i], st = stageOf(a.stage);
      var isPost = !!a.dataPostagem;
      listHTML += '<div class="ax-list__row" style="cursor:pointer" onclick="openEditTask(' + a.id + ');closeConfirm();">' +
        '<span class="ax-list__leading"><span class="ax-badge ax-badge--soft ax-badge--' + st.tone + ' ax-badge--pill" style="font-size:var(--ax-text-2xs);">' + esc(st.label) + '</span></span>' +
        '<span class="ax-list__content"><span class="ax-list__title">' + esc(a.titulo) + '</span>' +
        '<span class="ax-list__meta">' + (isPost ? 'Postagem' : 'Vencimento') + ' · ' + a.progress + '%</span></span>' +
        '</div>';
    }
  }
  listHTML += '</div>';
  mMsg.innerHTML = listHTML;
  mCancel.style.display = '';
  mOk.style.display = 'none';
  mOk.onclick = closeConfirm;
  mCancel.onclick = closeConfirm;
  openOverlay('confirm-modal');
}

function openNewTaskAtDate(dateStr) {
  openNewTask('afazer', true);
  document.getElementById('tmf-post').value = dateStr;
}

/* Mini month */
function renderMiniMonth(y, m, dayMap) {
  var dowHTML = '';
  for (var d = 0; d < 7; d++) {
    dowHTML += '<small style="color:var(--ax-text-subtle);font-size:var(--ax-text-2xs);font-weight:600;padding:4px 0;">' + CAL_DOW_MINI[d] + '</small>';
  }
  document.getElementById('mini-dow').innerHTML = dowHTML;

  var firstDay = new Date(y, m, 1).getDay();
  var daysInMonth = new Date(y, m + 1, 0).getDate();
  var prevDays = new Date(y, m, 0).getDate();
  var today = todayISO();

  var prevM = m === 0 ? 11 : m - 1;
  var prevY = m === 0 ? y - 1 : y;

  var gridHTML = '';
  /* Leading muted days */
  for (var i = firstDay - 1; i >= 0; i--) {
    var pDay = prevDays - i;
    gridHTML += '<span class="ax-num" style="font-size:var(--ax-text-xs);color:var(--ax-text-subtle);padding:2px 0;">' + pDay + '</span>';
  }
  /* Current month days */
  for (var day = 1; day <= daysInMonth; day++) {
    var dDate = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var isToday = dDate === today;
    var hasEvents = dayMap[dDate] && dayMap[dDate].length > 0;
    var style = 'font-size:var(--ax-text-xs);padding:3px 0;border-radius:var(--ax-radius-sm);cursor:pointer;';
    if (isToday) style += 'background:var(--ax-accent);color:var(--ax-on-accent);font-weight:600;';
    else if (hasEvents) style += 'background:color-mix(in oklab,var(--ax-accent) 10%,transparent);color:var(--ax-text-strong);';
    else style += 'color:var(--ax-text);';
    gridHTML += '<button type="button" class="ax-num" style="font-family:var(--ax-font-mono);' + style + 'border:0;background:' + (isToday ? 'var(--ax-accent)' : (hasEvents ? 'color-mix(in oklab,var(--ax-accent) 10%,transparent)' : 'transparent')) + ';" onclick="calGoToDay(\'' + dDate + '\')">' + day + '</button>';
  }
  /* Trailing muted days (fill remaining slots) */
  var total = firstDay + daysInMonth;
  var remaining = total <= 28 ? 28 - total : total <= 35 ? 35 - total : 42 - total;
  for (var j = 1; j <= remaining; j++) {
    gridHTML += '<span class="ax-num" style="font-size:var(--ax-text-xs);color:var(--ax-text-subtle);padding:2px 0;">' + j + '</span>';
  }
  document.getElementById('mini-grid').innerHTML = gridHTML;
}

function calGoToDay(dateStr) {
  var parts = dateStr.split('-');
  calDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
  renderCalendario();
  calOpenDay(dateStr);
}

function renderMiniUpcoming(tasks) {
  var upcoming = tasks.filter(function (a) { return a.stage !== 'concluido'; })
    .sort(function (a, b) { return (a.dataPostagem || a.dataVencimento || '') < (b.dataPostagem || b.dataVencimento || '') ? -1 : 1; })
    .slice(0, 5);
  var html = '';
  for (var i = 0; i < upcoming.length; i++) {
    var a = upcoming[i];
    var isPost = !!a.dataPostagem;
    var color = isPost ? 'var(--ax-accent)' : 'var(--ax-viz-violet)';
    var dateLabel = fmtDate(a.dataPostagem || a.dataVencimento);
    html += '<div class="ax-cluster" style="gap:var(--ax-space-3);flex-wrap:nowrap;align-items:flex-start;cursor:pointer;" onclick="openEditTask(' + a.id + ')">' +
      '<span style="width:3px;align-self:stretch;border-radius:2px;background:' + color + ';flex:0 0 auto;"></span>' +
      '<div style="min-width:0;flex:1 1 auto;">' +
      '<div class="ax-text-truncate" style="font-size:var(--ax-text-sm);color:var(--ax-text);font-weight:500;">' + esc(a.titulo) + '</div>' +
      '<div class="ax-num" style="font-size:var(--ax-text-xs);color:var(--ax-text-subtle);">' + (isPost ? 'Post: ' : 'Venc: ') + dateLabel + '</div></div></div>';
  }
  if (!html) html = '<div style="font-size:var(--ax-text-sm);color:var(--ax-text-subtle);">Tudo em dia.</div>';
  document.getElementById('cal-upcoming').innerHTML = html;
}

function updateCalCounts(tasks) {
  document.getElementById('cal-count-post').textContent = tasks.filter(function (a) { return !!a.dataPostagem; }).length;
  document.getElementById('cal-count-venc').textContent = tasks.filter(function (a) { return !a.dataPostagem; }).length;
  document.getElementById('cal-count-done').textContent = tasks.filter(function (a) { return a.stage === 'concluido'; }).length;
}
