/**
 * PustakaAkademika — Modul Autentikasi & Sesi (PustakaAuth)
 * Mengelola login, registrasi (sign up) anggota baru, sesi peran aktif, dan logout.
 */

window.PustakaAuth = (() => {
  const SESSION_KEY = 'pustaka_auth_session';

  // Akun default Pustakawan / Admin
  const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
    name: 'Pustakawan Akademik'
  };

  /**
   * Mengambil data sesi pengguna yang sedang login saat ini.
   * Format: { role: 'admin'|'user', id: string, name: string, email?: string }
   */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Menetapkan sesi login pengguna.
   */
  function setSession(sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    if (sessionData && sessionData.role === 'user' && sessionData.id) {
      localStorage.setItem('pustaka_active_student_id', sessionData.id);
    }
  }

  /**
   * Menghapus sesi login saat logout.
   */
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Melakukan autentikasi Admin / Pustakawan.
   */
  function loginAdmin(username, password) {
    if (username.trim() === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
      const session = {
        role: 'admin',
        id: 'ADM-001',
        name: DEFAULT_ADMIN.name,
        username: DEFAULT_ADMIN.username
      };
      setSession(session);
      return { success: true, session };
    }
    return {
      success: false,
      message: 'Username atau kata sandi Pustakawan salah. (Gunakan admin / admin123)'
    };
  }

  /**
   * Melakukan autentikasi Mahasiswa / Pemustaka (menggunakan NIM / Email).
   */
  function loginUser(identifier, password) {
    const cleanId = identifier.trim().toLowerCase();
    const members = PustakaStorage.getMembers();

    const member = members.find((m) =>
      m.id.toLowerCase() === cleanId || (m.email && m.email.toLowerCase() === cleanId)
    );

    if (!member) {
      return {
        success: false,
        message: `Akun dengan NIM / Email "${identifier}" tidak ditemukan.`
      };
    }

    // Jika akun memiliki password tersimpan, validasi password
    if (member.password && member.password !== password) {
      return {
        success: false,
        message: 'Kata sandi tidak sesuai. Silakan periksa kembali.'
      };
    }

    const session = {
      role: 'user',
      id: member.id,
      name: member.name,
      department: member.department,
      email: member.email
    };
    setSession(session);
    return { success: true, session };
  }

  /**
   * Mendaftarkan anggota (pemustaka) baru ke dalam sistem dan database LocalStorage.
   */
  function registerUser(userData) {
    const members = PustakaStorage.getMembers();
    const cleanId = userData.id.trim();
    const cleanEmail = userData.email.trim().toLowerCase();

    // Validasi apakah NIM sudah dipakai
    if (members.some((m) => m.id.toLowerCase() === cleanId.toLowerCase())) {
      return {
        success: false,
        field: 'id',
        message: `NIM "${cleanId}" sudah terdaftar. Silakan gunakan NIM lain atau login.`
      };
    }

    // Validasi apakah email sudah dipakai
    if (cleanEmail && members.some((m) => m.email && m.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        field: 'email',
        message: `Email "${cleanEmail}" sudah terdaftar di sistem.`
      };
    }

    const formattedDept = userData.faculty
      ? `${userData.department.trim()} (${userData.faculty.trim()})`
      : userData.department.trim();

    const newMember = {
      id: cleanId,
      name: userData.name.trim(),
      department: formattedDept,
      faculty: (userData.faculty || '').trim(),
      studyProgram: userData.department.trim(),
      phone: userData.phone.trim(),
      email: cleanEmail,
      password: userData.password || '123456',
      createdAt: new Date().toISOString()
    };

    members.push(newMember);
    PustakaStorage.saveMembers(members);

    // Otomatis login dengan sesi user baru
    const session = {
      role: 'user',
      id: newMember.id,
      name: newMember.name,
      department: newMember.department,
      email: newMember.email
    };
    setSession(session);

    return { success: true, session };
  }

  /**
   * Memeriksa hak akses halaman: jika belum login, arahkan ke login.html.
   * @param {'admin'|'user'|'any'} requiredRole
   */
  function requireAuth(requiredRole = 'any') {
    const session = getSession();
    if (!session) {
      window.location.href = './login.html';
      return null;
    }

    if (requiredRole === 'admin' && session.role !== 'admin') {
      window.location.href = './index.html';
      return null;
    }

    if (requiredRole === 'user' && session.role !== 'user') {
      window.location.href = './admin.html';
      return null;
    }

    return session;
  }

  /**
   * Keluar dari sesi dan kembali ke halaman login.
   */
  function logout() {
    clearSession();
    window.location.href = './login.html';
  }

  return {
    getSession,
    setSession,
    clearSession,
    loginAdmin,
    loginUser,
    registerUser,
    requireAuth,
    logout
  };
})();
