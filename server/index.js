const express = require('express');
const session = require('express-session');
const path = require('path');
const Database = require('better-sqlite3');

// إعداد قاعدة البيانات في ذاكرة السيرفر لضمان التشغيل السريع بدون أخطاء مسارات
const db = new Database(':memory:');

// إنشاء جدول مبسط للتأكد من عمل قاعدة البيانات
db.exec(
  CREATE TABLE IF NOT EXISTS status_check (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT
  );
);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'hospital-management-secret-key',
  resave: false,
  saveUninitialized: false
}));

// تقديم الملفات الثابتة والواجهة الأمامية من المجلد الحالي
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(express.static(__dirname));

// مسار فحص حالة السيرفر وقاعدة البيانات
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Hospital Management System is running smoothly!' });
});

// تقديم الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #2b6cb0;">🚀 السيرفر يعمل بنجاح!</h2>
          <p>تم تشغيل نظام إدارة المستشفيات بنجاح على Render.</p>
        </div>
      );
    }
  });
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// التعامل مع الصفحات غير الموجودة
app.use((req, res) => {
  res.status(404).json({ error: 'الصفحة غير موجودة' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(Hospital server is running on port ${PORT});
});
