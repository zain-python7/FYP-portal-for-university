'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
const TODAY = (() => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`; })();
const D = d => { if (!d) return '-'; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); const x = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d); return isNaN(x) ? '-' : `${x.getDate()} ${MON[x.getMonth()]} ${x.getFullYear()}`; };
const ago = d => { const s = (Date.now() - new Date(d)) / 1000; if (s < 60) return 'Just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; if (s < 604800) return Math.floor(s / 86400) + ' d ago'; return D(d); };

async function api(path, o = {}) {
  const opt = { method: o.method || 'GET', headers: {} };
  if (o.body instanceof FormData) opt.body = o.body;
  else if (o.body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(o.body); }
  const r = await fetch('/api' + path, opt); let d = null; try { d = await r.json(); } catch (e) { }
  if (r.status === 401) { location.href = '/login.html'; throw new Error('Please sign in again.'); }
  if (!r.ok) throw new Error((d && d.error) || 'Something went wrong. Please try again.');
  return d;
}
function toast(m, type) { const t = $('#toast'); t.textContent = m; t.className = 'show ' + (type || ''); t.style.background = type === 'err' ? '#b3261e' : ''; clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = ''; }, type === 'err' ? 5000 : 3200); }

const ST = { proposed: ['wait', 'Proposed'], changes_requested: ['late', 'Changes requested'], approved: ['ok', 'Approved'], in_progress: ['wait', 'In progress'], completed: ['ok', 'Completed'], rejected: ['late', 'Rejected'], pending: ['n', 'Pending'], done: ['ok', 'Done'], submitted: ['wait', 'Awaiting review'], under_review: ['wait', 'Under review'], accepted: ['ok', 'Accepted'], revision_needed: ['late', 'Revision needed'], active: ['ok', 'Active'], inactive: ['late', 'Disabled'] };
const B = (k, l) => `<span class="badge ${k}">${h(l)}</span>`;
const sb = s => { const x = ST[s] || ['n', s]; return B(x[0], x[1]); };
const msb = m => m.status !== 'done' && m.due_date < TODAY ? B('late', 'Overdue') : sb(m.status);
const btn = (label, act, id, cls = 'alt sm', extra = '') => `<button type="button" class="btn ${cls}" data-act="${act}" data-id="${h(id ?? '')}" ${extra}>${h(label)}</button>`;


const IC = { home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6', folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', flag: 'M5 21V4M5 4h11l-2 4 2 4H5', file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6', message: 'M4 5h16v11H9l-5 4z', calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 6.5M18 14a7 7 0 0 1 4 6', check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6', inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5', alert: 'M12 3l10 18H2zM12 10v5M12 18v.5', activity: 'M3 12h4l3-8 4 16 3-8h4', settings: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1', search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5', cap: 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6', chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2', help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.5', logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9', menu: 'M4 6h16M4 12h16M4 18h16' };
const ICON = (n, z = 20) => `<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[n] || IC.chart}"/></svg>`;
const iconFor = l => { l = String(l).toLowerCase(); return /milestone/.test(l) ? 'flag' : /deadline/.test(l) ? 'calendar' : /feedback/.test(l) ? 'message' : /document|submitted|submission/.test(l) ? 'file' : /student/.test(l) ? 'users' : /supervisor|need a/.test(l) ? 'user' : /proposal/.test(l) ? 'check' : /review/.test(l) ? 'inbox' : /overdue/.test(l) ? 'alert' : /project/.test(l) ? 'folder' : 'chart'; };

const C = {
  card: (t, inner, cls = '') => `<section class="card ${cls}">${t ? `<h2>${h(t)}</h2>` : ''}${inner}</section>`,
  stats: i => `<div class="stats">${i.map(([a, b], n) => `<div class="stat s${n % 5}"><span class="sic">${ICON(iconFor(b), 22)}</span><b ${typeof a === 'number' ? `data-count="${a}"` : ''}>${h(a)}</b><span class="mut">${h(b)}</span></div>`).join('')}</div>`,
  row: x => { const inner = `<span><b>${h(x.main)}</b><span class="mut">${h(x.sub || '')}</span></span>${x.badge || ''}`; return x.href ? `<a class="ri link ${x.cls || ''}" href="${x.href}">${inner}</a>` : `<div class="ri ${x.cls || ''}" ${x.attrs || ''}>${inner}</div>`; },
  rows: (t, items, empty = 'Nothing here yet.') => C.card(t, items.length ? items.map(C.row).join('') : `<p class="mut">${h(empty)}</p>`),
  table: ({ title, heads, rows, empty = 'Nothing here yet.', action = '' }) => `<section class="card"><div class="thead"><h2>${h(title)}</h2><span class="tools">${action}${rows.length > 5 ? `<input class="tsearch" type="search" placeholder="Filter rows" aria-label="Filter ${h(title)}">` : ''}</span></div>${rows.length ? `<div class="tablewrap"><table><thead><tr>${heads.map(x => `<th ${x ? 'class="sortable" tabindex="0"' : ''}>${h(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="mut empty" hidden style="padding-top:10px">No matching rows.</p>` : `<p class="mut">${h(empty)}</p>`}</section>`,
  steps: (t, i) => C.card(t, `<div class="steps">${i.map(([l, s, k]) => `<div class="step ${k || ''}"><div class="dot2">${k === 'ok' ? '&#10003;' : ''}</div><b>${h(l)}</b><span>${h(s)}</span></div>`).join('')}</div>`),
  bars: (t, d) => { const mx = Math.max(1, ...d.map(x => x.value)); return C.card(t, `<div class="bars" role="img" aria-label="${h(t)}">${d.map(x => `<div class="bar">${x.value}<i style="height:${x.value / mx * 85}%"></i></div>`).join('')}</div><div class="barl">${d.map(x => `<span>${h(x.label)}</span>`).join('')}</div>`); },
  state: (sym, k, head, text, actions = '') => `<section class="card state"><div class="ic ${k}">${sym}</div><h2>${h(head)}</h2><p>${h(text)}</p><div class="btns">${actions}</div></section>`,
  cols: arr => `<div class="cols">${arr.join('')}</div>`,
  text: (t, s) => C.card(t, `<p class="pre">${h(s)}</p>`),
};

// ---- forms ----
function F(o) {
  const v = o.values || {};
  const fields = o.fields.map(f => {
    const id = `${o.name}_${f.name}`, val = v[f.name] ?? f.value ?? '', req = !f.optional && !f.readonly ? 'required' : '';
    let c;
    if (f.type === 'select') c = `<select id="${id}" name="${f.name}" ${req}>${f.placeholder ? `<option value="">${h(f.placeholder)}</option>` : ''}${f.options.map(op => { const [ov, ol] = Array.isArray(op) ? op : [op, op]; return `<option value="${h(ov)}" ${String(ov) === String(val) ? 'selected' : ''}>${h(ol)}</option>`; }).join('')}</select>`;
    else if (f.type === 'textarea') c = `<textarea id="${id}" name="${f.name}" placeholder="${h(f.placeholder || '')}" ${req}>${h(val)}</textarea>`;
    else c = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" placeholder="${h(f.placeholder || '')}" value="${h(val)}" ${f.readonly ? 'readonly' : ''} ${f.accept ? `accept="${f.accept}"` : ''} ${f.min ? `data-min="${f.min}"` : ''} ${f.type === 'number' ? 'min="1"' : ''} ${f.autocomplete ? `autocomplete="${f.autocomplete}"` : ''} ${req}>`;
    return `<div class="field ${f.type === 'textarea' || f.span ? 'span' : ''}"><label for="${id}">${h(f.label)}${f.optional ? ' <span class="mut">(optional)</span>' : ''}</label>${c}<div class="err" id="${id}_e"></div>${f.hint ? `<div class="mut">${h(f.hint)}</div>` : ''}</div>`;
  }).join('');
  return `<form class="cform" novalidate data-form="${o.name}" data-id="${h(o.dataid ?? '')}" ${o.attrs || ''}><div class="form-grid" style="--cols:${o.cols || 1}">${fields}</div><div class="btns">${o.buttons || `<button class="btn" type="submit">${h(o.submit || 'Save')}</button>`}</div></form>`;
}
function validate(f) {
  let ok = true, first = null;
  $$('.field', f).forEach(fd => {
    const c = $('input,select,textarea', fd), e = $('.err', fd); let m = '';
    if (c.required && (c.type === 'file' ? !c.files.length : !c.value.trim())) m = `Please fill in: ${$('label', fd).childNodes[0].textContent.trim()}.`;
    else if (c.type === 'email' && c.value && !/^\S+@\S+\.\S+$/.test(c.value)) m = 'Enter a valid email address.';
    else if (c.dataset.min && c.value.length < +c.dataset.min) m = `Use at least ${c.dataset.min} characters.`;
    e.textContent = m; m ? (c.setAttribute('aria-invalid', 'true'), ok = false, first = first || c) : c.removeAttribute('aria-invalid');
  });
  first && first.focus(); return ok;
}

// ---- modal ----
let lastFocus = null;
function modal(title, body, wide) {
  closeModal(); lastFocus = document.activeElement;
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="mbg" data-close></div><div class="mbox ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${h(title)}"><div class="mhead"><h2>${h(title)}</h2><button type="button" class="iconbtn" data-close aria-label="Close">&times;</button></div><div class="mbody">${body}</div></div>`;
  document.body.appendChild(m); requestAnimationFrame(() => m.classList.add('show'));
  const f = $('input:not([type=hidden]),select,textarea', m); f && f.focus(); return m;
}
function closeModal() { const m = $('.modal'); if (!m) return; m.remove(); lastFocus && lastFocus.focus && lastFocus.focus(); }
