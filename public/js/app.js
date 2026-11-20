'use strict';
let ME = null, navId = 0;
const MENU = {
  student: [['dashboard', 'Dashboard'], ['myfyp', 'My FYP'], ['milestones', 'Milestones'], ['documents', 'Documents'], ['feedback', 'Feedback'], ['deadlines', 'Deadlines'], ['notifications', 'Notifications'], ['profile', 'Profile']],
  supervisor: [['dashboard', 'Dashboard'], ['projects', 'Projects'], ['reviews', 'Reviews'], ['milestones', 'Milestones'], ['feedback', 'Feedback'], ['deadlines', 'Deadlines'], ['notifications', 'Notifications'], ['profile', 'Profile']],
  admin: [['dashboard', 'Dashboard'], ['students', 'Students'], ['supervisors', 'Supervisors'], ['projects', 'Projects'], ['assignment', 'Assignment'], ['deadlines', 'Deadlines'], ['submissions', 'Submissions'], ['activity', 'Activity'], ['notifications', 'Notifications'], ['settings', 'Settings']],
};
const ACTIVE = { register: 'myfyp', proposal: 'myfyp', project: 'projects', search: '', help: '', states: '' };
const SKEL = '<div class="skel t"></div><div class="skel"></div><div class="skel b" style="margin-top:16px"></div>';
const refresh = () => route(true);
const NAVICON = { dashboard: 'home', myfyp: 'folder', milestones: 'flag', documents: 'file', feedback: 'message', deadlines: 'calendar', notifications: 'bell', profile: 'user', projects: 'folder', reviews: 'check', students: 'users', supervisors: 'user', assignment: 'link', submissions: 'inbox', activity: 'activity', settings: 'settings', help: 'help' };
const A11Y_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4.5" r="2.3"/><path d="M4 8.5l1-1.8 7 1.6 7-1.6 1 1.8-5.5 1.5v3.2l2.3 6.8-1.9.8L12 14.5l-3.9 6.3-1.9-.8L8.5 13.2V10z"/></svg>';

async function updateBell() { try { const r = await api('/notifications/count'); const d = $('#ndot'); if (d) d.hidden = !r.unread; } catch (e) { } }
ACTIONS.signout = () => fetch('/api/auth/logout', { method: 'POST' }).finally(() => { location.href = '/login.html'; });
ACTIONS.menu = () => $('#side').classList.toggle('open');

function shell() {
  const ini = ME.name.split(' ').filter(w => /^[A-Z]/.test(w) && !/\./.test(w)).map(w => w[0]).join('').slice(0, 2) || ME.name[0];
  $('#root').innerHTML = `<div class="app"><aside class="side" id="side" aria-label="Main"><a class="logo" href="#/dashboard"><i>${ICON('cap', 22)}</i>FYP Portal</a><nav id="nav">${MENU[ME.role].map(([k, l]) => `<a class="nav" data-k="${k}" href="#/${k}">${ICON(NAVICON[k])}${h(l)}</a>`).join('')}</nav><div class="foot"><a class="nav" data-k="help" href="#/help">${ICON('help')}Help</a><button class="nav" type="button" data-act="signout">${ICON('logout')}Sign out</button></div></aside>
  <div class="main"><header class="topbar"><button class="iconbtn" id="menu" type="button" data-act="menu" aria-label="Open menu">${ICON('menu')}</button><div class="sbox">${ICON('search', 18)}<input id="gsearch" type="search" placeholder="Search projects, documents..." aria-label="Search the portal"></div><button type="button" class="a11y-trigger" data-a11y-open aria-expanded="false" aria-controls="a11y-bar">${A11Y_ICON}<span>Accessibility</span></button><a class="iconbtn" href="#/notifications" aria-label="Notifications">${ICON('bell', 22)}<span class="dot" id="ndot" hidden></span></a><div class="who"><b>${h(ME.name)}</b><span>${h(ME.role)}</span></div><a class="avatar" href="#/profile" aria-label="Profile: ${h(ME.name)}">${h(ini)}</a></header><main id="view" tabindex="-1"></main></div></div>`;
}
const parse = () => { const [path, qs] = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?'); const [key, param] = path.split('/'); return { key, param, q: new URLSearchParams(qs || '').get('q') || '' }; };
function anim() {
  $$('[data-count]').forEach(el => { const to = +el.dataset.count, t0 = performance.now(); const step = t => { const p = Math.min(1, (t - t0) / 700); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  requestAnimationFrame(() => requestAnimationFrame(() => $$('[data-w]').forEach(e => { e.style.width = e.dataset.w + '%'; })));
}
async function route(keep) {
  const { key, param, q } = parse(), fn = P[ME.role][key] || P.common[key], v = $('#view');
  $('#side').classList.remove('open');
  $$('#nav a, .foot a').forEach(a => { const on = a.dataset.k === (key in ACTIVE ? ACTIVE[key] : key); a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  if (!fn) { document.title = 'Not found - FYP Portal'; v.className = 'enter'; v.innerHTML = `<div class="blocks" style="padding-top:24px">${C.state('?', 'late', 'We cannot find that page', 'It may have moved, or you may not have access to it.', '<a class="btn" href="#/dashboard">Go to dashboard</a>')}</div>`; return; }
  const my = ++navId; if (!keep) { v.className = ''; v.innerHTML = SKEL; }
  try {
    const pg = await fn({ param, q }); if (my !== navId) return;
    document.title = `${pg.title} - FYP Portal`; const y = scrollY;
    const a = pg.action ? (pg.action.href ? `<a class="btn" href="${pg.action.href}">${h(pg.action.label)}</a>` : `<button class="btn" type="button" data-act="${pg.action.act}" data-id="${h(pg.action.id || '')}">${h(pg.action.label)}</button>`) : '';
    v.className = keep ? '' : 'enter';
    v.innerHTML = `<div class="pagehead ${key === 'dashboard' ? 'banner' : ''}"><div><h1>${h(pg.title)}</h1><p class="mut">${h(pg.sub || '')}</p></div>${a}</div><div class="blocks">${pg.html}</div>`;
    if (keep) scrollTo(0, y); else { v.focus({ preventScroll: true }); scrollTo(0, 0); }
    anim(); pg.after && pg.after();
  } catch (err) {
    if (my !== navId) return;
    v.className = ''; v.innerHTML = `<div class="blocks" style="padding-top:24px">${C.state('!', 'late', 'Could not load this page', err.message, btn('Try again', 'reload', '', 'alt'))}</div>`;
  }
  updateBell();
}
// ---- events ----
document.addEventListener('click', async e => {
  if (e.target.closest('[data-close]')) return closeModal();
  const th = e.target.closest('th.sortable'); if (th) return sortBy(th);
  const t = e.target.closest('[data-act]'); if (!t) return;
  const fn = ACTIONS[t.dataset.act]; if (!fn) return;
  t.classList.add('loading');
  try { await fn(t); } catch (err) { toast(err.message, 'err'); } finally { t.classList.remove('loading'); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act],th.sortable')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Enter' && e.target.id === 'gsearch') location.hash = '#/search?q=' + encodeURIComponent(e.target.value);
});
function sortBy(th) {
  const tbl = th.closest('table'), i = [...th.parentNode.children].indexOf(th), asc = !th.classList.contains('asc');
  $$('th', tbl).forEach(x => x.classList.remove('asc', 'desc')); th.classList.add(asc ? 'asc' : 'desc');
  const tb = $('tbody', tbl), rows = [...tb.rows], val = r => r.cells[i].textContent.trim();
  rows.sort((a, b) => { const x = val(a), y = val(b); return (asc ? 1 : -1) * x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' }); });
  rows.forEach(r => tb.appendChild(r));
}
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('.tsearch')) { const c = t.closest('.card'), q = t.value.toLowerCase(); let n = 0; $$('tbody tr', c).forEach(r => { const s = r.textContent.toLowerCase().includes(q); r.hidden = !s; n += s; }); $('.empty', c).hidden = n > 0; }
  if (t.matches('[aria-invalid]') && t.value) { t.removeAttribute('aria-invalid'); const er = $('#' + t.id + '_e'); er && (er.textContent = ''); }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('.cform'); if (!f) return; e.preventDefault();
  if (!validate(f)) return;
  const fd = new FormData(f), o = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string')), sub = e.submitter;
  if (sub && sub.name) o[sub.name] = sub.value;
  const fn = FORMS[f.dataset.form]; if (!fn) return;
  const btns = $$('button', f), old = sub ? sub.textContent : ''; btns.forEach(b => { b.disabled = true; }); if (sub) sub.textContent = 'Please wait...';
  try { await fn(o, fd, f, sub); } catch (err) { toast(err.message, 'err'); }
  finally { if (document.contains(f)) { btns.forEach(b => { b.disabled = false; }); if (sub) sub.textContent = old; } }
});
addEventListener('hashchange', () => { closeModal(); route(); });
(async () => {
  const r = await fetch('/api/auth/me'); if (!r.ok) return (location.href = '/login.html');
  ME = (await r.json()).user; shell(); route(); setInterval(updateBell, 30000);
})().catch(() => { $('#root').innerHTML = '<p class="mut" style="padding:40px">Could not load the portal. Refresh to try again.</p>'; });
