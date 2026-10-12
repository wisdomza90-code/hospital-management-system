/* =========================================================
   طبقة قاعدة البيانات (SQLite عبر better-sqlite3)
   - إنشاء الجداول تلقائيًا
   - إدخال بيانات أولية (Seed) مع تجزئة كلمات المرور بـ bcrypt
   - دوال CRUD عامة لكل الجداول
   ملاحظة: هذا الملف يقع في جذر المشروع، لذا مجلد البيانات = __dirname/data
   ========================================================= */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// ---------- مكان ملف قاعدة البيانات ----------
// يمكن تغييره عبر متغير البيئة DATA_DIR (مفيد عند تركيب قرص دائم على السحابة)
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'hospital.db');
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- تعريف الجداول ومصادرها ----------
// columns: الأعمدة المسموح للعميل بقراءتها.
// secret : أعمدة حساسة لا تُعاد أبدًا للعميل (كلمة المرور).
const TABLES = {
  departments:    { table: 'departments',     columns: ['id', 'name'] },
  doctors:        { table: 'doctors',         columns: ['id', 'name', 'specialty', 'phone', 'departmentId'] },
  patients:       { table: 'patients',        columns: ['id', 'name', 'age', 'gender', 'phone', 'address', 'regDate'] },
  appointments:   { table: 'appointments',    columns: ['id', 'patientId', 'doctorId', 'specialty', 'date', 'time', 'status'] },
  medicalRecords: { table: 'medical_records', columns: ['id', 'patientId', 'doctorId', 'visitDate', 'diagnosis', 'symptoms', 'prescription', 'medications', 'tests', 'notes'] },
  invoices:       { table: 'invoices',        columns: ['id', 'patientId', 'doctorId', 'date', 'status'] },
  invoiceItems:   { table: 'invoice_items',   columns: ['id', 'invoiceId', 'service', 'amount'] },
  users:          { table: 'users',           columns: ['id', 'username', 'fullName', 'role', 'active'], secret: ['password'] }
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  departmentId TEXT
);
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  address TEXT,
  regDate TEXT
);
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  doctorId TEXT,
  specialty TEXT,
  date TEXT,
  time TEXT,
  status TEXT
);
CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  doctorId TEXT,
  visitDate TEXT,
  diagnosis TEXT,
  symptoms TEXT,
  prescription TEXT,
  medications TEXT,
  tests TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  patientId TEXT,
  doctorId TEXT,
  date TEXT,
  status TEXT
);
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoiceId TEXT,
  service TEXT,
  amount REAL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  fullName TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
`;

// ---------- البيانات الأولية ----------
function seed() {
  const defaultPasswordHash = bcrypt.hashSync('1234', 10);

  const departments = [
    ['DEP001', 'الطب العام / الباطنية'],
    ['DEP002', 'الأطفال وحديثو الولادة'],
    ['DEP003', 'النساء والتوليد'],
    ['DEP004', 'الجراحة العامة'],
    ['DEP005', 'العظام والتأهيل'],
    ['DEP006', 'القلب والأوعية الدموية'],
    ['DEP007', 'الجلدية والتجميل'],
    ['DEP008', 'الأسنان'],
    ['DEP009', 'العيون'],
    ['DEP010', 'الأنف والأذن والحنجرة'],
    ['DEP011', 'المسالك البولية'],
    ['DEP012', 'المخ والأعصاب']
  ];

  const doctors = [
    ['D001', 'د. محمد أحمد', 'باطنية', '0912345678', 'DEP001'],
    ['D002', 'د. سارة علي', 'أطفال', '0923456789', 'DEP002'],
    ['D003', 'د. خالد عمر', 'جراحة', '0934567890', 'DEP004']
  ];

  const patients = [
    ['P001', 'أحمد محمد', 35, 'ذكر', '0911111111', 'أم درمان', '23/08/2026'],
    ['P002', 'فاطمة الزهراء', 28, 'أنثى', '0922222222', 'الخرطوم', '20/08/2026'],
    ['P003', 'يوسف عبدالله', 50, 'ذكر', '0933333333', 'بحري', '18/08/2026']
  ];

  const appointments = [
    ['A001', 'P001', 'D001', 'باطنية', '25/08/2026', '10:00 صباحًا', 'محجوز'],
    ['A002', 'P002', 'D002', 'أطفال', '24/08/2026', '11:30 صباحًا', 'مكتمل']
  ];

  const medicalRecords = [
    ['MR001', 'P001', 'D001', '25/08/2026', 'ارتجاع المريء', 'حرقان في المعدة، غثيان', 'أوميبرازول 20مجم يوميًا', 'أوميبرازول، جافيسكون', 'تحليل دم شامل', 'متابعة بعد أسبوعين']
  ];

  const invoices = [
    ['INV001', 'P001', 'D001', '25/08/2026', 'مدفوع']
  ];

  const invoiceItems = [
    ['II001', 'INV001', 'كشف طبي', 20000],
    ['II002', 'INV001', 'فحص مختبر', 5000]
  ];

  const users = [
    ['U001', 'shootal', defaultPasswordHash, 'مدير النظام', 'مدير', 1]
  ];

  const tx = db.transaction(() => {
    const ins = (sql, rows) => { const st = db.prepare(sql); rows.forEach(r => st.run(...r)); };

    ins('INSERT INTO departments (id,name) VALUES (?,?)', departments);
    ins('INSERT INTO doctors (id,name,specialty,phone,departmentId) VALUES (?,?,?,?,?)', doctors);
    ins('INSERT INTO patients (id,name,age,gender,phone,address,regDate) VALUES (?,?,?,?,?,?,?)', patients);
    ins('INSERT INTO appointments (id,patientId,doctorId,specialty,date,time,status) VALUES (?,?,?,?,?,?,?)', appointments);
    ins('INSERT INTO medical_records (id,patientId,doctorId,visitDate,diagnosis,symptoms,prescription,medications,tests,notes) VALUES (?,?,?,?,?,?,?,?,?,?)', medicalRecords);
    ins('INSERT INTO invoices (id,patientId,doctorId,date,status) VALUES (?,?,?,?,?)', invoices);
    ins('INSERT INTO invoice_items (id,invoiceId,service,amount) VALUES (?,?,?,?)', invoiceItems);
    ins('INSERT INTO users (id,username,password,fullName,role,active) VALUES (?,?,?,?,?,?)', users);
  });
  tx();
}

// ---------- التهيئة ----------
function init() {
  db.exec(SCHEMA);
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) seed();
}

// ---------- أدوات داخلية ----------
function isTable(name) { return Object.prototype.hasOwnProperty.call(TABLES, name); }

function toDbValue(v) {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v === undefined) return null;
  return v;
}

function convertRow(table, r) {
  if (!r) return r;
  if (table === 'users') r.active = !!r.active;
  if (table === 'patients' && r.age != null) r.age = Number(r.age) || 0;
  if (table === 'invoiceItems' && r.amount != null) r.amount = Number(r.amount) || 0;
  return r;
}

// ---------- عمليات CRUD ----------
function getAll(table) {
  const conf = TABLES[table];
  const rows = db.prepare(`SELECT ${conf.columns.join(',')} FROM ${conf.table}`).all();
  return rows.map(r => convertRow(table, r));
}

function findById(table, id) {
  const conf = TABLES[table];
  const r = db.prepare(`SELECT ${conf.columns.join(',')} FROM ${conf.table} WHERE id = ?`).get(id);
  return r ? convertRow(table, r) : null;
}

function insert(table, obj) {
  const conf = TABLES[table];
  const cols = conf.columns.concat(conf.secret || []);
  const values = cols.map(c => toDbValue(obj[c]));
  const placeholders = cols.map(() => '?').join(', ');
  db.prepare(`INSERT OR REPLACE INTO ${conf.table} (${cols.join(', ')}) VALUES (${placeholders})`).run(...values);
}

function update(table, id, fields) {
  const conf = TABLES[table];
  const allowed = conf.columns.concat(conf.secret || []);
  const cols = Object.keys(fields).filter(c => allowed.includes(c));
  if (!cols.length) return;
  const setClause = cols.map(c => `${c} = ?`).join(', ');
  const values = cols.map(c => toDbValue(fields[c]));
  values.push(id);
  db.prepare(`UPDATE ${conf.table} SET ${setClause} WHERE id = ?`).run(...values);
}

function remove(table, id) {
  const conf = TABLES[table];
  db.prepare(`DELETE FROM ${conf.table} WHERE id = ?`).run(id);
}

function replaceAll(table, rows) {
  const conf = TABLES[table];
  const tx = db.transaction((list) => {
    db.prepare(`DELETE FROM ${conf.table}`).run();
    list.forEach(r => insert(table, r));
  });
  tx(Array.isArray(rows) ? rows : []);
}

// ---------- دوال خاصة بالمستخدمين ----------
function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}
function getUserWithPassword(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}
function setUserPassword(id, hash) {
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, id);
}
function usernameExists(username, exceptId) {
  const row = exceptId
    ? db.prepare('SELECT id FROM users WHERE username = ? AND id <> ?').get(username, exceptId)
    : db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  return !!row;
}

// ---------- إعادة التعيين ----------
function resetAll() {
  const tx = db.transaction(() => {
    ['invoice_items', 'invoices', 'medical_records', 'appointments', 'patients', 'doctors', 'departments', 'users']
      .forEach(t => db.prepare(`DELETE FROM ${t}`).run());
    seed();
  });
  tx();
}

module.exports = {
  init, isTable, getAll, findById, insert, update, remove, replaceAll,
  findUserByUsername, getUserWithPassword, setUserPassword, usernameExists,
  resetAll
};
