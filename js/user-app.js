/**
 * PustakaAkademika — User Portal Coordinator & Router (PustakaUserApp)
 * Khusus untuk halaman index.html (Portal Pemustaka / Mahasiswa 1 User).
 * Mengelola navigasi OPAC, Peminjaman Saya & KTA Digital, serta Panduan & Tata Tertib.
 */

window.PustakaUserApp = (() => {
  const VIEW_META = {
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

  let currentView = 'opac';

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
  const btnUserLogout = document.getElementById('btnUserLogout');

  /**
   * Berpindah antar tampilan view dengan transisi halus dan memperbarui judul halaman.
   */
  function switchView(viewName) {
    if (!VIEW_META[viewName]) {
      viewName = 'opac';
    }
    currentView = viewName;

    navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    viewSections.forEach((sec) => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    const meta = VIEW_META[viewName] || VIEW_META.opac;
    if (pageTitle) pageTitle.textContent = meta.title;
    if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

    closeMobileSidebar();
    renderAll();
  }

  /**
   * Merender pembaruan data pada view mahasiswa.
   */
  function renderAll() {
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
   * Inisialisasi awal portal pemustaka saat DOM telah selesai dimuat.
   */
  function init() {
    // 1. Inisialisasi Database LocalStorage & Guard Sesi Login
    PustakaStorage.init();
    if (window.PustakaAuth) {
      const session = PustakaAuth.requireAuth('user');
      if (!session) return;
    }

    // 2. Inisialisasi Komponen UI & Modul User Portal
    PustakaUI.init();
    if (window.PustakaUserPortal) {
      PustakaUserPortal.init();
    }

    // 3. Event Navigasi Sidebar Desktop & Mobile
    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        switchView(btn.dataset.view);
      });
    });

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // 4. Tombol Logout & Reset Demo Data
    if (btnUserLogout) {
      btnUserLogout.addEventListener('click', () => {
        PustakaUI.openConfirmModal({
          title: 'Keluar dari Portal Pemustaka',
          message: 'Apakah Anda yakin ingin keluar dari sesi pemustaka ini?',
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

    // 5. Pintasan Keyboard Global (Escape menutup modal)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const confirmModal = document.getElementById('confirmModal');
        const userBorrowModal = document.getElementById('userBorrowModal');
        const studentLoginModal = document.getElementById('studentLoginModal');

        if (confirmModal && !confirmModal.hidden) PustakaUI.closeConfirmModal();
        else if (userBorrowModal && !userBorrowModal.hidden) {
          userBorrowModal.hidden = true;
        } else if (studentLoginModal && !studentLoginModal.hidden) {
          studentLoginModal.hidden = true;
        }
      }
    });

    // 6. Klik pada backdrop modal untuk menutup
    ['confirmModal', 'userBorrowModal', 'studentLoginModal'].forEach((id) => {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.hidden = true;
          if (id === 'confirmModal') PustakaUI.closeConfirmModal();
        }
      });
    });

    // 7. Muat view awal OPAC
    switchView('opac');
  }

  return {
    init,
    switchView,
    renderAll
  };
})();

// Jalankan bootstrapping portal pemustaka setelah dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  window.PustakaUserApp.init();
});
