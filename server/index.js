const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'hospital-management-secret-key',
  resave: false,
  saveUninitialized: false
}));

// تقديم الملفات الثابتة والواجهة الأمامية
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار فحص الحالة
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Hospital Server is running successfully!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'الصفحة غير موجودة' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(Hospital server is running on port ${PORT});
});
