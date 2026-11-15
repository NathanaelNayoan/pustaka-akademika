/**
 * PustakaAkademika — Modul Antarmuka & Animasi (PustakaUI)
 * Menangani Toast Notifications, Animasi Angka (Count-up), Form Error Helper,
 * Efek Ripple Tombol, dan Modal Konfirmasi Global.
 */

window.PustakaUI = (() => {
  let confirmCallback = null;

  // DOM Elements UI
  const toastContainer = document.getElementById('toastContainer');
  const confirmModal = document.getElementById('confirmModal');
  const confirmModalTitle = document.getElementById('confirmModalTitle');
  const confirmModalMessage = document.getElementById('confirmModalMessage');
  const btnCloseConfirmModal = document.getElementById('btnCloseConfirmModal');
  const btnCancelConfirmModal = document.getElementById('btnCancelConfirmModal');
  const btnConfirmAction = document.getElementById('btnConfirmAction');

  /**
   * Menampilkan pesan Toast notifikasi dengan animasi masuk & keluar yang mulus.
   */
  function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;
    toast.title = 'Klik untuk menutup pesan';

    let isHiding = false;
    const dismiss = () => {
      if (isHiding) return;
      isHiding = true;
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        toast.remove();
      }, 240);
    };

    toast.addEventListener('click', dismiss);
    toastContainer.appendChild(toast);

    setTimeout(dismiss, 3200);
  }

  /**
   * Animasi Hitung Naik (Count-up) dengan kurva cubic easing untuk KPI Dashboard.
   */
  function animateValue(element, start, end, duration = 650) {
    if (!element) return;
    const endVal = Number(end);
    if (isNaN(endVal)) {
      element.textContent = end;
      return;
    }
    const startVal = Number(start) || 0;
    if (startVal === endVal) {
      element.textContent = endVal;
      return;
    }

    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = endVal;
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Menampilkan atau menghapus pesan validasi error pada elemen input form.
   */
  function setFieldError(inputEl, message) {
    if (!inputEl) return;
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (message) {
      inputEl.classList.add('is-invalid');
      if (errorEl) errorEl.textContent = message;
    } else {
      inputEl.classList.remove('is-invalid');
      if (errorEl) errorEl.textContent = '';
    }
  }

  /**
   * Mengosongkan seluruh status error pada suatu formulir.
   */
  function clearFormErrors(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll('.form-control').forEach((el) => {
      el.classList.remove('is-invalid');
    });
    formEl.querySelectorAll('.error-message').forEach((el) => {
      el.textContent = '';
    });
  }

  /**
   * Membuka modal konfirmasi dengan parameter judul, pesan, dan aksi callback.
   */
  function openConfirmModal({ title, message, confirmText = 'Ya, Lanjutkan', confirmClass = 'btn-danger', onConfirm }) {
    if (!confirmModal) return;
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    btnConfirmAction.textContent = confirmText;
    btnConfirmAction.className = `btn ${confirmClass}`;
    confirmCallback = onConfirm;
    confirmModal.hidden = false;
  }

  /**
   * Menutup modal konfirmasi dan mengosongkan antrian callback.
   */
  function closeConfirmModal() {
    if (!confirmModal) return;
    confirmModal.hidden = true;
    confirmCallback = null;
  }

  /**
   * Menginisialisasi efek ripple interaktif pada setiap tombol di seluruh halaman.
   */
  function initButtonRipples() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('btn-ripple');

      const existingRipple = btn.querySelector('.btn-ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      btn.appendChild(circle);

      setTimeout(() => {
        circle.remove();
      }, 550);
    });
  }

  /**
   * Menginisialisasi event listeners untuk modal konfirmasi dan pembersihan error real-time.
   */
  function init() {
    if (btnCloseConfirmModal) btnCloseConfirmModal.addEventListener('click', closeConfirmModal);
    if (btnCancelConfirmModal) btnCancelConfirmModal.addEventListener('click', closeConfirmModal);
    if (btnConfirmAction) {
      btnConfirmAction.addEventListener('click', () => {
        if (typeof confirmCallback === 'function') {
          confirmCallback();
        }
      });
    }

    // Pembersihan pesan error real-time saat pengguna mulai mengetik kembali
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('form-control') && e.target.classList.contains('is-invalid')) {
        setFieldError(e.target, '');
      }
    });

    initButtonRipples();
  }

  return {
    init,
    showToast,
    animateValue,
    setFieldError,
    clearFormErrors,
    openConfirmModal,
    closeConfirmModal
  };
})();
