const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const label = s => esc(s).replace(/_/g, ' ');

document.getElementById('out').onclick = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.href = '/login.html';
};

const views = {
  student: d => !d.project ? '<div class="card empty">You are not part of a project yet. Register your FYP to get started.</div>' : `
    <div class="card"><h2>${esc(d.project.title)}</h2>
      <span class="badge">${label(d.project.status)}</span>
      <p class="hint">Supervisor: ${esc(d.project.supervisor || 'Not assigned yet')}</p></div>
    <div class="card"><h2>Milestones</h2><ul class="list">${d.milestones.map(m => {
      const late = m.status !== 'done' && new Date(m.due_date) < new Date();
      return `<li><span>${esc(m.title)}<br><small class="hint">Due ${fmt(m.due_date)}</small></span>
        <span class="badge ${late ? 'overdue' : m.status === 'done' ? 'done' : ''}">${late ? 'overdue' : label(m.status)}</span></li>`;
    }).join('') || '<li class="empty">No milestones yet.</li>'}</ul></div>
    <div class="card"><h2>Latest feedback</h2><ul class="list">${d.feedback.map(f =>
      `<li><span>${esc(f.comment)}<br><small class="hint">${f.follow_up ? 'Next: ' + esc(f.follow_up) : ''}</small></span><small>${fmt(f.created_at)}</small></li>`
    ).join('') || '<li class="empty">No feedback yet.</li>'}</ul></div>`,

  supervisor: d => `<div class="card"><h2>Your projects</h2><ul class="list">${d.projects.map(p =>
    `<li><span>${esc(p.title)}<br><small class="hint">${p.open_milestones} open milestones, ${p.awaiting_review} awaiting review</small></span>
     <span class="badge">${label(p.status)}</span></li>`).join('') || '<li class="empty">No projects assigned to you yet.</li>'}</ul></div>`,

  admin: d => `<div class="grid">${[
    ['Students', d.counts.students], ['Supervisors', d.counts.supervisors],
    ['Projects', d.counts.projects], ['Need a supervisor', d.counts.unassigned], ['Overdue milestones', d.counts.overdue],
  ].map(([k, v]) => `<div class="card"><div class="stat">${v}</div>${k}</div>`).join('')}</div>`,
};

(async () => {
  const me = await fetch('/api/auth/me');
  if (!me.ok) return (location.href = '/login.html');
  const { user } = await me.json();
  document.getElementById('who').textContent = `${user.name} (${user.role})`;
  const r = await fetch('/api/dashboard');
  const data = await r.json();
  app.innerHTML = r.ok ? views[user.role](data) : `<div class="card error">${esc(data.error)}</div>`;
})().catch(() => { app.innerHTML = '<div class="card error">Could not load the dashboard. Refresh to try again.</div>'; });
