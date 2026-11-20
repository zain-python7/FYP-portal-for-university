'use strict';
const ACTIONS = {}, FORMS = {}, SUBS = {}, MS = {}, USERS = {};
const P = { student: {}, supervisor: {}, admin: {}, common: {} };
const CAL = { y: new Date().getFullYear(), m: new Date().getMonth() };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const firstName = n => String(n || '').replace(/^(Dr\.?|Mr\.?|Ms\.?)\s+/i, '').split(' ')[0];
const greet = () => { const x = new Date().getHours(); return x < 12 ? 'Good morning' : x < 18 ? 'Good afternoon' : 'Good evening'; };
const reg = (map, list) => list.forEach(x => { map[x.id] = x; });
const DOMAINS = ['Web', 'Mobile', 'AI', 'IoT', 'Data', 'Security', 'Other'];
const pbarCell = (done, total) => { const p = total ? Math.round(done / total * 100) : 0; return `<span class="pbar"><i data-w="${p}"></i></span>${p}%`; };
const acts = (...a) => `<div class="acts">${a.join('')}</div>`;
const plink = (id, t) => `<a href="#/project/${id}">${h(t)}</a>`;
const EDITABLE = ['proposed', 'changes_requested', 'rejected'];

function previewHtml(s) {
  if (!s) return '<p class="mut">No document has been uploaded yet.</p>';
  const pdf = /\.pdf$/i.test(s.file_name);
  return `<div class="pvbar"><span><b>${h(s.file_name)}</b> <span class="mut">v${s.version} · ${D(s.submitted_at)}${s.by_name ? ' · ' + h(s.by_name) : ''}</span></span>${s.has_file ? `<a class="btn alt sm" href="/api/files/${s.id}?dl=1">Download</a>` : ''}</div>`
    + (!s.has_file ? '<p class="mut">This record has no file attached.</p>' : pdf ? `<iframe class="pvframe" src="/api/files/${s.id}" title="${h(s.file_name)}"></iframe>` : `<p class="mut">Preview is only available for PDF files. Use Download to open ${h(s.file_name)}.</p>`);
}
const fileBtns = (s, staff) => acts((s.has_file ? btn('View', 'view', s.id) + ` <a class="btn alt sm" href="/api/files/${s.id}?dl=1">Download</a>` : '')
  + (staff ? (s.review_status !== 'accepted' ? ' ' + btn('Accept', 'review', s.id, 'sm', 'data-v="accepted"') : '') + (s.review_status !== 'revision_needed' ? ' ' + btn('Needs revision', 'review', s.id, 'danger sm', 'data-v="revision_needed"') : '') : ''));

// ---------- shared project page ----------
function projectView(d, role) {
  const p = d.project, ms = d.milestones, done = ms.filter(m => m.status === 'done').length, pct = ms.length ? Math.round(done / ms.length * 100) : 0;
  reg(SUBS, d.submissions); reg(MS, ms);
  const staff = role !== 'student', editable = role === 'student' && EDITABLE.includes(p.status);
  let html = C.card('', `<div class="phead"><div><h2 style="margin:0">${h(p.title)}</h2><p class="mut">${h(p.domain || 'No domain set')} · Registered ${D(p.created_at)}</p></div>${sb(p.status)}</div>
    <div class="pmeta"><div><span class="mut">Supervisor</span><b>${p.supervisor_name ? h(p.supervisor_name) : 'Not assigned yet'}</b></div><div><span class="mut">Group</span><b>${d.members.map(m => h(m.full_name) + (m.roll_no ? ` (${h(m.roll_no)})` : '')).join(', ')}</b></div></div>
    <div class="progress"><div class="pbar big"><i data-w="${pct}"></i></div><span class="mut">${done} of ${ms.length} milestones complete (${pct}%)</span></div>
    <div class="btns">${role === 'admin' ? btn(p.supervisor_id ? 'Change supervisor' : 'Assign supervisor', 'assign', p.id, 'sm') : ''}${editable ? '<a class="btn alt sm" href="#/register">Edit project details</a>' : ''}${role === 'student' ? '<a class="btn alt sm" href="#/proposal">Upload proposal</a>' : ''}</div>`);
  if (role === 'student' && p.status === 'changes_requested') html += `<section class="card alert late"><h2>Your supervisor asked for changes</h2><p>Read the feedback below, update your proposal and upload it again.</p><a class="btn sm" href="#/proposal">Upload new version</a></section>`;
  if (staff && p.status === 'proposed') html += p.supervisor_id
    ? C.card('Your decision on this proposal', F({ name: 'decision', dataid: p.id, fields: [{ name: 'comment', label: 'Comments for the students', type: 'textarea', optional: true, placeholder: 'Required if you request changes or reject' }], buttons: '<button class="btn" type="submit" name="decision" value="approve">Approve</button><button class="btn alt" type="submit" name="decision" value="changes">Request changes</button><button class="btn danger" type="submit" name="decision" value="reject">Reject</button>' }), 'alert wait')
    : C.card('Waiting for a supervisor', '<p class="mut">Assign a supervisor to this project before it can be reviewed.</p>', 'alert wait');
  html += C.text('Abstract', p.abstract || 'No abstract provided.');
  const lead = d.submissions.find(s => s.kind === 'proposal' && s.has_file) || d.submissions.find(s => s.has_file) || d.submissions[0];
  html += C.card('Document preview', `<div id="pv">${previewHtml(lead)}</div>`);
  html += C.table({ title: 'Documents', heads: ['File', 'Type', 'Version', 'Submitted', 'Status', ''], empty: 'No documents have been uploaded yet.', rows: d.submissions.map(s => [h(s.file_name), s.kind === 'proposal' ? 'Proposal' : 'Document', 'v' + s.version, `${D(s.submitted_at)}<br><span class="mut">${h(s.by_name)}</span>`, sb(s.review_status), fileBtns(s, staff)]) });
  html += C.table({ title: 'Milestones', heads: ['Milestone', 'Due', 'Status', 'Notes', ''], empty: 'Milestones appear here once the proposal is approved.', rows: ms.map(m => [h(m.title), D(m.due_date), msb(m), h(m.notes || ''), btn('Update', 'upd', m.id)]) });
  html += C.card('Feedback', (d.feedback.length ? d.feedback.map(f => `<div class="fb"><b>${h(f.by_name)}</b> <span class="mut">${D(f.created_at)}</span><p>${h(f.comment)}</p>${f.follow_up ? `<span class="chip">Next step</span>${h(f.follow_up)}` : ''}</div>`).join('') : '<p class="mut">No feedback yet.</p>')
    + (staff ? '<hr style="border:0;border-top:1px solid var(--soft);margin:16px 0">' + F({ name: 'feedback', dataid: p.id, submit: 'Send feedback', fields: [{ name: 'comment', label: 'New feedback', type: 'textarea' }, { name: 'follow_up', label: 'Next step for the students', optional: true, placeholder: 'e.g. Draft 5 usability test tasks' }] }) : ''));
  return html;
}
P.supervisor.project = P.admin.project = async ({ param }) => {
  const d = await api('/projects/' + param);
  return { title: d.project.title, sub: d.members.map(m => m.full_name).join(', '), html: projectView(d, ME.role) };
};

// ---------- calendar ----------
function calHtml(items) {
  const { y, m } = CAL, first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), map = {};
  items.forEach(i => { const [yy, mm, dd] = i.date.split('-').map(Number); if (yy === y && mm - 1 === m) (map[dd] = map[dd] || []).push(i); });
  let g = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => `<div class="dn">${x}</div>`).join('') + '<div></div>'.repeat(first);
  for (let d = 1; d <= days; d++) { const it = map[d] || [], ds = `${y}-${pad(m + 1)}-${pad(d)}`; g += `<div class="d ${it.length ? it[0].kind + ' has' : ''} ${ds === TODAY ? 'today' : ''}" ${it.length ? `title="${h(it.map(i => i.title).join(', '))}"` : ''}>${d}${it.length ? `<small>${h(it[0].title)}</small>` : ''}</div>`; }
  return C.card('', `<div class="thead"><h2>${MONTHS[m]} ${y}</h2><span>${btn('‹', 'calnav', -1, 'alt sm', 'aria-label="Previous month"')} ${btn('›', 'calnav', 1, 'alt sm', 'aria-label="Next month"')}</span></div><div class="cal">${g}</div>`);
}
const calPage = (items, sub) => {
  const up = items.filter(i => i.date >= TODAY && i.kind !== 'ok').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  return { title: 'Deadlines', sub, html: C.cols([calHtml(items), C.rows('Coming up', up.map(i => ({ main: i.title, sub: D(i.date), badge: i.badge })), 'No upcoming deadlines.')]) };
};
const msItem = (m, withProject) => ({ date: m.due_date, title: withProject ? `${m.project}: ${m.title}` : m.title, kind: m.status === 'done' ? 'ok' : m.due_date < TODAY ? 'late' : 'wait', badge: msb(m) });
ACTIONS.calnav = el => { CAL.m += +el.dataset.id; if (CAL.m < 0) { CAL.m = 11; CAL.y--; } if (CAL.m > 11) { CAL.m = 0; CAL.y++; } refresh(); };

// ---------- student ----------
P.student.dashboard = async () => {
  const d = await api('/projects/mine');
  if (!d) return { title: `${greet()}, ${firstName(ME.name)}`, sub: 'Start by registering your final year project.', action: { label: 'Register your FYP', href: '#/register' }, html: C.state('+', 'n', 'No project yet', 'Register your project so your supervisor can review your proposal.', '<a class="btn" href="#/register">Register your FYP</a>') };
  const ms = d.milestones, done = ms.filter(m => m.status === 'done').length, next = ms.find(m => m.status !== 'done');
  const notice = { proposed: ['wait', 'Waiting for your supervisor', 'Your proposal is being reviewed. You will get a notification when there is a decision.'], changes_requested: ['late', 'Changes requested', 'Your supervisor asked for changes. Update your proposal and upload it again.'], rejected: ['late', 'Proposal rejected', 'Read the feedback, revise your idea and submit again.'] }[d.project.status];
  return {
    title: `${greet()}, ${firstName(ME.name)}`, sub: next ? `Next deadline: ${next.title}, ${D(next.due_date)}` : 'You have no open milestones.', action: { label: 'Submit a document', href: '#/documents' },
    html: (notice ? `<section class="card alert ${notice[0]}"><h2>${notice[1]}</h2><p>${notice[2]}</p><a class="btn sm" href="#/${d.project.status === 'proposed' ? 'myfyp' : 'proposal'}">${d.project.status === 'proposed' ? 'View my project' : 'Update proposal'}</a></section>` : '')
      + C.stats([[`${done} of ${ms.length}`, 'Milestones done'], [next ? D(next.due_date) : 'None', 'Next deadline'], [d.feedback.length, 'Feedback items'], [d.submissions.length, 'Documents submitted']])
      + C.cols([C.rows('Milestones', ms.map(m => ({ main: m.title, sub: 'Due ' + D(m.due_date), badge: msb(m) })), 'Milestones appear once your proposal is approved.'),
        C.rows('Latest feedback', d.feedback.slice(0, 3).map(f => ({ main: f.comment, sub: `${f.by_name}, ${D(f.created_at)}${f.follow_up ? ' · Next: ' + f.follow_up : ''}` })), 'No feedback yet.')]),
  };
};
P.student.myfyp = async () => {
  const d = await api('/projects/mine');
  if (!d) return { title: 'My FYP', sub: 'Project details and group', html: C.state('+', 'n', 'No project yet', 'Register your final year project to get started.', '<a class="btn" href="#/register">Register your FYP</a>') };
  return { title: 'My FYP', sub: 'Project details, documents and progress', html: projectView(d, 'student') };
};
P.student.register = async () => {
  const [d, sups] = await Promise.all([api('/projects/mine'), api('/users?role=supervisor')]);
  const edit = !!d;
  if (d && !EDITABLE.includes(d.project.status)) return { title: 'Register your FYP', sub: '', html: C.state('i', 'n', 'Your project is already approved', 'Its details can no longer be edited. Ask the FYP office if something must change.', '<a class="btn" href="#/myfyp">Go to My FYP</a>') };
  const p = d && d.project;
  const fields = [{ name: 'title', label: 'Project title', placeholder: 'e.g. FYP Management Portal' }, { name: 'domain', label: 'Domain', type: 'select', placeholder: 'Choose a domain', options: DOMAINS },
    ...(edit ? [] : [{ name: 'member2', label: 'Group member 2 roll no', optional: true, placeholder: '24-CS-000' }, { name: 'member3', label: 'Group member 3 roll no', optional: true, placeholder: '24-CS-000' }]),
    { name: 'preferred', label: 'Preferred supervisor', type: 'select', optional: true, options: [['', 'No preference'], ...sups.map(s => [s.id, s.full_name])] },
    { name: 'abstract', label: 'Abstract', type: 'textarea', placeholder: 'Describe the problem and your solution' }];
  return { title: edit ? 'Edit your project' : 'Register your FYP', sub: 'Tell us about your project. You can edit it until it is approved.', html: C.card('Project details', F({ name: 'register', dataid: edit ? p.id : '', cols: 2, fields, submit: edit ? 'Save changes' : 'Register project', values: p ? { title: p.title, domain: p.domain, preferred: p.preferred_supervisor_id, abstract: p.abstract } : {} })) };
};
P.student.proposal = async () => {
  const d = await api('/projects/mine');
  if (!d) return { title: 'Submit your proposal', sub: '', html: C.state('+', 'n', 'Register your project first', 'You need a registered project before you can upload a proposal.', '<a class="btn" href="#/register">Register your FYP</a>') };
  const st = d.project.status, props = d.submissions.filter(s => s.kind === 'proposal'), has = props.length > 0, ok = ['in_progress', 'approved', 'completed'].includes(st);
  reg(SUBS, d.submissions);
  const decision = ok ? ['Approved', 'You can start working on the milestones', 'ok'] : st === 'changes_requested' ? ['Changes requested', 'Revise and upload again', 'cur'] : st === 'rejected' ? ['Rejected', 'Revise and upload again', 'cur'] : ['Decision', 'Approve or revise', ''];
  const last = d.feedback[0];
  return {
    title: 'Submit your proposal', sub: 'Upload the proposal document for review',
    html: C.steps('Proposal status', [['Registered', d.project.title, 'ok'], ['Submitted', has ? D(props[0].submitted_at) : 'Not yet', has ? 'ok' : 'cur'], ['Under review', d.project.supervisor_name || 'No supervisor yet', has && st === 'proposed' ? 'cur' : ok ? 'ok' : ''], decision])
      + (st === 'changes_requested' && last ? `<section class="card alert late"><h2>Feedback to address</h2><p>${h(last.comment)}</p></section>` : '')
      + C.card('Upload proposal', F({ name: 'proposalUpload', dataid: d.project.id, submit: 'Submit proposal', fields: [{ name: 'file', label: 'Proposal file (PDF or DOCX, up to 10 MB)', type: 'file', accept: '.pdf,.docx' }, { name: 'note', label: 'Note for your supervisor', type: 'textarea', optional: true }] }))
      + C.table({ title: 'Previous proposal versions', heads: ['File', 'Version', 'Submitted', 'Status', ''], empty: 'No proposal uploaded yet.', rows: props.map(s => [h(s.file_name), 'v' + s.version, D(s.submitted_at), sb(s.review_status), fileBtns(s, false)]) }),
  };
};
P.student.milestones = async () => {
  const d = await api('/projects/mine');
  if (!d) return { title: 'Milestones and progress', sub: '', html: C.state('+', 'n', 'No project yet', 'Milestones appear after your proposal is approved.', '<a class="btn" href="#/register">Register your FYP</a>') };
  const ms = d.milestones, done = ms.filter(m => m.status === 'done').length; reg(MS, ms); let cur = false;
  const steps = ms.map(m => { const k = m.status === 'done' ? 'ok' : !cur ? (cur = true, 'cur') : ''; return [m.title, D(m.due_date), k]; });
  return { title: 'Milestones and progress', sub: `${done} of ${ms.length} milestones complete`, html: (steps.length ? C.steps('Project timeline', steps) : '') + C.table({ title: 'All milestones', heads: ['Milestone', 'Due', 'Status', 'Notes', ''], empty: 'Milestones appear here once your proposal is approved.', rows: ms.map(m => [h(m.title), D(m.due_date), msb(m), h(m.notes || ''), btn('Update', 'upd', m.id)]) }) };
};
P.student.documents = async () => {
  const list = await api('/submissions'); reg(SUBS, list);
  return { title: 'Documents and submissions', sub: 'All files you have submitted', action: { label: 'Upload document', act: 'upload' }, html: C.table({ title: 'Submissions', heads: ['File', 'Type', 'Version', 'Submitted', 'Status', ''], empty: 'You have not uploaded anything yet.', rows: list.map(s => [h(s.file_name), s.kind === 'proposal' ? 'Proposal' : 'Document', 'v' + s.version, D(s.submitted_at), sb(s.review_status), fileBtns(s, false)]) }) };
};
ACTIONS.upload = async () => {
  const d = await api('/projects/mine');
  if (!d) return toast('Register your project before uploading documents.', 'err');
  modal('Upload document', F({ name: 'upload', dataid: d.project.id, submit: 'Upload', fields: [{ name: 'file', label: 'File (PDF or DOCX, up to 10 MB)', type: 'file', accept: '.pdf,.docx' }, { name: 'milestone_id', label: 'Milestone', type: 'select', optional: true, options: [['', 'Not linked to a milestone'], ...d.milestones.map(m => [m.id, m.title])] }, { name: 'note', label: 'Note', type: 'textarea', optional: true }] }));
};
P.student.feedback = async () => {
  const list = await api('/feedback');
  return { title: 'Feedback', sub: 'Comments from your supervisor', html: C.card('From your supervisor', list.length ? list.map(f => `<div class="fb"><b>${h(f.by_name)}</b> <span class="mut">${D(f.created_at)}</span><p>${h(f.comment)}</p>${f.follow_up ? `<span class="chip">Next step</span>${h(f.follow_up)}` : ''}</div>`).join('') : '<p class="mut">No feedback yet. It appears here after your supervisor reviews your work.</p>') };
};
P.student.deadlines = async () => {
  const d = await api('/projects/mine');
  const items = d ? d.milestones.map(m => msItem(m)) : (await api('/deadlines')).map(x => ({ date: x.due_date, title: x.title, kind: x.due_date < TODAY ? 'n' : 'wait', badge: x.due_date < TODAY ? B('n', 'Passed') : B('wait', 'Upcoming') }));
  return calPage(items, d ? 'Your project milestones' : 'Portal deadlines');
};

// ---------- supervisor ----------
P.supervisor.dashboard = async () => {
  const o = await api('/overview'), s = o.stats;
  return { title: `Welcome, ${firstName(ME.name)}`, sub: `${s.proposals + s.docs} item${s.proposals + s.docs === 1 ? '' : 's'} waiting for your review`, action: { label: 'Open review queue', href: '#/reviews' },
    html: C.stats([[s.projects, 'Projects'], [s.proposals, 'Proposals to decide'], [s.docs, 'Documents to review'], [s.open, 'Open milestones'], [s.overdue, 'Overdue milestones']])
      + C.cols([C.rows('Proposals waiting for a decision', o.queue.map(p => ({ main: p.title, sub: p.students, href: '#/project/' + p.id, badge: B('wait', 'Review') })), 'No proposals are waiting.'),
        C.rows('Documents waiting for review', o.docs.map(x => ({ main: x.file_name, sub: x.project, href: '#/project/' + x.project_id, badge: B('wait', 'Review') })), 'No documents are waiting.')]) };
};
P.supervisor.projects = P.admin.projects = async () => {
  const list = await api('/projects'), admin = ME.role === 'admin';
  return { title: admin ? 'Manage projects' : 'Assigned projects', sub: `${list.length} project${list.length === 1 ? '' : 's'}`,
    html: C.table({ title: admin ? 'All projects' : 'Your projects', heads: admin ? ['Project', 'Students', 'Supervisor', 'Status', 'Progress', ''] : ['Project', 'Students', 'Status', 'Progress', 'To review', ''], empty: 'No projects yet.',
      rows: list.map(p => admin ? [plink(p.id, p.title), h(p.students), p.supervisor ? h(p.supervisor) : B('late', 'Not assigned'), sb(p.status), pbarCell(p.ms_done, p.ms_total), acts(`<a class="btn alt sm" href="#/project/${p.id}">View</a>`, p.supervisor ? '' : `<a class="btn sm" href="#/assignment/${p.id}">Assign</a>`)]
        : [plink(p.id, p.title), h(p.students), sb(p.status), pbarCell(p.ms_done, p.ms_total), p.awaiting ? B('wait', p.awaiting + ' waiting') : '-', acts(`<a class="btn alt sm" href="#/project/${p.id}">View</a>`)]) }) };
};
P.supervisor.reviews = async () => {
  const [pl, docs] = await Promise.all([api('/projects'), api('/submissions?status=awaiting')]); reg(SUBS, docs);
  const props = pl.filter(p => p.status === 'proposed');
  return { title: 'Review queue', sub: `${props.length} proposals and ${docs.length} documents are waiting`,
    html: C.table({ title: 'Proposals waiting for a decision', heads: ['Project', 'Students', 'Registered', ''], empty: 'No proposals are waiting for you.', rows: props.map(p => [plink(p.id, p.title), h(p.students), D(p.created_at), `<a class="btn sm" href="#/project/${p.id}">Review</a>`]) })
      + C.table({ title: 'Documents waiting for review', heads: ['File', 'Project', 'Submitted', ''], empty: 'No documents are waiting for you.', rows: docs.map(s => [h(s.file_name), plink(s.project_id, s.project), D(s.submitted_at), acts(btn('View', 'view', s.id), `<a class="btn sm" href="#/project/${s.project_id}">Review</a>`)]) }) };
};
P.supervisor.milestones = async () => {
  const list = await api('/milestones'); reg(MS, list);
  return { title: 'Milestone tracking', sub: 'All milestones across your projects', html: C.table({ title: 'Milestones', heads: ['Project', 'Milestone', 'Due', 'Status', ''], empty: 'No milestones yet. They appear after you approve a proposal.', rows: list.map(m => [plink(m.project_id, m.project), h(m.title), D(m.due_date), msb(m), btn('Update', 'upd', m.id)]) }) };
};
P.supervisor.feedback = async () => {
  const [pl, fb] = await Promise.all([api('/projects'), api('/feedback')]);
  return { title: 'Give feedback', sub: 'The students are notified when you send it',
    html: C.card('New feedback', pl.length ? F({ name: 'givefb', cols: 2, submit: 'Send feedback', fields: [{ name: 'project_id', label: 'Project', type: 'select', placeholder: 'Choose a project', options: pl.map(p => [p.id, p.title]) }, { name: 'follow_up', label: 'Next step for the students', optional: true, placeholder: 'e.g. Draft 5 test tasks' }, { name: 'comment', label: 'Feedback', type: 'textarea', placeholder: 'Write your comments' }] }) : '<p class="mut">You have no projects yet.</p>')
      + C.rows('Feedback you gave', fb.slice(0, 8).map(f => ({ main: f.comment, sub: `${f.project} · ${D(f.created_at)}`, href: '#/project/' + f.project_id })), 'You have not given any feedback yet.') };
};
P.supervisor.deadlines = async () => calPage((await api('/milestones')).map(m => msItem(m, true)), 'Milestones across your projects');

// ---------- admin ----------
P.admin.dashboard = async () => {
  const o = await api('/overview'), s = o.stats;
  return { title: 'Overview', sub: 'Status of all final year projects', action: { label: 'Add deadline', href: '#/deadlines' },
    html: C.stats([[s.students, 'Students'], [s.supervisors, 'Supervisors'], [s.projects, 'Projects'], [s.unassigned, 'Need a supervisor'], [s.overdue, 'Overdue milestones']])
      + C.cols([C.bars('Submissions per week', o.bars), C.rows('Needs attention', o.attention.map(a => ({ main: a.title, sub: a.sub, href: a.href, badge: B(a.kind, a.badge) })), 'Everything is on track.')]) };
};
const userRows = (list, isStudent) => list.map(u => { USERS[u.id] = u; return isStudent
  ? [h(u.full_name), h(u.roll_no || '-'), h(u.email), h(u.project_title || 'None yet'), sb(u.active ? 'active' : 'inactive'), btn('Edit', 'edituser', u.id)]
  : [h(u.full_name), h(u.email), `${u.load_count} of ${u.capacity}`, sb(u.active ? 'active' : 'inactive'), btn('Edit', 'edituser', u.id)]; });
P.admin.students = async () => { const l = await api('/users?role=student'); return { title: 'Manage students', sub: `${l.length} students`, action: { label: 'Add student', act: 'adduser', id: 'student' }, html: C.table({ title: 'Students', heads: ['Name', 'Roll no', 'Email', 'Project', 'Status', ''], rows: userRows(l, true), empty: 'No students yet.' }) }; };
P.admin.supervisors = async () => { const l = await api('/users?role=supervisor'); return { title: 'Manage supervisors', sub: `${l.length} supervisors`, action: { label: 'Add supervisor', act: 'adduser', id: 'supervisor' }, html: C.table({ title: 'Supervisors', heads: ['Name', 'Email', 'Projects', 'Status', ''], rows: userRows(l, false), empty: 'No supervisors yet.' }) }; };
const userForm = (role, u) => F({ name: u ? 'edituser' : 'adduser', dataid: u ? u.id : role, attrs: `data-role="${role}"`, submit: u ? 'Save changes' : 'Create account', values: u || {},
  fields: [{ name: 'full_name', label: 'Full name' }, { name: 'email', label: 'Email', type: 'email' }, ...(role === 'student' ? [{ name: 'roll_no', label: 'Roll number', placeholder: '24-CS-000' }] : [{ name: 'capacity', label: 'Max projects', type: 'number' }]), { name: 'phone', label: 'Phone', optional: true }, ...(u ? [{ name: 'active', label: 'Account status', type: 'select', options: [['1', 'Active'], ['0', 'Disabled']] }] : [])] });
ACTIONS.adduser = el => modal('Add ' + el.dataset.id, userForm(el.dataset.id, null));
ACTIONS.edituser = el => { const u = USERS[el.dataset.id], role = u.roll_no !== undefined ? 'student' : 'supervisor'; modal('Edit ' + role, userForm(role, { ...u, active: u.active ? '1' : '0' }) + `<div class="btns" style="margin-top:12px">${btn('Reset password', 'resetpw', u.id, 'alt sm')}</div>`); };
ACTIONS.resetpw = async el => { if (!confirm('Create a new temporary password for this user?')) return; const r = await api(`/users/${el.dataset.id}/reset`, { method: 'POST' }); modal('Password reset', `<p>Share this temporary password with the user:</p><div class="cred">${h(r.temp_password)}</div><p class="mut">They can change it from Profile after signing in.</p>`); };
P.admin.assignment = async ({ param }) => {
  const [pl, sups] = await Promise.all([api('/projects'), api('/users?role=supervisor')]);
  const un = pl.filter(p => !p.supervisor_id && !['rejected', 'completed'].includes(p.status)), sel = un.find(p => p.id == param) || null;
  return { title: 'Supervisor assignment', sub: `${un.length} project${un.length === 1 ? '' : 's'} need a supervisor`,
    html: C.cols([C.rows('Unassigned projects', un.map(p => ({ main: p.title, sub: `${p.students}${p.preferred ? ' · Prefers ' + p.preferred : ''}`, href: '#/assignment/' + p.id, badge: B('late', 'Waiting') })), 'Every project has a supervisor.'),
      C.card('Assign', un.length ? F({ name: 'assign', submit: 'Assign supervisor', values: { project_id: sel ? sel.id : '', supervisor_id: sel && sel.preferred_supervisor_id || '' }, fields: [{ name: 'project_id', label: 'Project', type: 'select', placeholder: 'Choose a project', options: un.map(p => [p.id, p.title]) }, { name: 'supervisor_id', label: 'Supervisor', type: 'select', placeholder: 'Choose a supervisor', options: sups.map(s => [s.id, `${s.full_name} (${s.load_count} of ${s.capacity} projects)`]) }] }) : '<p class="mut">Nothing to assign.</p>')]) };
};
ACTIONS.assign = async el => { const sups = await api('/users?role=supervisor'); modal('Assign supervisor', F({ name: 'assign', dataid: el.dataset.id, submit: 'Assign supervisor', fields: [{ name: 'supervisor_id', label: 'Supervisor', type: 'select', placeholder: 'Choose a supervisor', options: sups.map(s => [s.id, `${s.full_name} (${s.load_count} of ${s.capacity} projects)`]) }] })); };
P.admin.deadlines = async () => {
  const l = await api('/deadlines'); reg(USERS, l);
  return { title: 'Deadlines and milestones', sub: 'New deadlines are added to every active project and students are notified',
    html: C.table({ title: 'Deadlines', heads: ['Milestone', 'Applies to', 'Due', 'Status', ''], empty: 'No deadlines yet.', rows: l.map(x => [h(x.title), h(x.applies_to), D(x.due_date), x.due_date < TODAY ? B('ok', 'Closed') : B('wait', 'Open'), acts(btn('Edit', 'editdl', x.id), btn('Delete', 'deldl', x.id, 'danger sm'))]) })
      + C.card('New deadline', F({ name: 'deadline', cols: 3, submit: 'Save deadline', fields: [{ name: 'title', label: 'Title' }, { name: 'due_date', label: 'Due date', type: 'date' }, { name: 'applies_to', label: 'Applies to', type: 'select', options: ['All projects'] }] })) };
};
ACTIONS.editdl = el => { const x = USERS[el.dataset.id]; modal('Edit deadline', F({ name: 'editdl', dataid: x.id, submit: 'Save changes', values: x, fields: [{ name: 'title', label: 'Title' }, { name: 'due_date', label: 'Due date', type: 'date' }, { name: 'applies_to', label: 'Applies to', type: 'select', options: ['All projects'] }] })); };
ACTIONS.deldl = async el => { if (!confirm('Delete this deadline? Its milestones are removed from all projects.')) return; await api('/deadlines/' + el.dataset.id, { method: 'DELETE' }); toast('Deadline deleted.'); refresh(); };
P.admin.submissions = async () => {
  const l = await api('/submissions'); reg(SUBS, l);
  return { title: 'Submissions', sub: 'All documents across projects', html: C.table({ title: 'Submissions', heads: ['File', 'Project', 'Submitted by', 'Submitted', 'Status', ''], empty: 'No submissions yet.', rows: l.map(s => [h(s.file_name) + ` <span class="mut">v${s.version}</span>`, plink(s.project_id, s.project), h(s.by_name), D(s.submitted_at), sb(s.review_status), fileBtns(s, false)]) }) };
};
P.admin.activity = async () => {
  const a = await api('/activity');
  return { title: 'Feedback and activity', sub: 'What happened recently', html: C.cols([C.bars('Feedback given per week', a.bars), C.rows('Activity log', a.items.map(i => ({ main: i.text, sub: `${i.who || 'System'} · ${ago(i.created_at)}` })), 'No activity yet.')]) };
};
P.admin.settings = async () => {
  const s = await api('/settings');
  return { title: 'Settings', sub: 'System-wide options', html: C.card('Portal settings', F({ name: 'settings', cols: 2, submit: 'Save settings', values: s, fields: [{ name: 'department', label: 'Department' }, { name: 'academic_year', label: 'Academic year' }, { name: 'max_group', label: 'Max group size', type: 'number' }, { name: 'max_file_mb', label: 'Max file size (MB)', type: 'number' }, { name: 'allowed_types', label: 'Allowed file types', hint: 'Separate with commas, for example: pdf, docx' }] })) };
};

// ---------- shared ----------
ACTIONS.view = el => { const s = SUBS[el.dataset.id], pv = $('#pv'); if (!s) return; if (pv) { pv.innerHTML = previewHtml(s); pv.scrollIntoView({ behavior: 'smooth', block: 'center' }); } else modal(s.file_name, previewHtml(s), true); };
ACTIONS.review = async el => { await api('/submissions/' + el.dataset.id, { method: 'PATCH', body: { review_status: el.dataset.v } }); toast('Document marked as ' + el.dataset.v.replace('_', ' ') + '.'); refresh(); };
ACTIONS.upd = el => { const m = MS[el.dataset.id]; modal('Update milestone', `<p class="mut" style="margin-bottom:12px">${h(m.title)} · Due ${D(m.due_date)}</p>` + F({ name: 'milestone', dataid: m.id, submit: 'Save', values: m, fields: [{ name: 'status', label: 'Status', type: 'select', options: [['pending', 'Pending'], ['in_progress', 'In progress'], ['done', 'Done']] }, { name: 'notes', label: 'Progress notes', type: 'textarea', optional: true }] })); };
ACTIONS.notif = async el => { if (el.dataset.unread === '1') await api(`/notifications/${el.dataset.id}/read`, { method: 'POST' }).catch(() => { }); if (el.dataset.link) location.hash = el.dataset.link; else refresh(); updateBell(); };
ACTIONS.readall = async () => { await api('/notifications/read-all', { method: 'POST' }); toast('All notifications marked as read.'); refresh(); updateBell(); };
ACTIONS.reload = () => location.reload();
P.common.notifications = async () => {
  const n = await api('/notifications');
  return { title: 'Notifications', sub: n.unread ? `${n.unread} unread` : 'You are all caught up', action: n.unread ? { label: 'Mark all as read', act: 'readall' } : null,
    html: C.card('Recent', n.items.length ? n.items.map(i => `<div class="ri link ${i.is_read ? '' : 'unread'}" role="button" tabindex="0" data-act="notif" data-id="${i.id}" data-link="${h(i.link || '')}" data-unread="${i.is_read ? 0 : 1}" style="cursor:pointer"><span><b>${h(i.message)}</b><span class="mut">${ago(i.created_at)}</span></span>${i.is_read ? '' : B('wait', 'New')}</div>`).join('') : '<p class="mut">No notifications yet.</p>') };
};
P.common.profile = async () => {
  const { user: u } = await api('/auth/me');
  return { title: 'Profile and settings', sub: 'Manage your account',
    html: C.card('Your details', F({ name: 'profile', cols: 2, submit: 'Save changes', values: { full_name: u.name, roll_no: u.roll_no, email: u.email, phone: u.phone }, fields: [{ name: 'full_name', label: 'Full name' }, ...(u.roll_no ? [{ name: 'roll_no', label: 'Roll number', readonly: true }] : []), { name: 'email', label: 'Email', readonly: true }, { name: 'phone', label: 'Phone', optional: true }] }))
      + C.card('Change password', F({ name: 'password', cols: 2, submit: 'Update password', fields: [{ name: 'current', label: 'Current password', type: 'password', autocomplete: 'current-password' }, { name: 'next', label: 'New password', type: 'password', min: 8, autocomplete: 'new-password', hint: 'At least 8 characters.' }] })) };
};
P.common.search = async ({ q }) => ({
  title: 'Search', sub: 'Find projects, documents and people',
  html: `<div class="sbar"><input id="q" type="search" value="${h(q)}" placeholder="Search projects, documents or people" aria-label="Search"></div><div id="sres" class="blocks"></div>`,
  after: () => { const box = $('#q'), out = $('#sres'); let t; const run = async () => { const v = box.value.trim(); if (v.length < 2) { out.innerHTML = '<p class="mut">Type at least 2 letters.</p>'; return; } const r = await api('/search?q=' + encodeURIComponent(v)); out.innerHTML = C.cols([C.rows('Projects', r.projects.map(p => ({ main: p.title, sub: p.students || '', href: '#/project/' + p.id })), 'No projects match.'), C.rows('Documents', r.documents.map(d => ({ main: d.file_name, sub: `${d.project} · v${d.version}`, href: '#/project/' + d.project_id })), 'No documents match.')]) + (r.people.length ? C.rows('People', r.people.map(x => ({ main: x.full_name, sub: `${x.role}${x.email ? ' · ' + x.email : ''}` }))) : ''); }; box.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run().catch(e => toast(e.message, 'err')), 250); }); box.focus(); run().catch(() => { }); },
});
P.common.help = async () => ({
  title: 'Help and support', sub: 'Answers and contact details',
  html: C.rows('Common questions', [['How do I submit a document?', 'Open Documents and choose Upload document.'], ['Can I change my project title?', 'Yes, until your supervisor approves the project.'], ['I forgot my password', 'Ask the FYP office to reset it. They will give you a temporary password.'], ['Who do I contact about a deadline?', 'Use the form below to reach the FYP office.']].map(([a, b]) => ({ main: a, sub: b })))
    + C.card('Contact the FYP office', F({ name: 'help', submit: 'Send message', fields: [{ name: 'subject', label: 'Subject' }, { name: 'message', label: 'Message', type: 'textarea', placeholder: 'How can we help?' }] })),
});
P.common.states = async () => ({ title: 'Empty and error states', sub: 'How the portal looks when something is missing or goes wrong', html: C.cols([C.state('+', 'n', 'No documents yet', 'Upload your first document to start tracking it.'), C.state('!', 'late', 'Could not load this page', 'Check your connection and try again.', btn('Try again', 'reload', '', 'alt')), C.state('x', 'wait', 'No access', 'Your account cannot open this page.', '<a class="btn alt" href="#/dashboard">Go to dashboard</a>')]) });

// ---------- form handlers ----------
const done = (msg, close = true) => { toast(msg); close && closeModal(); refresh(); updateBell(); };
FORMS.register = async (o, fd, f) => { if (f.dataset.id) { await api('/projects/' + f.dataset.id, { method: 'PUT', body: o }); toast('Project updated.'); } else { await api('/projects', { method: 'POST', body: o }); toast('Project registered. Now upload your proposal.'); location.hash = '#/proposal'; return; } location.hash = '#/myfyp'; };
FORMS.proposalUpload = async (o, fd, f) => { fd.set('kind', 'proposal'); await api(`/projects/${f.dataset.id}/submissions`, { method: 'POST', body: fd }); toast('Proposal submitted. Your supervisor has been notified.'); f.reset(); refresh(); };
FORMS.upload = async (o, fd, f) => { fd.set('kind', 'document'); await api(`/projects/${f.dataset.id}/submissions`, { method: 'POST', body: fd }); done('Document uploaded.'); };
FORMS.milestone = async (o, fd, f) => { await api('/milestones/' + f.dataset.id, { method: 'PATCH', body: o }); done('Milestone updated.'); };
FORMS.decision = async (o, fd, f) => { const r = await api(`/projects/${f.dataset.id}/decision`, { method: 'POST', body: o }); done({ in_progress: 'Proposal approved. Milestones were created.', changes_requested: 'Sent back to the students for changes.', rejected: 'Proposal rejected.' }[r.status], false); };
FORMS.feedback = async (o, fd, f) => { await api(`/projects/${f.dataset.id}/feedback`, { method: 'POST', body: o }); done('Feedback sent.', false); };
FORMS.givefb = async (o, fd, f) => { await api(`/projects/${o.project_id}/feedback`, { method: 'POST', body: o }); f.reset(); done('Feedback sent.', false); };
FORMS.assign = async (o, fd, f) => { await api(`/projects/${f.dataset.id || o.project_id}/assign`, { method: 'POST', body: o }); toast('Supervisor assigned. Everyone involved was notified.'); closeModal(); if (location.hash.startsWith('#/assignment')) location.hash = '#/assignment'; refresh(); };
FORMS.adduser = async (o, fd, f) => { const r = await api('/users', { method: 'POST', body: { ...o, role: f.dataset.role } }); closeModal(); refresh(); modal('Account created', `<p>Give <b>${h(o.email)}</b> this temporary password:</p><div class="cred">${h(r.temp_password)}</div><p class="mut">They can change it from Profile after signing in. It is shown only once.</p>`); };
FORMS.edituser = async (o, fd, f) => { await api('/users/' + f.dataset.id, { method: 'PUT', body: o }); done('Account updated.'); };
FORMS.deadline = async (o, fd, f) => { await api('/deadlines', { method: 'POST', body: o }); f.reset(); done('Deadline added to all active projects.', false); };
FORMS.editdl = async (o, fd, f) => { await api('/deadlines/' + f.dataset.id, { method: 'PUT', body: o }); done('Deadline updated.'); };
FORMS.settings = async o => { await api('/settings', { method: 'PUT', body: o }); done('Settings saved.', false); };
FORMS.profile = async (o) => { await api('/auth/me', { method: 'PUT', body: o }); ME.name = o.full_name; done('Profile saved.', false); };
FORMS.password = async (o, fd, f) => { await api('/auth/password', { method: 'POST', body: o }); f.reset(); toast('Password updated.'); };
FORMS.help = async (o, fd, f) => { await api('/help', { method: 'POST', body: o }); f.reset(); toast('Message sent. The FYP office will reply by email.'); };
