// Sample/test data only. Run once after schema.sql: npm run db:seed
const bcrypt = require('bcrypt');
const db = require('../src/db');

(async () => {
  const pw = await bcrypt.hash('Password123', 10);
  const users = [
    ['Admin Office', 'admin@rcet.edu.pk', null, 'admin'],
    ['Dr. Natasha Nigar', 'natasha@rcet.edu.pk', null, 'supervisor'],
    ['Zain ul Abideen', 'zain@rcet.edu.pk', '24-CS-443', 'student'],
    ['Sample Student', 'student@rcet.edu.pk', '24-CS-001', 'student'],
  ];
  for (const [name, email, roll, role] of users) {
    await db.query(
      'INSERT IGNORE INTO users (full_name,email,roll_no,password_hash,role) VALUES (?,?,?,?,?)',
      [name, email, roll, pw, role]);
  }
  const [[sup]] = await db.query("SELECT id FROM users WHERE email='natasha@rcet.edu.pk'");
  const [[stu]] = await db.query("SELECT id FROM users WHERE email='zain@rcet.edu.pk'");
  const [p] = await db.query(
    "INSERT INTO projects (title,abstract,supervisor_id,status) VALUES (?,?,?,'in_progress')",
    ['FYP Management Portal', 'A user-centred web portal for managing FYPs.', sup.id]);
  await db.query('INSERT INTO project_members VALUES (?,?)', [p.insertId, stu.id]);
  const ms = [['Proposal submission', '2026-11-20', 'done'],
              ['Wireframes and prototype', '2026-12-10', 'in_progress'],
              ['Core modules', '2027-01-30', 'pending']];
  for (const [t, d, s] of ms)
    await db.query('INSERT INTO milestones (project_id,title,due_date,status) VALUES (?,?,?,?)', [p.insertId, t, d, s]);
  await db.query('INSERT INTO feedback (project_id,supervisor_id,comment,follow_up) VALUES (?,?,?,?)',
    [p.insertId, sup.id, 'Good scope. Please add usability test tasks.', 'Draft 5 test tasks']);
  console.log('Seeded. All sample accounts use password: Password123');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
