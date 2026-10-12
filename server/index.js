/* =========================================================
   خادم النظام (Entry Point)
   - تقديم الواجهة (index.html / css / js)
   - تسجيل الدخول بجلسات آمنة (httpOnly cookies)
   - واجهة REST API لكل البيانات مع فرض الصلاحيات على الخادم
   ========================================================= */
require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const dbapi = require('./database');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

dbapi.init();

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));

app.use(session({
  name: 'hospital.sid',
  secret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,          // يتطلب HTTPS في الإنتاج (متوفر على Render/Vercel)
    maxAge: 1000 * 60 * 60 * 8 // 8 ساعات
  }
}));

// =========================================================
//  الصلاحيات حسب الدور
// =========================================================
const READ_ROLES = {
  users: ['مدير'],
  medicalRecords: ['مدير', 'طبيب'],
  invoices: ['مدير', 'موظف استقبال', 'محاسب'],
  invoiceItems: ['مدير', 'موظف استقبال', 'محاسب']
};
const WRITE_ROLES = {
  users: ['مدير'],
  medicalRecords: ['مدير', 'طبيب'],
  invoices: ['مدير', 'موظف استقبال', 'محاسب'],
  invoiceItems: ['مدير', 'موظف استقبال', 'محاسب']
};
function canRead(role, table) {
  const roles = READ_ROLES[table];
  return !roles || roles.includes(role);
}
function canWrite(role, table) {
  const roles = WRITE_ROLES[table];
  return !roles || roles.includes(role);
}

// =========================================================
//  برمجيات وسيطة
// =========================================================
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'غير مصرح، يرجى تسجيل الدخول' });
}
function publicUser(u) {
  return { id: u.id, username: u.username, fullName: u.fullName, role: u.role };
}

// =========================================================
//  المصادقة
// =========================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });
  const user = dbapi.findUserByUsername(String(username));
  if (!user || !user.active || !bcrypt.compareSync(String(password), user.password)) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
  req.session.user = publicUser(user);
  return res.json(publicUser(user));
});

app.post('/api/logout', (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: (req.session && req.session.user) || null });
});

app.post('/api/change-password', requireAuth, (req, res) => {
  const { current, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة قصيرة جدًا (4 أحرف على الأقل)' });
  }
  const user = dbapi.getUserWithPassword(req.session.user.id);
  if (!user || !bcrypt.compareSync(String(current || ''), user.password)) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
  }
  dbapi.setUserPassword(user.id, bcrypt.hashSync(String(newPassword), 10));
  return res.json({ ok: true });
});

// =========================================================
//  البيانات
// =========================================================
app.get('/api/data', requireAuth, (req, res) => {
  const role = req.session.user.role;
  const out = {};
  ['departments', 'doctors', 'patients', 'appointments', 'medicalRecords', 'invoices', 'invoiceItems', 'users']
    .forEach(t => { out[t] = canRead(role, t) ? dbapi.getAll(t) : []; });
  res.json(out);
});

app.post('/api/reset', requireAuth, (req, res) => {
  if (req.session.user.role !== 'مدير') return res.status(403).json({ error: 'لا تملك صلاحية' });
  dbapi.resetAll();
  res.json({ ok: true });
});

app.post('/api/:table/replace', requireAuth, (req, res) => {
  const { table } = req.params;
  if (!dbapi.isTable(table)) return res.status(404).json({ error: 'جدول غير معروف' });
  if (table === 'users') return res.status(400).json({ error: 'استيراد المستخدمين غير مدعوم (لحماية كلمات المرور)' });
  if (!canWrite(req.session.user.role, table)) return res.status(403).json({ error: 'لا تملك صلاحية' });
  dbapi.replaceAll(table, req.body);
  res.json({ ok: true });
});

app.post('/api/:table', requireAuth, (req, res) => {
  const { table } = req.params;
  if (!dbapi.isTable(table)) return res.status(404).json({ error: 'جدول غير معروف' });
  if (!canWrite(req.session.user.role, table)) return res.status(403).json({ error: 'لا تملك صلاحية' });

  const row = Object.assign({}, req.body || {});
  if (!row.id) return res.status(400).json({ error: 'المعرّف (id) مطلوب' });

  try {
    if (table === 'users') {
      if (!row.password) return res.status(400).json({ error: 'كلمة المرور مطلوبة' });
      if (dbapi.usernameExists(row.username)) return res.status(400).json({ error: 'اسم المستخدم موجود مسبقًا' });
      row.password = bcrypt.hashSync(String(row.password), 10);
    }
    dbapi.insert(table, row);
    res.json(dbapi.findById(table, row.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/:table/:id', requireAuth, (req, res) => {
  const { table, id } = req.params;
  if (!dbapi.isTable(table)) return res.status(404).json({ error: 'جدول غير معروف' });
  if (!canWrite(req.session.user.role, table)) return res.status(403).json({ error: 'لا تملك صلاحية' });

  const fields = Object.assign({}, req.body || {});
  try {
    if (table === 'users') {
      delete fields.username; // لا يمكن تعديل اسم المستخدم
      if (fields.password) {
        if (String(fields.password).length < 4) return res.status(400).json({ error: 'كلمة المرور قصيرة جدًا' });
        fields.password = bcrypt.hashSync(String(fields.password), 10);
      } else {
        delete fields.password;
      }
    }
    dbapi.update(table, id, fields);
    res.json(dbapi.findById(table, id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/:table/:id', requireAuth, (req, res) => {
  const { table, id } = req.params;
  if (!dbapi.isTable(table)) return res.status(404).json({ error: 'جدول غير معروف' });
  if (!canWrite(req.session.user.role, table)) return res.status(403).json({ error: 'لا تملك صلاحية' });

  if (table === 'users') {
    const u = dbapi.findById('users', id);
    if (u && u.username === 'shootal') return res.status(400).json({ error: 'لا يمكن حذف المستخدم الرئيسي' });
  }
  dbapi.remove(table, id);
  res.json({ ok: true });
});

// =========================================================
//  تقديم الواجهة (ملفات ساكنة محددة فقط — لا نكشف مجلدات الخادم)
// =========================================================
app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.use((req, res) => res.status(404).json({ error: 'الصفحة غير موجودة' }));

app.listen(PORT, () => {
  console.log(`Hospital server is running on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
});
