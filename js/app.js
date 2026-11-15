/**
 * PustakaAkademika — Main Application Coordinator & Router (PustakaApp)
 * Mengoordinasikan seluruh modul sistem: Storage, UI, Dashboard, Books, Members,
 * Circulation, & User Portal. Menangani routing view, pergantian mode peran (Pustakawan vs Mahasiswa),
 * sidebar responsif, dan pintasan keyboard global.
 */

window.PustakaApp = (() => {
  const STORAGE_KEY_MODE = 'pustaka_app_mode';

  const VIEW_META = {
    // Mode Pustakawan / Admin
    dashboard: {
      title: 'Dashboard Pustakawan',
      subtitle: 'Ringkasan operasional perpustakaan akademik & statistik sirkulasi'
    },
    books: {
      title: 'Katalog Koleksi Buku',
      subtitle: 'Kelola koleksi buku, stok, serta pencarian otomatis via Open Library API'
    },
    members: {
      title: 'Manajemen Anggota',
      subtitle: 'Kelola data mahasiswa, siswa, dan status tanggungan pinjaman'
    },
    circulation: {
      title: 'Meja Sirkulasi Perpustakaan',
      subtitle: 'Pencatatan peminjaman, pengembalian buku, dan perhitungan denda'
    },
    // Mode Pemustaka / Mahasiswa
    opac: {
      title: 'Eksplorasi Katalog (OPAC)',
      subtitle: 'Pencarian koleksi perpustakaan, ketersediaan stok, dan peminjaman mandiri'
    },
    'my-loans': {
      title: 'Peminjaman Saya & KTA Digital',
      subtitle: 'Kartu Anggota Digital, status countdown jatuh tempo, dan perpanjangan mandiri'
    },
    rules: {
      title: 'Panduan & Tata Tertib',
      subtitle: 'Ketentuan kuota peminjaman, durasi pinjam, dan kebijakan denda perpustakaan'
    }
  };

  let currentView = 'dashboard';
  let appMode = localStorage.getItem(STORAGE_KEY_MODE) || 'admin';

  // DOM Elements Navigation
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const btnResetDemo = document.getElementById('btnResetDemo');
  const btnAdminLogout = document.getElementById('btnAdminLogout');
  const roleButtons = document.querySelectorAll('.btn-role');
  const sidebarRoleText = document.getElementById('sidebarRoleText');

  /**
   * Mengatur peran aktif sistem: 'admin' (Pustakawan) atau 'user' (Mahasiswa).
   */
  function setAppMode(newMode) {
    appMode = newMode;
    localStorage.setItem(STORAGE_KEY_MODE, appMode);
    document.body.dataset.appMode = appMode;

    roleButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === appMode);
    });

    if (sidebarRoleText) {
      sidebarRoleText.textContent = appMode === 'admin' ? 'Mode: Pustakawan' : 'Mode: Pemustaka / Mahasiswa';
    }

    // Jika mode berubah, arahkan ke halaman utama yang sesuai
    if (appMode === 'admin' && ['opac', 'my-loans', 'rules'].includes(currentView)) {
      switchView('dashboard');
    } else if (appMode === 'user' && ['dashboard', 'books', 'members', 'circulation'].includes(currentView)) {
      switchView('opac');
    } else {
      switchView(currentView);
    }
  }

  /**
   * Berpindah antar tampilan view dengan transisi halus dan memperbarui judul halaman.
   */
  function switchView(viewName) {
    currentView = viewName;

    navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    viewSections.forEach((sec) => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    const meta = VIEW_META[viewName] || VIEW_META.dashboard;
    if (pageTitle) pageTitle.textContent = meta.title;
    if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

    closeMobileSidebar();
    renderAll();

    if (viewName === 'dashboard') {
      requestAnimationFrame(() => {
        if (window.PustakaDashboard && typeof window.PustakaDashboard.renderCharts === 'function') {
          PustakaDashboard.renderCharts();
        }
      });
    }
  }

  /**
   * Merender pembaruan data pada seluruh view yang aktif.
   */
  function renderAll() {
    if (window.PustakaDashboard) PustakaDashboard.render();
    if (window.PustakaBooks) PustakaBooks.render();
    if (window.PustakaMembers) PustakaMembers.render();
    if (window.PustakaCirculation) PustakaCirculation.render();
    if (window.PustakaUserPortal) {
      PustakaUserPortal.renderOPAC();
      PustakaUserPortal.renderStudentPortal();
    }
  }

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  /**
   * Inisialisasi awal seluruh aplikasi saat DOM telah selesai dimuat.
   */
  function init() {
    // 1. Inisialisasi Database LocalStorage & Guard Sesi Admin
    PustakaStorage.init();
    if (window.PustakaAuth) {
      const session = PustakaAuth.requireAuth('admin');
      if (!session) return;
    }

    // 2. Inisialisasi Komponen UI & Modul Fitur
    PustakaUI.init();
    PustakaDashboard.init();
    PustakaBooks.init();
    PustakaMembers.init();
    PustakaCirculation.init();
    if (window.PustakaUserPortal) {
      PustakaUserPortal.init();
    }

    // 3. Setup Role Switcher (Pustakawan vs Mahasiswa)
    roleButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        setAppMode(btn.dataset.mode);
      });
    });

    // 4. Event Navigasi Sidebar Desktop & Mobile
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        switchView(btn.dataset.view);
      });
    });

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // 5. Tombol Logout & Reset Demo Data
    if (btnAdminLogout) {
      btnAdminLogout.addEventListener('click', () => {
        PustakaUI.openConfirmModal({
          title: 'Keluar dari Portal Admin',
          message: 'Apakah Anda yakin ingin mengakhiri sesi pustakawan/admin?',
          confirmText: 'Keluar',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            PustakaAuth.logout();
          }
        });
      });
    }

    if (btnResetDemo) {
      btnResetDemo.addEventListener('click', () => {
        PustakaUI.openConfirmModal({
          title: 'Reset Data Demo',
          message: 'Seluruh perubahan data di localStorage akan dikembalikan ke data awal demo. Lanjutkan?',
          confirmText: 'Reset Data',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            PustakaStorage.resetDemoData();
            PustakaUI.closeConfirmModal();
            renderAll();
            PustakaUI.showToast('Data demo berhasil dikembalikan ke kondisi awal.');
          }
        });
      });
    }

    // 6. Pintasan Keyboard Global (Escape menutup modal)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const confirmModal = document.getElementById('confirmModal');
        const bookModal = document.getElementById('bookModal');
        const memberModal = document.getElementById('memberModal');
        const memberDetailModal = document.getElementById('memberDetailModal');

        if (confirmModal && !confirmModal.hidden) PustakaUI.closeConfirmModal();
        else if (bookModal && !bookModal.hidden) PustakaBooks.closeModal();
        else if (memberModal && !memberModal.hidden) PustakaMembers.closeModal();
        else if (memberDetailModal && !memberDetailModal.hidden) PustakaMembers.closeDetailModal();
      }
    });

    // 7. Klik pada backdrop modal untuk menutup
    ['confirmModal', 'bookModal', 'memberModal', 'memberDetailModal'].forEach((id) => {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.hidden = true;
          if (id === 'confirmModal') PustakaUI.closeConfirmModal();
        }
      });
    });

    // 8. Muat view awal dashboard
    switchView('dashboard');
  }

  return {
    init,
    switchView,
    setAppMode,
    renderAll
  };
})();

// Jalankan bootstrapping aplikasi setelah dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  window.PustakaApp.init();
});
