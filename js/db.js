/* =========================================================
   طبقة البيانات في الواجهة (عميل REST API)
   - لا تخزّن أي بيانات حساسة محليًا
   - تحديث فوري للواجهة + إرسال التعديلات للخادم
   الجداول: Departments, Doctors, Patients, Appointments,
   Medical_Records, Invoices, Invoice_Items, Users
   ========================================================= */
const DB = (function () {
  let state = {
    departments: [], doctors: [], patients: [], appointments: [],
    medicalRecords: [], invoices: [], invoiceItems: [], users: []
  };
  let me = null;

  // ---------- طلبات الشبكة ----------
  async function request(path, options = {}) {
    const opts = Object.assign({ credentials: 'same-origin' }, options);
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
      opts.body = JSON.stringify(opts.body);
    }
    let res;
    try {
      res = await fetch(path, opts);
    } catch (e) {
      const err = new Error('تعذّر الاتصال بالخادم');
      err.code = 0;
      throw err;
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* رد بلا JSON */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || 'حدث خطأ في الطلب');
      err.code = res.status;
      throw err;
    }
    return data;
  }

  // إرسال صامت للخادم مع تحديث محلي متفائل
  function persist(path, method, body) {
    request(path, { method, body })
      .catch(err => {
        if (err.code === 401 && window.App && App.onUnauthorized) App.onUnauthorized();
        else if (window.App && App.toast) App.toast(err.message, 'error');
      });
  }

  // ---------- المصادقة ----------
  async function bootstrap() {
    const res = await request('/api/me');
    if (!res || !res.user) return null;
    me = res.user;
    await loadAll();
    return me;
  }

  async function login(username, password) {
    const user = await request('/api/login', { method: 'POST', body: { username, password } });
    me = user;
    await loadAll();
    return user;
  }

  function logout() {
    persist('/api/logout', 'POST');
    me = null;
    state = { departments: [], doctors: [], patients: [], appointments: [], medicalRecords: [], invoices: [], invoiceItems: [], users: [] };
  }

  function changePassword(current, newPassword) {
    return request('/api/change-password', { method: 'POST', body: { current, newPassword } });
  }

  function me_() { return me; }

  async function loadAll() {
    const data = await request('/api/data');
    if (data) state = Object.assign(state, data);
    return state;
  }

  // ---------- أدوات مساعدة ----------
  function genId(prefix, table) {
    const list = state[table] || [];
    let max = 0;
    list.forEach(r => {
      const num = parseInt(String(r.id).replace(prefix, ''), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return prefix + String(max + 1).padStart(3, '0');
  }

  function today() {
    const d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function deptName(id) {
    const d = state.departments.find(x => x.id === id);
    return d ? d.name : '-';
  }
  function patientName(id) {
    const p = state.patients.find(x => x.id === id);
    return p ? p.name : '-';
  }
  function doctorName(id) {
    const d = state.doctors.find(x => x.id === id);
    return d ? d.name : '-';
  }

  // ---------- قراءة (من الحالة المحلية) ----------
  function all(table) { return (state[table] || []).slice(); }
  function find(table, id) { return (state[table] || []).find(r => r.id === id); }
  function count(table) { return (state[table] || []).length; }

  function sanitizeUserLocal(obj) {
    if (obj && typeof obj === 'object' && 'password' in obj) {
      const c = Object.assign({}, obj);
      delete c.password;
      return c;
    }
    return obj;
  }

  // ---------- كتابة (محليًا + على الخادم) ----------
  function insert(table, row) {
    if (!state[table]) state[table] = [];
    state[table].push(table === 'users' ? sanitizeUserLocal(row) : row);
    persist('/api/' + table, 'POST', row);
    return row;
  }

  function update(table, id, fields) {
    const row = (state[table] || []).find(r => r.id === id);
    if (row) Object.assign(row, table === 'users' ? sanitizeUserLocal(fields) : fields);
    persist('/api/' + table + '/' + encodeURIComponent(id), 'PUT', fields);
    return row;
  }

  function remove(table, id) {
    state[table] = (state[table] || []).filter(r => r.id !== id);
    persist('/api/' + table + '/' + encodeURIComponent(id), 'DELETE');
  }

  function replaceAll(table, rows) {
    state[table] = Array.isArray(rows) ? rows : [];
    return request('/api/' + table + '/replace', { method: 'POST', body: rows });
  }

  async function resetAll() {
    await request('/api/reset', { method: 'POST' });
    await loadAll();
  }

  // ---------- العلاقات ----------
  function invoiceTotal(invoiceId) {
    return (state.invoiceItems || [])
      .filter(i => i.invoiceId === invoiceId)
      .reduce((s, i) => s + Number(i.amount || 0), 0);
  }

  function revenue() {
    let paid = 0, unpaid = 0;
    (state.invoices || []).forEach(inv => {
      const t = invoiceTotal(inv.id);
      if (inv.status === 'مدفوع') paid += t; else unpaid += t;
    });
    return { paid, unpaid, total: paid + unpaid };
  }

  return {
    state: () => state,
    me: me_, loadAll, login, logout, bootstrap, changePassword,
    genId, today,
    deptName, patientName, doctorName,
    all, insert, update, remove, find, replaceAll, resetAll,
    invoiceTotal, count, revenue
  };
})();
