/* =========================================================
   منطق التطبيق: تسجيل الدخول + التنقل + كل الوحدات (الجزء 1)
   ========================================================= */
(function () {

  // ---------- أدوات مساعدة ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function statusBadge(status) {
    const map = {
      'محجوز': 'badge-info',
      'مكتمل': 'badge-success',
      'ملغي': 'badge-danger',
      'مدفوع': 'badge-success',
      'غير مدفوع': 'badge-warning'
    };
    const cls = map[status] || 'badge-muted';
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  }

  function fmtMoney(n) { return Number(n || 0).toLocaleString('en-US') + ' جنيه'; }

  // كائن الواجهة العام (يجب تعريفه قبل أي إسناد App.xxx)
  window.App = window.App || {};

  // ---------- أيقونات SVG (مبدأ المهارة: لا إيموجي كأيقونات) ----------
  const S = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    dashboard: `<svg ${S}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    patients: `<svg ${S}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    doctors: `<svg ${S}><path d="M4 3v5a4 4 0 0 0 8 0V3"/><path d="M8 3v5"/><path d="M12 17a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/></svg>`,
    departments: `<svg ${S}><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1M9 13h1M14 9h1M14 13h1"/></svg>`,
    appointments: `<svg ${S}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    medical: `<svg ${S}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>`,
    invoices: `<svg ${S}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>`,
    reports: `<svg ${S}><path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-6"/></svg>`,
    users: `<svg ${S}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    cross: `<svg ${S}><path d="M12 2v20M2 12h20"/></svg>`,
    menu: `<svg ${S}><path d="M3 6h18M3 12h18M3 18h18"/></svg>`,
    download: `<svg ${S}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`,
    upload: `<svg ${S}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>`,
    search: `<svg ${S}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
    plus: `<svg ${S}><path d="M12 5v14M5 12h14"/></svg>`,
    edit: `<svg ${S}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
    trash: `<svg ${S}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
    eye: `<svg ${S}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg ${S}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>`,
    logout: `<svg ${S}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>`
  };
  function ic(name) { return ICONS[name] || ''; }

  function openModal(title, bodyHTML) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHTML;
    $('#modal').classList.remove('hidden');
  }
  function closeModal() { $('#modal').classList.add('hidden'); }

  // ---------- الإكمال التلقائي في البحث ----------
  function acSuggestions(strings, q) {
    if (!q) return [];
    const seen = new Set(); const out = [];
    strings.forEach(s => {
      if (s && String(s).includes(q) && !seen.has(s)) { seen.add(s); out.push(s); }
    });
    return out;
  }

  function enableAutocomplete(input, getSuggestions, onPick) {
    const wrap = document.createElement('div');
    wrap.className = 'ac-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const list = document.createElement('ul');
    list.className = 'ac-list hidden';
    wrap.appendChild(list);

    function show(q) {
      const items = getSuggestions(q);
      if (!items.length) { list.classList.add('hidden'); list.innerHTML = ''; return; }
      list.innerHTML = items.slice(0, 8).map(s => `<li class="ac-item">${esc(s)}</li>`).join('');
      list.classList.remove('hidden');
      list.querySelectorAll('.ac-item').forEach(li => li.addEventListener('mousedown', e => {
        e.preventDefault();
        input.value = li.textContent;
        list.classList.add('hidden');
        onPick(li.textContent.trim());
      }));
    }

    input.addEventListener('input', () => show(input.value.trim()));
    input.addEventListener('focus', () => show(input.value.trim()));
    input.addEventListener('blur', () => setTimeout(() => list.classList.add('hidden'), 150));
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') list.classList.add('hidden');
    });
  }

  function wireSearch(inputId, getSuggestions, redraw) {
    const input = $('#' + inputId);
    if (!input) return;
    input.addEventListener('input', () => redraw(input.value.trim()));
    enableAutocomplete(input, getSuggestions, v => redraw(v));
  }

  // ---------- تصدير إلى Excel (CSV) ----------
  function exportToCsv(filename, rows) {
    const csv = '﻿' + rows.map(r => r.map(cell => {
      const s = String(cell == null ? '' : cell);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  App.exportTable = function (table) {
    const defs = {
      patients: { name: 'المرضى', headers: ['رقم المريض', 'الاسم', 'العمر', 'الجنس', 'الهاتف', 'العنوان', 'تاريخ التسجيل'],
        rows: () => DB.all('patients').map(p => [p.id, p.name, p.age, p.gender, p.phone, p.address, p.regDate]) },
      doctors: { name: 'الأطباء', headers: ['رقم الطبيب', 'الاسم', 'التخصص', 'رقم القسم', 'الهاتف'],
        rows: () => DB.all('doctors').map(d => [d.id, d.name, d.specialty, d.departmentId, d.phone]) },
      appointments: { name: 'المواعيد', headers: ['رقم الموعد', 'رقم المريض', 'رقم الطبيب', 'التخصص', 'التاريخ', 'الوقت', 'الحالة'],
        rows: () => DB.all('appointments').map(a => [a.id, a.patientId, a.doctorId, a.specialty, a.date, a.time, a.status]) },
      medicalRecords: { name: 'الملفات_الطبية', headers: ['رقم السجل', 'رقم المريض', 'رقم الطبيب', 'تاريخ الزيارة', 'التشخيص', 'الأعراض', 'الوصف', 'الأدوية', 'الفحوصات', 'الملاحظات'],
        rows: () => DB.all('medicalRecords').map(m => [m.id, m.patientId, m.doctorId, m.visitDate, m.diagnosis, m.symptoms, m.prescription, m.medications, m.tests, m.notes]) },
      invoices: { name: 'الفواتير', headers: ['رقم الفاتورة', 'رقم المريض', 'رقم الطبيب', 'التاريخ', 'الحالة'],
        rows: () => DB.all('invoices').map(i => [i.id, i.patientId, i.doctorId, i.date, i.status]) },
      users: { name: 'المستخدمون', headers: ['رقم المستخدم', 'اسم المستخدم', 'الاسم الكامل', 'الدور', 'الحالة'],
        rows: () => DB.all('users').map(u => [u.id, u.username, u.fullName, u.role, u.active ? 'مفعل' : 'معطل']) }
    };
    const def = defs[table];
    if (!def) return;
    if (!def.rows().length) { toast('لا توجد بيانات للتصدير', 'error'); return; }
    exportToCsv(def.name + '.csv', [def.headers].concat(def.rows()));
    toast('تم تصدير ' + def.name + ' إلى ملف Excel', 'success');
  };

  // ---------- استيراد من CSV ----------
  function parseCsv(text) {
    const lines = [];
    let row = [], field = '', inQuotes = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\r') { /* تجاهل */ }
        else if (ch === '\n') { row.push(field); lines.push(row); row = []; field = ''; }
        else field += ch;
      }
    }
    if (field.length || row.length) { row.push(field); lines.push(row); }
    return lines.filter(r => r.length && !(r.length === 1 && r[0] === ''));
  }

  const IMPORT_FIELDS = {
    patients: ['id', 'name', 'age', 'gender', 'phone', 'address', 'regDate'],
    doctors: ['id', 'name', 'specialty', 'departmentId', 'phone'],
    appointments: ['id', 'patientId', 'doctorId', 'specialty', 'date', 'time', 'status'],
    medicalRecords: ['id', 'patientId', 'doctorId', 'visitDate', 'diagnosis', 'symptoms', 'prescription', 'medications', 'tests', 'notes'],
    invoices: ['id', 'patientId', 'doctorId', 'date', 'status'],
    users: ['id', 'username', 'fullName', 'role', 'active']
  };

  App.importTable = function (table) {
    const fields = IMPORT_FIELDS[table];
    if (!fields) return;
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'text/csv,.csv';
    input.onchange = ev => {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = parseCsv(reader.result);
          if (data.length < 2) { toast('الملف فارغ أو بلا بيانات', 'error'); return; }
          const rows = data.slice(1).map(cells => {
            const obj = {};
            fields.forEach((f, i) => {
              let v = (cells[i] == null ? '' : cells[i]).toString().trim();
              if (f === 'age') v = parseInt(v, 10) || 0;
              if (f === 'active') v = (v === 'true' || v === 'مفعل');
              obj[f] = v;
            });
            return obj;
          });
          await DB.replaceAll(table, rows);
          toast('تم استيراد ' + rows.length + ' سجل إلى ' + table, 'success');
          navigate($('.nav-item.active').dataset.page);
        } catch (e) {
          toast('فشل الاستيراد: ' + e.message, 'error');
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  };

  let toastTimer;
  function toast(msg, type = '') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
  }

  function confirmDelete(name) {
    return confirm('هل أنت متأكد من حذف: ' + name + '؟');
  }

  // =========================================================
  //  نظام الصلاحيات
  // =========================================================
  const PERMISSIONS = {
    'مدير': ['dashboard', 'patients', 'doctors', 'departments', 'appointments', 'medical', 'invoices', 'reports', 'users'],
    'موظف استقبال': ['dashboard', 'patients', 'doctors', 'departments', 'appointments', 'invoices'],
    'طبيب': ['dashboard', 'patients', 'doctors', 'departments', 'appointments', 'medical'],
    'محاسب': ['dashboard', 'patients', 'doctors', 'departments', 'invoices', 'reports']
  };
  const ALL_PAGES = ['dashboard', 'patients', 'doctors', 'departments', 'appointments', 'medical', 'invoices', 'reports', 'users'];

  function currentUser() {
    return DB.me ? DB.me() : null;
  }

  function hasPermission(page) {
    const u = currentUser();
    if (!u) return false;
    const perms = PERMISSIONS[u.role] || PERMISSIONS['موظف استقبال'];
    return perms.includes(page);
  }

  function updateNavPermissions() {
    $$('.nav-item').forEach(b => {
      const page = b.dataset.page;
      b.style.display = hasPermission(page) ? '' : 'none';
    });
  }

  // =========================================================
  //  تسجيل الدخول
  // =========================================================
  function setupLogin() {
    $('#login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const u = $('#login-user').value.trim();
      const p = $('#login-pass').value;
      const err = $('#login-error');
      const btn = $('#login-form button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        const user = await DB.login(u, p);
        err.classList.remove('show');
        enterApp(user);
      } catch (ex) {
        err.textContent = ex.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
        err.classList.add('show');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function logout() {
    DB.logout();
    $('#app').classList.add('hidden');
    $('#login-screen').classList.remove('hidden');
    const lp = $('#login-pass'); if (lp) lp.value = '';
    $$('.nav-item').forEach(b => b.style.display = '');
  }

  // يُستدعى عند انتهاء الجلسة من طرف الخادم
  App.onUnauthorized = function () {
    toast('انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى', 'error');
    logout();
  };

  // ---------- تغيير كلمة المرور الخاصة بالمستخدم ----------
  App.changeMyPassword = function () {
    openModal('تغيير كلمة المرور', `
      <form id="change-pw-form">
        <div class="form-grid">
          <div class="field"><label>كلمة المرور الحالية</label>
            <div class="pw-field">
              <input id="pw-current" name="current" type="password" required />
              <button type="button" class="pw-toggle" onclick="App.togglePw('pw-current', this)" aria-label="إظهار/إخفاء كلمة المرور">${ic('eye')}</button>
            </div>
          </div>
          <div class="field"><label>كلمة المرور الجديدة</label>
            <div class="pw-field">
              <input id="pw-new" name="newpw" type="password" required />
              <button type="button" class="pw-toggle" onclick="App.togglePw('pw-new', this)" aria-label="إظهار/إخفاء كلمة المرور">${ic('eye')}</button>
            </div>
          </div>
          <div class="field"><label>تأكيد كلمة المرور الجديدة</label>
            <div class="pw-field">
              <input id="pw-confirm" name="confirm" type="password" required />
              <button type="button" class="pw-toggle" onclick="App.togglePw('pw-confirm', this)" aria-label="إظهار/إخفاء كلمة المرور">${ic('eye')}</button>
            </div>
          </div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`);
    $('#change-pw-form').addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const current = f.get('current'), np = f.get('newpw'), conf = f.get('confirm');
      if (np.length < 4) { toast('كلمة المرور الجديدة قصيرة جدًا (4 أحرف على الأقل)', 'error'); return; }
      if (np !== conf) { toast('كلمتا المرور الجديدتين غير متطابقتين', 'error'); return; }
      try {
        await DB.changePassword(current, np);
        closeModal(); toast('تم تغيير كلمة المرور بنجاح', 'success');
      } catch (ex) {
        toast(ex.message || 'فشل تغيير كلمة المرور', 'error');
      }
    });
  };

  function enterApp(user) {
    $('#login-screen').classList.add('hidden');
    $('#app').classList.remove('hidden');
    $('#user-mini').textContent = '👤 ' + user.fullName;
    $('#current-user').textContent = '👤 ' + user.fullName + ' (' + user.role + ')';
    updateNavPermissions();
    navigate('dashboard');
  }

  // =========================================================
  //  التنقل
  // =========================================================
  const titles = {
    dashboard: 'لوحة التحكم',
    patients: 'المرضى',
    doctors: 'الأطباء',
    departments: 'الأقسام',
    appointments: 'المواعيد',
    medical: 'الملفات الطبية',
    invoices: 'الفواتير',
    reports: 'التقارير',
    users: 'المستخدمون'
  };

  function navigate(page) {
    if (!hasPermission(page)) {
      $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
      $('#page-title').textContent = titles[page] || '';
      $('#page-content').innerHTML = `
        <div class="report-block" style="text-align:center;padding:60px 20px">
          <div style="font-size:48px;margin-bottom:16px">🔒</div>
          <h3>لا تملك صلاحية الوصول لهذه الصفحة</h3>
          <p style="margin-top:8px;opacity:.7">دورك الحالي: <b>${esc((currentUser() || {}).role || '-')}</b></p>
        </div>`;
      return;
    }
    $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $('#page-title').textContent = titles[page] || '';
    const content = $('#page-content');
    content.scrollTop = 0;
    ({
      dashboard: renderDashboard,
      patients: renderPatients,
      doctors: renderDoctors,
      departments: renderDepartments,
      appointments: renderAppointments,
      medical: renderMedical,
      invoices: renderInvoices,
      reports: renderReports,
      users: renderUsers
    })[page](content);
  }

  // =========================================================
  //  لوحة التحكم
  // =========================================================
  function renderDashboard(root) {
    const rev = DB.revenue();
    const cards = [
      { icon: 'patients', n: DB.count('patients'), label: 'عدد المرضى' },
      { icon: 'doctors', n: DB.count('doctors'), label: 'عدد الأطباء' },
      { icon: 'appointments', n: DB.count('appointments'), label: 'المواعيد' },
      { icon: 'medical', n: DB.count('medicalRecords'), label: 'الملفات الطبية' },
      { icon: 'invoices', n: DB.count('invoices'), label: 'الفواتير' },
      { icon: 'reports', n: fmtMoney(rev.paid), label: 'إيرادات مدفوعة' }
    ];
    root.innerHTML = `
      <div class="cards">
        ${cards.map(c => `
          <div class="stat-card">
            <div class="stat-icon">${ic(c.icon)}</div>
            <div class="stat-info"><h3>${esc(c.n)}</h3><p>${esc(c.label)}</p></div>
          </div>`).join('')}
      </div>
      <div class="report-block">
        <h4>📅 آخر المواعيد</h4>
        <div class="table-wrap">
          <table>
            <thead><tr><th>المريض</th><th>الطبيب</th><th>التخصص</th><th>التاريخ</th><th>الوقت</th><th>الحالة</th></tr></thead>
            <tbody>
              ${DB.all('appointments').slice(-5).reverse().map(a => `
                <tr>
                  <td>${esc(DB.patientName(a.patientId))}</td>
                  <td>${esc(DB.doctorName(a.doctorId))}</td>
                  <td>${esc(a.specialty)}</td>
                  <td>${esc(a.date)}</td>
                  <td>${esc(a.time)}</td>
                  <td>${statusBadge(a.status)}</td>
                </tr>`).join('') || '<tr><td colspan="6" class="empty">لا توجد مواعيد</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // =========================================================
  //  المرضى
  // =========================================================
  function renderPatients(root, filter = '') {
    const filterRows = f => DB.all('patients').filter(p =>
      !f || p.name.includes(f) || p.id.includes(f) || p.phone.includes(f));
    const rowsHTML = list => list.map(p => `
              <tr>
                <td>${esc(p.id)}</td><td>${esc(p.name)}</td><td>${esc(p.age)}</td>
                <td>${esc(p.gender)}</td><td>${esc(p.phone)}</td><td>${esc(p.address)}</td>
                <td>${esc(p.regDate)}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-outline" onclick="App.viewPatient('${p.id}')">الملف الطبي</button>
                    <button class="btn btn-sm btn-warning" onclick="App.editPatient('${p.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delPatient('${p.id}')">حذف</button>
                  </div>
                </td>
              </tr>`).join('') || '<tr><td colspan="8" class="empty">لا يوجد مرضى</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr>
            <th>رقم المريض</th><th>الاسم</th><th>العمر</th><th>الجنس</th>
            <th>الهاتف</th><th>العنوان</th><th>تاريخ التسجيل</th><th>الإجراءات</th>
          </tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="section-head">
        <h3>👤 إدارة المرضى</h3>
        <button class="btn btn-primary" onclick="App.addPatient()">➕ إضافة مريض</button>
      </div>
      <div class="toolbar">
        <input id="patient-search" placeholder="🔍 بحث بالاسم أو الرقم أو الهاتف..." value="${esc(filter)}" />
        <button class="btn btn-outline btn-sm" onclick="App.exportTable('patients')">${ic('download')} تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="App.importTable('patients')">${ic('upload')} استيراد CSV</button>
      </div>
      <div class="table-wrap" id="patients-table">${tableHTML(filterRows(filter))}</div>`;
    const sug = () => acSuggestions(
      [].concat(DB.all('patients').map(p => p.name), DB.all('patients').map(p => p.id), DB.all('patients').map(p => p.phone)), ''
    );
    const redraw = f => { const c = root.querySelector('#patients-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    wireSearch('patient-search', sug, redraw);
  }

  function patientForm(p) {
    p = p || {};
    return `
      <form id="patient-form">
        <div class="form-grid">
          <div class="field"><label>اسم المريض</label><input name="name" required value="${esc(p.name || '')}" /></div>
          <div class="field"><label>العمر</label><input name="age" type="number" min="0" required value="${esc(p.age || '')}" /></div>
          <div class="field"><label>الجنس</label>
            <select name="gender">
              <option ${p.gender === 'ذكر' ? 'selected' : ''}>ذكر</option>
              <option ${p.gender === 'أنثى' ? 'selected' : ''}>أنثى</option>
            </select></div>
          <div class="field"><label>رقم الهاتف</label><input name="phone" value="${esc(p.phone || '')}" /></div>
          <div class="field full"><label>العنوان</label><input name="address" value="${esc(p.address || '')}" /></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  App.addPatient = function () {
    openModal('إضافة مريض', patientForm());
    $('#patient-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.insert('patients', {
        id: DB.genId('P', 'patients'),
        name: f.get('name'), age: f.get('age'), gender: f.get('gender'),
        phone: f.get('phone'), address: f.get('address'), regDate: DB.today()
      });
      closeModal(); toast('تمت إضافة المريض بنجاح', 'success'); renderPatients($('#page-content'));
    });
  };
  App.editPatient = function (id) {
    const p = DB.find('patients', id);
    openModal('تعديل مريض', patientForm(p));
    $('#patient-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.update('patients', id, {
        name: f.get('name'), age: f.get('age'), gender: f.get('gender'),
        phone: f.get('phone'), address: f.get('address')
      });
      closeModal(); toast('تم التعديل بنجاح', 'success'); renderPatients($('#page-content'));
    });
  };
  App.delPatient = function (id) {
    const p = DB.find('patients', id);
    if (!confirmDelete(p.name)) return;
    const used = DB.all('appointments').some(a => a.patientId === id) ||
      DB.all('medicalRecords').some(m => m.patientId === id) ||
      DB.all('invoices').some(i => i.patientId === id);
    if (used) { toast('لا يمكن الحذف، المريض مرتبط بسجلات أخرى', 'error'); return; }
    DB.remove('patients', id);
    toast('تم الحذف', 'success'); renderPatients($('#page-content'));
  };
  App.viewPatient = function (id) { navigate('medical'); setTimeout(() => App.openMedicalByPatient(id), 50); };

  // =========================================================
  //  الأطباء
  // =========================================================
  function renderDoctors(root, filter = '') {
    const filterRows = f => DB.all('doctors').filter(d =>
      !f || d.name.includes(f) || d.id.includes(f) || d.specialty.includes(f));
    const rowsHTML = list => list.map(d => `
              <tr>
                <td>${esc(d.id)}</td><td>${esc(d.name)}</td><td>${esc(d.specialty)}</td>
                <td>${esc(DB.deptName(d.departmentId))}</td><td>${esc(d.phone)}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-warning" onclick="App.editDoctor('${d.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delDoctor('${d.id}')">حذف</button>
                  </div>
                </td>
              </tr>`).join('') || '<tr><td colspan="6" class="empty">لا يوجد أطباء</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr><th>رقم الطبيب</th><th>الاسم</th><th>التخصص</th><th>القسم</th><th>الهاتف</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="section-head">
        <h3>👨‍⚕️ إدارة الأطباء</h3>
        <button class="btn btn-primary" onclick="App.addDoctor()">➕ إضافة طبيب</button>
      </div>
      <div class="toolbar">        <input id="doc-search" placeholder="🔍 بحث بالاسم أو التخصص..." value="${esc(filter)}" />
        <button class="btn btn-outline btn-sm" onclick="App.exportTable('doctors')">${ic('download')} تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="App.importTable('doctors')">${ic('upload')} استيراد CSV</button></div>
      <div class="table-wrap" id="doctors-table">${tableHTML(filterRows(filter))}</div>`;
    const sug = () => acSuggestions(
      [].concat(DB.all('doctors').map(d => d.name), DB.all('doctors').map(d => d.specialty)), ''
    );
    const redraw = f => { const c = root.querySelector('#doctors-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    wireSearch('doc-search', sug, redraw);
  }

  function doctorForm(d) {
    d = d || {};
    const depts = DB.all('departments').map(x => `<option value="${x.id}" ${d.departmentId === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    return `
      <form id="doc-form">
        <div class="form-grid">
          <div class="field"><label>اسم الطبيب</label><input name="name" required value="${esc(d.name || '')}" /></div>
          <div class="field"><label>التخصص</label><input name="specialty" required value="${esc(d.specialty || '')}" /></div>
          <div class="field"><label>القسم</label><select name="departmentId">${depts}</select></div>
          <div class="field"><label>رقم الهاتف</label><input name="phone" value="${esc(d.phone || '')}" /></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  App.addDoctor = function () {
    openModal('إضافة طبيب', doctorForm());
    $('#doc-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.insert('doctors', {
        id: DB.genId('D', 'doctors'), name: f.get('name'),
        specialty: f.get('specialty'), phone: f.get('phone'), departmentId: f.get('departmentId')
      });
      closeModal(); toast('تمت إضافة الطبيب', 'success'); renderDoctors($('#page-content'));
    });
  };
  App.editDoctor = function (id) {
    const d = DB.find('doctors', id);
    openModal('تعديل طبيب', doctorForm(d));
    $('#doc-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.update('doctors', id, {
        name: f.get('name'), specialty: f.get('specialty'),
        phone: f.get('phone'), departmentId: f.get('departmentId')
      });
      closeModal(); toast('تم التعديل', 'success'); renderDoctors($('#page-content'));
    });
  };
  App.delDoctor = function (id) {
    const d = DB.find('doctors', id);
    if (!confirmDelete(d.name)) return;
    if (DB.all('appointments').some(a => a.doctorId === id) ||
        DB.all('medicalRecords').some(m => m.doctorId === id) ||
        DB.all('invoices').some(i => i.doctorId === id)) {
      toast('لا يمكن الحذف، الطبيب مرتبط بسجلات', 'error'); return;
    }
    DB.remove('doctors', id);
    toast('تم الحذف', 'success'); renderDoctors($('#page-content'));
  };

  // =========================================================
  //  الأقسام
  // =========================================================
  function renderDepartments(root, filter = '') {
    const filterRows = f => DB.all('departments').filter(d =>
      !f || d.name.includes(f) || d.id.includes(f));
    const rowsHTML = list => list.map(d => {
      const docCount = DB.all('doctors').filter(x => x.departmentId === d.id).length;
      return `
              <tr>
                <td>${esc(d.id)}</td><td>${esc(d.name)}</td>
                <td>${docCount}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-warning" onclick="App.editDepartment('${d.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delDepartment('${d.id}')">حذف</button>
                  </div>
                </td>
              </tr>`;
    }).join('') || '<tr><td colspan="4" class="empty">لا توجد أقسام</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr><th>رقم القسم</th><th>اسم القسم</th><th>عدد الأطباء</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="section-head">
        <h3>🏥 إدارة الأقسام</h3>
        <button class="btn btn-primary" onclick="App.addDepartment()">➕ إضافة قسم</button>
      </div>
      <div class="toolbar">
        <input id="dept-search" placeholder="🔍 بحث باسم القسم..." value="${esc(filter)}" />
      </div>
      <div class="table-wrap" id="departments-table">${tableHTML(filterRows(filter))}</div>`;
    const redraw = f => { const c = root.querySelector('#departments-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    const input = $('#dept-search');
    if (input) input.addEventListener('input', () => redraw(input.value.trim()));
  }

  function departmentForm(d) {
    d = d || {};
    return `
      <form id="dept-form">
        <div class="form-grid">
          <div class="field full"><label>اسم القسم</label><input name="name" required value="${esc(d.name || '')}" /></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  App.addDepartment = function () {
    openModal('إضافة قسم', departmentForm());
    $('#dept-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = f.get('name').trim();
      if (DB.all('departments').some(d => d.name === name)) { toast('هذا القسم موجود بالفعل', 'error'); return; }
      DB.insert('departments', { id: DB.genId('DEP', 'departments'), name });
      closeModal(); toast('تمت إضافة القسم', 'success'); renderDepartments($('#page-content'));
    });
  };

  App.editDepartment = function (id) {
    const d = DB.find('departments', id);
    openModal('تعديل قسم', departmentForm(d));
    $('#dept-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.update('departments', id, { name: f.get('name').trim() });
      closeModal(); toast('تم التعديل', 'success'); renderDepartments($('#page-content'));
    });
  };

  App.delDepartment = function (id) {
    const d = DB.find('departments', id);
    if (DB.all('doctors').some(x => x.departmentId === id)) {
      toast('لا يمكن الحذف، يوجد أطباء في هذا القسم', 'error'); return;
    }
    if (!confirmDelete(d.name)) return;
    DB.remove('departments', id);
    toast('تم الحذف', 'success'); renderDepartments($('#page-content'));
  };

  // =========================================================
  //  المواعيد
  // =========================================================
  function renderAppointments(root, filter = '') {
    const filterRows = f => DB.all('appointments').filter(a =>
      !f || DB.patientName(a.patientId).includes(f) ||
      DB.doctorName(a.doctorId).includes(f) || a.status.includes(f));
    const rowsHTML = list => list.map(a => `
              <tr>
                <td>${esc(a.id)}</td><td>${esc(DB.patientName(a.patientId))}</td>
                <td>${esc(DB.doctorName(a.doctorId))}</td><td>${esc(a.specialty)}</td>
                <td>${esc(a.date)}</td><td>${esc(a.time)}</td>
                <td>${statusBadge(a.status)}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-warning" onclick="App.editAppointment('${a.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delAppointment('${a.id}')">حذف</button>
                  </div>
                </td>
              </tr>`).join('') || '<tr><td colspan="8" class="empty">لا توجد مواعيد</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr><th>رقم الموعد</th><th>المريض</th><th>الطبيب</th><th>التخصص</th><th>التاريخ</th><th>الوقت</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="section-head">
        <h3>📅 إدارة المواعيد</h3>
        <button class="btn btn-primary" onclick="App.addAppointment()">➕ حجز موعد</button>
      </div>
      <div class="toolbar"><input id="ap-search" placeholder="🔍 بحث بالمريض أو الطبيب أو الحالة..." value="${esc(filter)}" />
        <button class="btn btn-outline btn-sm" onclick="App.exportTable('appointments')">${ic('download')} تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="App.importTable('appointments')">${ic('upload')} استيراد CSV</button></div>
      <div class="table-wrap" id="appointments-table">${tableHTML(filterRows(filter))}</div>`;
    const sug = () => acSuggestions(
      [].concat(DB.all('appointments').map(a => DB.patientName(a.patientId)),
                DB.all('appointments').map(a => DB.doctorName(a.doctorId)),
                DB.all('appointments').map(a => a.status)), ''
    );
    const redraw = f => { const c = root.querySelector('#appointments-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    wireSearch('ap-search', sug, redraw);
  }

  function appointmentForm(a) {
    a = a || {};
    const patOpts = DB.all('patients').map(p => `<option value="${p.id}" ${a.patientId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const docOpts = DB.all('doctors').map(d => `<option value="${d.id}" ${a.doctorId === d.id ? 'selected' : ''}>${esc(d.name)} (${esc(d.specialty)})</option>`).join('');
    return `
      <form id="ap-form">
        <div class="form-grid">
          <div class="field"><label>المريض</label><select name="patientId" required>${patOpts}</select></div>
          <div class="field"><label>الطبيب</label><select name="doctorId" required>${docOpts}</select></div>
          <div class="field"><label>التخصص</label><input name="specialty" value="${esc(a.specialty || '')}" /></div>
          <div class="field"><label>التاريخ</label><input name="date" value="${esc(a.date || DB.today())}" /></div>
          <div class="field"><label>الوقت</label><input name="time" value="${esc(a.time || '10:00 صباحًا')}" /></div>
          <div class="field"><label>الحالة</label>
            <select name="status">
              ${['محجوز', 'مكتمل', 'ملغي'].map(s => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  App.addAppointment = function () {
    openModal('حجز موعد جديد', appointmentForm());
    $('#ap-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const doc = DB.find('doctors', f.get('doctorId'));
      DB.insert('appointments', {
        id: DB.genId('A', 'appointments'),
        patientId: f.get('patientId'), doctorId: f.get('doctorId'),
        specialty: doc ? doc.specialty : f.get('specialty'),
        date: f.get('date'), time: f.get('time'), status: f.get('status')
      });
      closeModal(); toast('تم حجز الموعد', 'success'); renderAppointments($('#page-content'));
    });
  };
  App.editAppointment = function (id) {
    const a = DB.find('appointments', id);
    openModal('تعديل موعد', appointmentForm(a));
    $('#ap-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const doc = DB.find('doctors', f.get('doctorId'));
      DB.update('appointments', id, {
        patientId: f.get('patientId'), doctorId: f.get('doctorId'),
        specialty: doc ? doc.specialty : f.get('specialty'),
        date: f.get('date'), time: f.get('time'), status: f.get('status')
      });
      closeModal(); toast('تم التعديل', 'success'); renderAppointments($('#page-content'));
    });
  };
  App.delAppointment = function (id) {
    const a = DB.find('appointments', id);
    if (!confirmDelete('الموعد')) return;
    DB.remove('appointments', id);
    toast('تم الحذف', 'success'); renderAppointments($('#page-content'));
  };

  // =========================================================
  //  الملفات الطبية
  // =========================================================
  function renderMedical(root, filter = '', openId = null) {
    const filterRows = f => DB.all('medicalRecords').filter(m =>
      !f || DB.patientName(m.patientId).includes(f) ||
      DB.doctorName(m.doctorId).includes(f) || m.diagnosis.includes(f));
    const rowsHTML = list => list.map(m => `
              <tr>
                <td>${esc(m.id)}</td><td>${esc(DB.patientName(m.patientId))}</td>
                <td>${esc(DB.doctorName(m.doctorId))}</td><td>${esc(m.visitDate)}</td>
                <td>${esc(m.diagnosis)}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-outline" onclick="App.openMedical('${m.id}')">عرض</button>
                    <button class="btn btn-sm btn-warning" onclick="App.editMedical('${m.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delMedical('${m.id}')">حذف</button>
                  </div>
                </td>
              </tr>`).join('') || '<tr><td colspan="6" class="empty">لا توجد سجلات طبية</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr><th>رقم السجل</th><th>المريض</th><th>الطبيب</th><th>تاريخ الزيارة</th><th>التشخيص</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="report-block" style="border-right:4px solid #f59e0b;background:rgba(245,158,11,.08);padding:10px 14px;margin-bottom:14px;border-radius:8px">
        🔒 <b>بيانات طبية محمية:</b> هذه الصفحة مخصصة للأطباء والمديرين فقط. أي محاولة وصول أو تصدير يتم تقييده تلقائيًا حسب صلاحيات دورك.
      </div>
      <div class="section-head">
        <h3>📋 الملفات الطبية</h3>
        <button class="btn btn-primary" onclick="App.addMedical()">➕ إضافة سجل</button>
      </div>
      <div class="toolbar"><input id="med-search" placeholder="🔍 بحث بالمريض أو التشخيص..." value="${esc(filter)}" />
        <button class="btn btn-outline btn-sm" onclick="App.exportTable('medicalRecords')">${ic('download')} تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="App.importTable('medicalRecords')">${ic('upload')} استيراد CSV</button></div>
      <div class="table-wrap" id="medical-table">${tableHTML(filterRows(filter))}</div>`;
    const sug = () => acSuggestions(
      [].concat(DB.all('medicalRecords').map(m => DB.patientName(m.patientId)),
                DB.all('medicalRecords').map(m => m.diagnosis)), ''
    );
    const redraw = f => { const c = root.querySelector('#medical-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    wireSearch('med-search', sug, redraw);
    if (openId) App.openMedical(openId);
  }

  function medicalForm(m) {
    m = m || {};
    const patOpts = DB.all('patients').map(p => `<option value="${p.id}" ${m.patientId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const docOpts = DB.all('doctors').map(d => `<option value="${d.id}" ${m.doctorId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
    return `
      <form id="med-form">
        <div class="form-grid">
          <div class="field"><label>المريض</label><select name="patientId" required>${patOpts}</select></div>
          <div class="field"><label>الطبيب</label><select name="doctorId" required>${docOpts}</select></div>
          <div class="field"><label>تاريخ الزيارة</label><input name="visitDate" value="${esc(m.visitDate || DB.today())}" /></div>
          <div class="field full"><label>التشخيص</label><textarea name="diagnosis">${esc(m.diagnosis || '')}</textarea></div>
          <div class="field full"><label>الأعراض</label><textarea name="symptoms">${esc(m.symptoms || '')}</textarea></div>
          <div class="field full"><label>وصف الطبيب (العلاج)</label><textarea name="prescription">${esc(m.prescription || '')}</textarea></div>
          <div class="field full"><label>الأدوية</label><textarea name="medications">${esc(m.medications || '')}</textarea></div>
          <div class="field full"><label>نتائج الفحوصات</label><textarea name="tests">${esc(m.tests || '')}</textarea></div>
          <div class="field full"><label>الملاحظات</label><textarea name="notes">${esc(m.notes || '')}</textarea></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  function medicalDetail(m) {
    return `
      <div class="detail-section">
        <div class="detail-grid">
          <div><b>المريض:</b> ${esc(DB.patientName(m.patientId))}</div>
          <div><b>الطبيب:</b> ${esc(DB.doctorName(m.doctorId))}</div>
          <div><b>تاريخ الزيارة:</b> ${esc(m.visitDate)}</div>
          <div><b>رقم السجل:</b> ${esc(m.id)}</div>
        </div>
      </div>
      <div class="detail-section">
        <h4>📝 تفاصيل الزيارة</h4>
        <div class="detail-grid">
          <div style="grid-column:1/-1"><b>التشخيص:</b> ${esc(m.diagnosis || '-')}</div>
          <div style="grid-column:1/-1"><b>الأعراض:</b> ${esc(m.symptoms || '-')}</div>
          <div style="grid-column:1/-1"><b>وصف الطبيب (العلاج):</b> ${esc(m.prescription || '-')}</div>
          <div style="grid-column:1/-1"><b>الأدوية:</b> ${esc(m.medications || '-')}</div>
          <div style="grid-column:1/-1"><b>نتائج الفحوصات:</b> ${esc(m.tests || '-')}</div>
          <div style="grid-column:1/-1"><b>الملاحظات:</b> ${esc(m.notes || '-')}</div>
        </div>
      </div>
      <div class="field-row">
        <button class="btn btn-warning" onclick="App.editMedical('${m.id}')">تعديل السجل</button>
        <button class="btn btn-outline" onclick="App.closeModal()">إغلاق</button>
      </div>`;
  }

  App.addMedical = function () {
    openModal('إضافة سجل طبي', medicalForm());
    $('#med-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.insert('medicalRecords', {
        id: DB.genId('MR', 'medicalRecords'),
        patientId: f.get('patientId'), doctorId: f.get('doctorId'),
        visitDate: f.get('visitDate'), diagnosis: f.get('diagnosis'),
        symptoms: f.get('symptoms'), prescription: f.get('prescription'),
        medications: f.get('medications'), tests: f.get('tests'), notes: f.get('notes')
      });
      closeModal(); toast('تمت إضافة السجل', 'success'); renderMedical($('#page-content'));
    });
  };
  App.openMedical = function (id) {
    const m = DB.find('medicalRecords', id);
    openModal('ملف طبي - ' + DB.patientName(m.patientId), medicalDetail(m));
  };
  App.openMedicalByPatient = function (pid) {
    const m = DB.all('medicalRecords').filter(x => x.patientId === pid).pop();
    if (m) App.openMedical(m.id);
    else toast('لا يوجد ملف طبي لهذا المريض', 'error');
  };
  App.editMedical = function (id) {
    const m = DB.find('medicalRecords', id);
    openModal('تعديل سجل طبي', medicalForm(m));
    $('#med-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.update('medicalRecords', id, {
        patientId: f.get('patientId'), doctorId: f.get('doctorId'),
        visitDate: f.get('visitDate'), diagnosis: f.get('diagnosis'),
        symptoms: f.get('symptoms'), prescription: f.get('prescription'),
        medications: f.get('medications'), tests: f.get('tests'), notes: f.get('notes')
      });
      closeModal(); toast('تم التعديل', 'success'); renderMedical($('#page-content'));
    });
  };
  App.delMedical = function (id) {
    if (!confirmDelete('السجل الطبي')) return;
    DB.remove('medicalRecords', id);
    toast('تم الحذف', 'success'); renderMedical($('#page-content'));
  };

  App.closeModal = closeModal;
  App.toast = toast;

  App.togglePw = function (inputId, btn) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    btn.innerHTML = show ? ic('eyeOff') : ic('eye');
  };

  // =========================================================
  //  الفواتير
  // =========================================================
  function renderInvoices(root, filter = '') {
    const filterRows = f => DB.all('invoices').filter(inv =>
      !f || inv.id.includes(f) || DB.patientName(inv.patientId).includes(f) || inv.status.includes(f));
    const rowsHTML = list => list.map(inv => `
              <tr>
                <td>${esc(inv.id)}</td><td>${esc(DB.patientName(inv.patientId))}</td>
                <td>${esc(DB.doctorName(inv.doctorId))}</td><td>${esc(inv.date)}</td>
                <td>${fmtMoney(DB.invoiceTotal(inv.id))}</td>
                <td>${statusBadge(inv.status)}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-outline" onclick="App.openInvoice('${inv.id}')">عرض</button>
                    <button class="btn btn-sm btn-warning" onclick="App.editInvoice('${inv.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delInvoice('${inv.id}')">حذف</button>
                  </div>
                </td>
              </tr>`).join('') || '<tr><td colspan="7" class="empty">لا توجد فواتير</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr><th>رقم الفاتورة</th><th>المريض</th><th>الطبيب</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="section-head">
        <h3>💰 الفواتير</h3>
        <button class="btn btn-primary" onclick="App.addInvoice()">➕ إنشاء فاتورة</button>
      </div>
      <div class="toolbar"><input id="inv-search" placeholder="🔍 بحث برقم الفاتورة أو المريض..." value="${esc(filter)}" />
        <button class="btn btn-outline btn-sm" onclick="App.exportTable('invoices')">${ic('download')} تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="App.importTable('invoices')">${ic('upload')} استيراد CSV</button></div>
      <div id="daily-summary"></div>
      <div class="table-wrap" id="invoices-table">${tableHTML(filterRows(filter))}</div>`;
    const sug = () => acSuggestions(
      [].concat(DB.all('invoices').map(i => i.id), DB.all('invoices').map(i => DB.patientName(i.patientId))), ''
    );
    const redraw = f => { const c = root.querySelector('#invoices-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    wireSearch('inv-search', sug, redraw);

    // ملخص المبالغ اليومية
    const byDate = {};
    DB.all('invoices').forEach(inv => {
      const d = inv.date || '-';
      byDate[d] = (byDate[d] || 0) + DB.invoiceTotal(inv.id);
    });
    const sortedDates = Object.keys(byDate).sort((a, b) => {
      const pa = a.split('/'), pb = b.split('/');
      return new Date(pb[2], pb[1] - 1, pb[0]) - new Date(pa[2], pa[1] - 1, pa[0]);
    });
    const todayStr = DB.today();
    const todayTotal = byDate[todayStr] || 0;
    const totalAll = Object.values(byDate).reduce((s, v) => s + v, 0);
    const dailyRows = sortedDates.slice(0, 10).map(d => `
      <tr${d === todayStr ? ' style="font-weight:700;background:rgba(16,185,129,.12)"' : ''}>
        <td>${esc(d)}${d === todayStr ? ' ⭐' : ''}</td>
        <td>${fmtMoney(byDate[d])}</td>
      </tr>`).join('') || '<tr><td colspan="2" class="empty">لا توجد فواتير</td></tr>';
    const dailyHTML = `
      <div class="report-block">
        <h4>📅 المبالغ اليومية للفواتير</h4>
        <div class="cards" style="margin-bottom:12px">
          <div class="stat-card"><div class="stat-icon">${ic('invoices')}</div><div class="stat-info"><h3>${fmtMoney(todayTotal)}</h3><p>إجمالي فواتير اليوم</p></div></div>
          <div class="stat-card"><div class="stat-icon">${ic('reports')}</div><div class="stat-info"><h3>${fmtMoney(totalAll)}</h3><p>إجمالي جميع الفواتير</p></div></div>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>التاريخ</th><th>المبلغ اليومي</th></tr></thead><tbody>${dailyRows}</tbody></table>
        </div>
      </div>`;
    root.querySelector('#daily-summary').innerHTML = dailyHTML;
  }

  function invoiceForm(inv) {
    inv = inv || {};
    const patOpts = DB.all('patients').map(p => `<option value="${p.id}" ${inv.patientId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    const docOpts = DB.all('doctors').map(d => `<option value="${d.id}" ${inv.doctorId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('');
    const currentAmount = inv.id ? DB.invoiceTotal(inv.id) : '';
    return `
      <form id="inv-form">
        <div class="form-grid">
          <div class="field"><label>المريض</label><select name="patientId" required>${patOpts}</select></div>
          <div class="field"><label>الطبيب</label><select name="doctorId" required>${docOpts}</select></div>
          <div class="field"><label>التاريخ</label><input name="date" value="${esc(inv.date || DB.today())}" /></div>
          <div class="field"><label>المبلغ (جنيه)</label><input name="amount" type="number" min="0" step="any" required value="${esc(currentAmount)}" placeholder="مثال: 20000" /></div>
          <div class="field"><label>حالة الدفع</label>
            <select name="status">
              ${['مدفوع', 'غير مدفوع'].map(s => `<option ${inv.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  function invoiceDetail(inv) {
    const items = DB.all('invoiceItems').filter(i => i.invoiceId === inv.id);
    const rows = items.length ? items.map(i => `
      <tr><td>${esc(i.service)}</td><td>${fmtMoney(i.amount)}</td></tr>`).join('')
      : '<tr><td colspan="2" class="empty">لا توجد خدمات</td></tr>';
    const total = DB.invoiceTotal(inv.id);
    return `
      <div class="detail-section">
        <div class="detail-grid">
          <div><b>رقم الفاتورة:</b> ${esc(inv.id)}</div>
          <div><b>المريض:</b> ${esc(DB.patientName(inv.patientId))}</div>
          <div><b>الطبيب:</b> ${esc(DB.doctorName(inv.doctorId))}</div>
          <div><b>التاريخ:</b> ${esc(inv.date)}</div>
          <div><b>الحالة:</b> ${statusBadge(inv.status)}</div>
        </div>
      </div>
      <div class="detail-section">
        <h4>🧾 تفاصيل الخدمات</h4>
        <div class="table-wrap">
          <table><thead><tr><th>الخدمة</th><th>المبلغ</th></tr></thead>
          <tbody>${rows}
            <tr style="font-weight:700"><td>الإجمالي</td><td>${fmtMoney(total)}</td></tr>
          </tbody></table>
        </div>
      </div>
      <div class="field-row">
        <button class="btn btn-warning" onclick="App.editInvoice('${inv.id}')">تعديل الفاتورة</button>
        <button class="btn btn-outline" onclick="App.closeModal()">إغلاق</button>
      </div>`;
  }

  App.addInvoice = function () {
    openModal('إنشاء فاتورة', invoiceForm());
    $('#inv-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const id = DB.genId('INV', 'invoices');
      const amount = Number(f.get('amount')) || 0;
      DB.insert('invoices', {
        id, patientId: f.get('patientId'), doctorId: f.get('doctorId'),
        date: f.get('date'), status: f.get('status')
      });
      DB.insert('invoiceItems', { id: DB.genId('II', 'invoiceItems'), invoiceId: id, service: 'كشف طبي', amount });
      closeModal(); toast('تم إنشاء الفاتورة', 'success'); renderInvoices($('#page-content'));
    });
  };
  App.openInvoice = function (id) {
    const inv = DB.find('invoices', id);
    openModal('فاتورة ' + inv.id, invoiceDetail(inv));
  };
  App.editInvoice = function (id) {
    const inv = DB.find('invoices', id);
    openModal('تعديل فاتورة', invoiceForm(inv));
    $('#inv-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.update('invoices', id, {
        patientId: f.get('patientId'), doctorId: f.get('doctorId'),
        date: f.get('date'), status: f.get('status')
      });
      const amount = Number(f.get('amount')) || 0;
      const existing = DB.all('invoiceItems').filter(i => i.invoiceId === id);
      if (existing.length) {
        DB.update('invoiceItems', existing[0].id, { amount });
        existing.slice(1).forEach(i => DB.remove('invoiceItems', i.id));
      } else {
        DB.insert('invoiceItems', { id: DB.genId('II', 'invoiceItems'), invoiceId: id, service: 'كشف طبي', amount });
      }
      closeModal(); toast('تم التعديل', 'success'); renderInvoices($('#page-content'));
    });
  };
  App.delInvoice = function (id) {
    if (!confirmDelete('الفاتورة')) return;
    DB.all('invoiceItems').filter(i => i.invoiceId === id).forEach(i => DB.remove('invoiceItems', i.id));
    DB.remove('invoices', id);
    toast('تم الحذف', 'success'); renderInvoices($('#page-content'));
  };

  // =========================================================
  //  التقارير
  // =========================================================
  function renderReports(root) {
    const rev = DB.revenue();
    const todayStr = DB.today();

    // ---- الإيرادات اليومية ----
    const byDate = {};
    DB.all('invoices').forEach(inv => {
      const d = inv.date || '-';
      byDate[d] = (byDate[d] || 0) + DB.invoiceTotal(inv.id);
    });
    const todayRev = byDate[todayStr] || 0;
    const allDates = Object.keys(byDate).sort((a, b) => {
      const pa = a.split('/'), pb = b.split('/');
      return new Date(pb[2], pb[1] - 1, pb[0]) - new Date(pa[2], pa[1] - 1, pa[0]);
    });
    const weekRev = allDates.slice(0, 7).reduce((s, d) => s + byDate[d], 0);
    const now = new Date();
    const monthPrefix = String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
    const monthRev = Object.keys(byDate).filter(d => d.endsWith(monthPrefix)).reduce((s, d) => s + byDate[d], 0);

    // ---- أداء العيادات (حسب القسم) ----
    const deptStats = {};
    DB.all('departments').forEach(dep => { deptStats[dep.id] = { name: dep.name, docs: 0, appts: 0, done: 0, revenue: 0 }; });
    DB.all('doctors').forEach(d => { if (deptStats[d.departmentId]) deptStats[d.departmentId].docs++; });
    DB.all('appointments').forEach(a => {
      const doc = DB.find('doctors', a.doctorId);
      if (doc && deptStats[doc.departmentId]) {
        deptStats[doc.departmentId].appts++;
        if (a.status === 'مكتمل') deptStats[doc.departmentId].done++;
      }
    });
    DB.all('invoices').forEach(inv => {
      const doc = DB.find('doctors', inv.doctorId);
      if (doc && deptStats[doc.departmentId]) deptStats[doc.departmentId].revenue += DB.invoiceTotal(inv.id);
    });
    const deptPerfRows = Object.values(deptStats).map(s => {
      const rate = s.appts ? Math.round((s.done / s.appts) * 100) : 0;
      const bar = `<div style="background:#e5e7eb;border-radius:6px;height:8px;width:80px;display:inline-block;vertical-align:middle"><div style="background:${rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444'};height:8px;border-radius:6px;width:${rate}%"></div></div> <small>${rate}%</small>`;
      return `<tr>
        <td>${esc(s.name)}</td><td>${s.docs}</td><td>${s.appts}</td>
        <td>${s.done}</td><td>${bar}</td><td>${fmtMoney(s.revenue)}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="empty">لا توجد بيانات</td></tr>';

    // ---- نسبة إشغال الأطباء ----
    const DAILY_CAPACITY = 8;
    const docStats = DB.all('doctors').map(doc => {
      const appts = DB.all('appointments').filter(a => a.doctorId === doc.id);
      const todayCount = appts.filter(a => a.date === todayStr).length;
      const done = appts.filter(a => a.status === 'مكتمل').length;
      const occupancy = Math.min(100, Math.round((todayCount / DAILY_CAPACITY) * 100));
      const completion = appts.length ? Math.round((done / appts.length) * 100) : 0;
      return { name: doc.name, specialty: doc.specialty, today: todayCount, total: appts.length, occupancy, completion };
    });
    const docOccRows = docStats.map(s => {
      const color = s.occupancy >= 80 ? '#ef4444' : s.occupancy >= 50 ? '#f59e0b' : '#10b981';
      return `<tr>
        <td>${esc(s.name)}</td><td>${esc(s.specialty)}</td>
        <td>${s.today} / ${DAILY_CAPACITY}</td>
        <td><div style="background:#e5e7eb;border-radius:6px;height:8px;width:80px;display:inline-block;vertical-align:middle"><div style="background:${color};height:8px;border-radius:6px;width:${s.occupancy}%"></div></div> <small>${s.occupancy}%</small></td>
        <td>${s.completion}%</td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" class="empty">لا يوجد أطباء</td></tr>';

    // ---- المواعيد حسب التخصص ----
    const byDept = {};
    DB.all('appointments').forEach(a => {
      const dep = (DB.find('doctors', a.doctorId) || {}).specialty || '-';
      byDept[dep] = (byDept[dep] || 0) + 1;
    });
    const deptRows = Object.keys(byDept).length
      ? Object.entries(byDept).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('')
      : '<tr><td colspan="2" class="empty">لا توجد بيانات</td></tr>';

    // ---- حالات المواعيد ----
    const statusCount = { 'محجوز': 0, 'مكتمل': 0, 'ملغي': 0 };
    DB.all('appointments').forEach(a => { if (statusCount[a.status] != null) statusCount[a.status]++; });
    const statusRows = Object.entries(statusCount).map(([k, v]) =>
      `<tr><td>${statusBadge(k)}</td><td>${v}</td></tr>`).join('');

    // ---- آخر المبالغ اليومية ----
    const dailyRows = allDates.slice(0, 7).map(d => `
      <tr${d === todayStr ? ' style="font-weight:700;background:rgba(16,185,129,.12)"' : ''}>
        <td>${esc(d)}${d === todayStr ? ' ⭐' : ''}</td><td>${fmtMoney(byDate[d])}</td>
      </tr>`).join('') || '<tr><td colspan="2" class="empty">لا توجد فواتير</td></tr>';

    root.innerHTML = `
      <div class="cards">
        <div class="stat-card"><div class="stat-icon">${ic('invoices')}</div><div class="stat-info"><h3>${fmtMoney(todayRev)}</h3><p>إيرادات اليوم ⭐</p></div></div>
        <div class="stat-card"><div class="stat-icon">${ic('reports')}</div><div class="stat-info"><h3>${fmtMoney(weekRev)}</h3><p>إيرادات آخر 7 أيام</p></div></div>
        <div class="stat-card"><div class="stat-icon">${ic('appointments')}</div><div class="stat-info"><h3>${fmtMoney(monthRev)}</h3><p>إيرادات الشهر الحالي</p></div></div>
        <div class="stat-card"><div class="stat-icon">${ic('dashboard')}</div><div class="stat-info"><h3>${fmtMoney(rev.total)}</h3><p>إجمالي الفواتير</p></div></div>
        <div class="stat-card"><div class="stat-icon">${ic('patients')}</div><div class="stat-info"><h3>${fmtMoney(rev.paid)}</h3><p>مدفوع</p></div></div>
        <div class="stat-card"><div class="stat-icon">${ic('users')}</div><div class="stat-info"><h3>${fmtMoney(rev.unpaid)}</h3><p>غير مدفوع</p></div></div>
      </div>

      <div class="report-block">
        <h4>🏥 أداء العيادات (حسب القسم)</h4>
        <div class="table-wrap">
          <table>
            <thead><tr><th>القسم</th><th>الأطباء</th><th>المواعيد</th><th>مكتملة</th><th>نسبة الإنجاز</th><th>الإيراد</th></tr></thead>
            <tbody>${deptPerfRows}</tbody>
          </table>
        </div>
      </div>

      <div class="report-block">
        <h4>👨‍⚕️ نسبة إشغال الأطباء (اليوم)</h4>
        <div class="table-wrap">
          <table>
            <thead><tr><th>الطبيب</th><th>التخصص</th><th>مواعيد اليوم</th><th>نسبة الإشغال</th><th>نسبة الإنجاز</th></tr></thead>
            <tbody>${docOccRows}</tbody>
          </table>
        </div>
      </div>

      <div class="report-block">
        <h4>💰 الإيرادات اليومية</h4>
        <div class="table-wrap">
          <table>
            <thead><tr><th>التاريخ</th><th>المبلغ</th></tr></thead>
            <tbody>${dailyRows}</tbody>
          </table>
        </div>
      </div>

      <div class="report-block">
        <h4>📊 المواعيد حسب التخصص</h4>
        <div class="table-wrap"><table><thead><tr><th>التخصص</th><th>عدد المواعيد</th></tr></thead><tbody>${deptRows}</tbody></table></div>
      </div>
      <div class="report-block">
        <h4>📈 توزيع حالات المواعيد</h4>
        <div class="table-wrap"><table><thead><tr><th>الحالة</th><th>العدد</th></tr></thead><tbody>${statusRows}</tbody></table></div>
      </div>
      <div class="report-block">
        <button class="btn btn-primary" onclick="App.resetData()">🔄 إعادة تعيين البيانات التجريبية</button>
      </div>`;
  }

  App.resetData = async function () {
    if (!confirm('سيتم حذف جميع البيانات الحالية وإرجاع البيانات التجريبية؟')) return;
    try {
      await DB.resetAll();
      toast('تمت استعادة البيانات التجريبية', 'success');
      navigate($('.nav-item.active').dataset.page);
    } catch (ex) {
      toast(ex.message || 'فشلت إعادة التعيين', 'error');
    }
  };

  // =========================================================
  //  المستخدمون
  // =========================================================
  function renderUsers(root, filter = '') {
    const filterRows = f => DB.all('users').filter(u =>
      !f || u.username.includes(f) || u.fullName.includes(f) || u.role.includes(f));
    const rowsHTML = list => list.map(u => `
              <tr>
                <td>${esc(u.id)}</td><td>${esc(u.username)}</td><td>${esc(u.fullName)}</td>
                <td>${esc(u.role)}</td>
                <td>${u.active ? statusBadge('مكتمل') : statusBadge('ملغي')}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-warning" onclick="App.editUser('${u.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="App.delUser('${u.id}')">حذف</button>
                  </div>
                </td>
              </tr>`).join('') || '<tr><td colspan="6" class="empty">لا يوجد مستخدمون</td></tr>';
    const tableHTML = list => `
        <table>
          <thead><tr><th>رقم المستخدم</th><th>اسم المستخدم</th><th>الاسم الكامل</th><th>الدور</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
          <tbody>${rowsHTML(list)}</tbody>
        </table>`;
    root.innerHTML = `
      <div class="section-head">
        <h3>👥 المستخدمون</h3>
        <button class="btn btn-primary" onclick="App.addUser()">➕ إضافة مستخدم</button>
      </div>
      <div class="toolbar"><input id="user-search" placeholder="🔍 بحث باسم المستخدم أو الدور..." value="${esc(filter)}" />
        <button class="btn btn-outline btn-sm" onclick="App.exportTable('users')">${ic('download')} تصدير Excel</button>
        <button class="btn btn-outline btn-sm" onclick="App.importTable('users')">${ic('upload')} استيراد CSV</button></div>
      <div class="table-wrap" id="users-table">${tableHTML(filterRows(filter))}</div>`;
    const sug = () => acSuggestions(
      [].concat(DB.all('users').map(u => u.username), DB.all('users').map(u => u.role)), ''
    );
    const redraw = f => { const c = root.querySelector('#users-table'); if (c) c.innerHTML = tableHTML(filterRows(f)); };
    wireSearch('user-search', sug, redraw);
  }

  function userForm(u, isNew) {
    u = u || {};
    return `
      <form id="user-form">
        <div class="form-grid">
          <div class="field"><label>اسم المستخدم</label><input name="username" required value="${esc(u.username || '')}" ${isNew ? '' : 'readonly'} /></div>
          <div class="field"><label>الاسم الكامل</label><input name="fullName" required value="${esc(u.fullName || '')}" /></div>
          <div class="field"><label>كلمة المرور ${isNew ? '' : '(اتركها فارغة للإبقاء)'}</label>
            <div class="pw-field">
              <input id="user-password" name="password" type="password" ${isNew ? 'required' : ''} />
              <button type="button" class="pw-toggle" onclick="App.togglePw('user-password', this)" aria-label="إظهار/إخفاء كلمة المرور">${ic('eye')}</button>
            </div>
          </div>
          <div class="field"><label>الدور</label>
            <select name="role">
              ${['مدير', 'موظف استقبال', 'طبيب', 'محاسب'].map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select></div>
          <div class="field"><label>الحالة</label>
            <select name="active">
              <option value="true" ${u.active !== false ? 'selected' : ''}>مفعل</option>
              <option value="false" ${u.active === false ? 'selected' : ''}>معطل</option>
            </select></div>
        </div>
        <div class="field-row">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>
        </div>
      </form>`;
  }

  App.addUser = function () {
    openModal('إضافة مستخدم', userForm(null, true));
    $('#user-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      DB.insert('users', {
        id: DB.genId('U', 'users'), username: f.get('username'),
        fullName: f.get('fullName'), password: f.get('password'),
        role: f.get('role'), active: f.get('active') === 'true'
      });
      closeModal(); toast('تمت إضافة المستخدم', 'success'); renderUsers($('#page-content'));
    });
  };
  App.editUser = function (id) {
    const u = DB.find('users', id);
    openModal('تعديل مستخدم', userForm(u, false));
    $('#user-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const upd = { fullName: f.get('fullName'), role: f.get('role'), active: f.get('active') === 'true' };
      if (f.get('password')) upd.password = f.get('password');
      DB.update('users', id, upd);
      closeModal(); toast('تم التعديل', 'success'); renderUsers($('#page-content'));
    });
  };
  App.delUser = function (id) {
    const u = DB.find('users', id);
    if (u.username === 'shootal') { toast('لا يمكن حذف المستخدم الرئيسي', 'error'); return; }
    if (!confirmDelete(u.username)) return;
    DB.remove('users', id);
    toast('تم الحذف', 'success'); renderUsers($('#page-content'));
  };

  // =========================================================
  //  التهيئة
  // =========================================================
  async function init() {
    setupLogin();

    // استبدال عناصر الأيقونات النائبة بـ SVG
    $$('.nav-ico').forEach(el => {
      const m = el.textContent.match(/\{IC:(\w+)\}/);
      if (m) el.innerHTML = ic(m[1]);
    });
    const tb = $('#toggle-sidebar');
    if (tb) { const m = tb.textContent.match(/\{IC:(\w+)\}/); if (m) tb.innerHTML = ic(m[1]); }
    const lb = document.querySelector('.pw-field .pw-toggle');
    if (lb) { const m = lb.textContent.match(/\{IC:(\w+)\}/); if (m) lb.innerHTML = ic(m[1]); }

    $$('.nav-item').forEach(b => b.addEventListener('click', () => navigate(b.dataset.page)));

    $('#modal-close').addEventListener('click', closeModal);
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    $('#logout-btn').addEventListener('click', logout);
    $('#change-pw-btn').addEventListener('click', App.changeMyPassword);
    $('#toggle-sidebar').addEventListener('click', () => {
      $('.sidebar').classList.toggle('collapsed');
      $('.sidebar').classList.toggle('open');
      $('.content').classList.toggle('expanded');
    });

    // محاولة استئناف الجلسة القائمة على الخادم
    try {
      const user = await DB.bootstrap();
      if (user) enterApp(user);
    } catch (e) {
      // لا توجد جلسة صالحة — تبقى شاشة تسجيل الدخول
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
