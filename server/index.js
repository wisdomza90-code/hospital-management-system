const express = require('express');
const session = require('express-session');
const path = require('path');

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

// مسار فحص الحالة للتأكد من عمل السيرفر
app.get('/api/status', (req, res) => {
  res.json({ status: 'Online', message: 'Hospital Server is running successfully!' });
});

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      res.send(
        <div style="font-family: Tahoma; text-align: center; margin-top: 50px;">
          <h2 style="color: #2b6cb0;">نظام إدارة المستشفيات يعمل بنجاح! 🚀</h2>
          <p>السيرفر يعمل الآن وجاهز، ويتم عرض هذه الصفحة لعدم وجود ملف index.html في المجلد الحالي أو جارٍ رفعه.</p>
        </div>
      );
    }
  });
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// معالجة الصفحات غير الموجودة
app.use((req, res) => {
  res.status(404).json({ error: 'الصفحة غير موجودة' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(Hospital server is running on port ${PORT});
});
