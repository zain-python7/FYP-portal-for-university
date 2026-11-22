// Upgrades an existing database to v3. Safe to run more than once: npm run db:migrate
const db = require('../src/db');
const has = async (t, c) => (await db.query('SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?', [t, c]))[0].length > 0;
const add = async (t, c, def) => { if (!(await has(t, c))) { await db.query(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`); console.log('added', `${t}.${c}`); } };
(async () => {
  await add('users', 'phone', 'VARCHAR(30) NULL');
  await add('users', 'capacity', 'INT NOT NULL DEFAULT 5');
  await add('users', 'active', 'TINYINT(1) NOT NULL DEFAULT 1');
  await add('projects', 'domain', 'VARCHAR(60) NULL');
  await add('projects', 'preferred_supervisor_id', 'INT NULL');
  await db.query("ALTER TABLE projects MODIFY status ENUM('proposed','changes_requested','approved','in_progress','completed','rejected') NOT NULL DEFAULT 'proposed'");
  await add('submissions', 'stored_name', 'VARCHAR(120) NULL');
  await add('submissions', 'kind', "ENUM('proposal','document') NOT NULL DEFAULT 'document'");
  await add('submissions', 'note', 'TEXT NULL');
  await add('submissions', 'mime', 'VARCHAR(80) NULL');
  await add('milestones', 'deadline_id', 'INT NULL');
  await db.query(`CREATE TABLE IF NOT EXISTS deadlines (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, applies_to VARCHAR(60) NOT NULL DEFAULT 'All projects', due_date DATE NOT NULL)`);
  await db.query(`CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, message VARCHAR(255) NOT NULL, link VARCHAR(120) NULL, is_read TINYINT(1) NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
  await db.query(`CREATE TABLE IF NOT EXISTS activity (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NULL, text VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await db.query(`CREATE TABLE IF NOT EXISTS settings (k VARCHAR(50) PRIMARY KEY, v VARCHAR(255) NOT NULL)`);
  console.log('Migration complete.'); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
