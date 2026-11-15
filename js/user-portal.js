/**
 * PustakaAkademika — Modul Portal Pemustaka / Mahasiswa (PustakaUserPortal)
 * Mengelola Eksplorasi Katalog Visual (OPAC), Kartu Tanda Anggota (KTA) Digital,
 * Pelacakan Countdown Jatuh Tempo Peminjaman Mandiri, & Pengajuan Pinjam/Perpanjangan.
 */

window.PustakaUserPortal = (() => {
  const STORAGE_KEY_STUDENT = 'pustaka_active_student_id';

  // DOM Elements OPAC
  const opacSearchInput = document.getElementById('opacSearchInput');
  const opacCategoryFilter = document.getElementById('opacCategoryFilter');
  const opacAvailabilityFilter = document.getElementById('opacAvailabilityFilter');
  const opacBooksGrid = document.getElementById('opacBooksGrid');
  const opacCountInfo = document.getElementById('opacCountInfo');

  // DOM Elements Student Portal (Peminjaman Saya & KTA)
  const studentProfileSelect = document.getElementById('studentProfileSelect');
  const studentAccountLabel = document.getElementById('studentAccountLabel');
  const btnSwitchStudentAuth = document.getElementById('btnSwitchStudentAuth');
  const ktaAvatar = document.getElementById('ktaAvatar');
  const ktaName = document.getElementById('ktaName');
  const ktaId = document.getElementById('ktaId');
  const ktaDept = document.getElementById('ktaDept');
  const ktaQuotaBadge = document.getElementById('ktaQuotaBadge');
  const studentActiveLoansList = document.getElementById('studentActiveLoansList');
  const studentHistoryLoansList = document.getElementById('studentHistoryLoansList');
  const userTotalActiveCount = document.getElementById('userTotalActiveCount');
  const userTotalFineAmount = document.getElementById('userTotalFineAmount');
  const userActiveCountBadge = document.getElementById('userActiveCountBadge');
  const userHistoryCountBadge = document.getElementById('userHistoryCountBadge');

  // DOM Elements User Borrow Modal
  const userBorrowModal = document.getElementById('userBorrowModal');
  const userBorrowBookTitle = document.getElementById('userBorrowBookTitle');
  const userBorrowBookAuthor = document.getElementById('userBorrowBookAuthor');
  const userBorrowBookIsbn = document.getElementById('userBorrowBookIsbn');
  const userBorrowStudentName = document.getElementById('userBorrowStudentName');
  const userBorrowDueDate = document.getElementById('userBorrowDueDate');
  const userBorrowNotice = document.getElementById('userBorrowNotice');
  const btnConfirmUserBorrow = document.getElementById('btnConfirmUserBorrow');
  const btnCancelUserBorrow = document.getElementById('btnCancelUserBorrow');
  const btnCloseUserBorrowModal = document.getElementById('btnCloseUserBorrowModal');

  // DOM Elements Student Login Modal (Opsi B)
  const studentLoginModal = document.getElementById('studentLoginModal');
  const studentLoginForm = document.getElementById('studentLoginForm');
  const studentLoginIdInput = document.getElementById('studentLoginIdInput');
  const btnCancelStudentLogin = document.getElementById('btnCancelStudentLogin');
  const btnCloseStudentLoginModal = document.getElementById('btnCloseStudentLoginModal');

  let pendingBorrowBookId = null;

  /**
   * Mengambil ID mahasiswa yang saat ini aktif dipilih di portal mahasiswa.
   */
  function getActiveStudentId() {
    const members = PustakaStorage.getMembers();
    if (members.length === 0) return null;

    let savedId = localStorage.getItem(STORAGE_KEY_STUDENT);
    if (!savedId || !members.some((m) => m.id === savedId)) {
      return null;
    }
    return savedId;
  }

  /**
   * Menetapkan ID mahasiswa aktif yang sedang membuka portal.
   */
  function setActiveStudentId(studentId) {
    localStorage.setItem(STORAGE_KEY_STUDENT, studentId);
    renderStudentPortal();
  }

  function openLoginModal() {
    if (!studentLoginModal) return;
    studentLoginModal.hidden = false;
    PustakaUI.clearError('studentLoginId');
    if (studentLoginIdInput) {
      studentLoginIdInput.value = '';
      setTimeout(() => studentLoginIdInput.focus(), 80);
    }
  }

  function closeLoginModal() {
    if (!studentLoginModal) return;
    studentLoginModal.hidden = true;
    PustakaUI.clearError('studentLoginId');
  }

  function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    if (!studentLoginIdInput) return;

    const inputId = studentLoginIdInput.value.trim();
    if (!inputId) {
      PustakaUI.setError('studentLoginId', 'Nomor Induk Mahasiswa (NIM) wajib diisi.');
      return;
    }

    const members = PustakaStorage.getMembers();
    const found = members.find((m) => m.id.toLowerCase() === inputId.toLowerCase());

    if (!found) {
      PustakaUI.setError('studentLoginId', `NIM "${inputId}" tidak ditemukan dalam daftar anggota terdaftar.`);
      return;
    }

    PustakaUI.clearError('studentLoginId');
    setActiveStudentId(found.id);
    closeLoginModal();
    PustakaUI.showToast(`Selamat datang, ${found.name}! Akun Anda berhasil terhubung.`);
  }

  /**
   * Merender katalog buku visual (OPAC) dalam format kartu modern.
   */
  function renderOPAC() {
    if (!opacBooksGrid) return;

    const books = PustakaStorage.getBooks();
    const query = opacSearchInput ? opacSearchInput.value.trim().toLowerCase() : '';
    const category = opacCategoryFilter ? opacCategoryFilter.value : 'ALL';
    const availability = opacAvailabilityFilter ? opacAvailabilityFilter.value : 'ALL';

    const filtered = books.filter((b) => {
      const matchQuery =
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.isbn.toLowerCase().includes(query) ||
        (b.category && b.category.toLowerCase().includes(query));

      const matchCat = category === 'ALL' || b.category === category;
      const matchAvail =
        availability === 'ALL' ||
        (availability === 'AVAILABLE' && b.stock > 0) ||
        (availability === 'EMPTY' && b.stock === 0);

      return matchQuery && matchCat && matchAvail;
    });

    if (opacCountInfo) {
      opacCountInfo.textContent = `${filtered.length} buku tersedia`;
    }

    if (filtered.length === 0) {
      opacBooksGrid.innerHTML = `
        <div class="empty-state-cell" style="grid-column: 1 / -1; padding: 3rem 1rem;">
          <p>Tidak ada buku yang sesuai dengan pencarian atau filter kategori.</p>
        </div>
      `;
      return;
    }

    opacBooksGrid.innerHTML = filtered.map((book) => {
      const isAvailable = book.stock > 0;
      const stockBadge = isAvailable
        ? `<span class="badge badge-available">Tersedia (${book.stock})</span>`
        : '<span class="badge badge-empty">Stok Habis</span>';

      const actionButton = isAvailable
        ? `<button type="button" class="btn btn-primary btn-sm btn-user-borrow" data-id="${PustakaUtils.escapeHTML(book.id)}">Pinjam Buku</button>`
        : '<button type="button" class="btn btn-outline btn-sm" disabled>Habis</button>';

      return `
        <article class="book-card">
          <div class="book-card-cover">
            <span class="book-card-cover-cat">${PustakaUtils.escapeHTML(book.category || 'Pustaka')}</span>
            <h3 class="book-card-cover-title">${PustakaUtils.escapeHTML(book.title)}</h3>
            <svg class="book-card-cover-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div class="book-card-body">
            <div class="book-card-meta">
              <span class="book-card-author">Penulis: ${PustakaUtils.escapeHTML(book.author)}</span>
              <span class="book-card-isbn">Tahun: ${PustakaUtils.escapeHTML(book.year)} &bull; ISBN: ${PustakaUtils.escapeHTML(book.isbn)}</span>
            </div>
            <div class="book-card-footer">
              ${stockBadge}
              ${actionButton}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Merender data kartu tanda anggota (KTA) digital dan status peminjaman mahasiswa aktif.
   */
  function renderStudentPortal() {
    const members = PustakaStorage.getMembers();
    const books = PustakaStorage.getBooks();
    const loans = PustakaStorage.getLoans();
    const activeStudentId = getActiveStudentId();
    const today = PustakaUtils.getTodayISO();

    // 1. Populasi Pilihan Mahasiswa
    if (studentProfileSelect) {
      studentProfileSelect.innerHTML = members.map((m) => {
        return `<option value="${PustakaUtils.escapeHTML(m.id)}" ${m.id === activeStudentId ? 'selected' : ''}>${PustakaUtils.escapeHTML(m.id)} — ${PustakaUtils.escapeHTML(m.name)}</option>`;
      }).join('');
    }

    const currentStudent = members.find((m) => m.id === activeStudentId);
    if (!currentStudent) {
      if (studentAccountLabel) {
        studentAccountLabel.innerHTML = '<span style="color: var(--color-danger);">Belum masuk (Klik tombol Ganti Akun untuk login NIM)</span>';
      }
      if (ktaName) ktaName.textContent = 'Belum Ada Akun Masuk';
      if (ktaId) ktaId.textContent = '-';
      if (ktaDept) ktaDept.textContent = 'Silakan Masukkan NIM Anda';
      if (ktaAvatar) ktaAvatar.textContent = '?';
      if (ktaQuotaBadge) ktaQuotaBadge.textContent = 'Kuota: 0/3 Buku';
      if (userTotalActiveCount) userTotalActiveCount.textContent = '0 Buku';
      if (userTotalFineAmount) userTotalFineAmount.textContent = 'Rp 0';
      if (userActiveCountBadge) userActiveCountBadge.textContent = '0 buku aktif';
      if (userHistoryCountBadge) userHistoryCountBadge.textContent = '0 riwayat';
      if (studentActiveLoansList) {
        studentActiveLoansList.innerHTML = `
          <div class="empty-state-cell" style="padding: 2rem 1rem;">
            <p>Silakan identifikasi akun Anda terlebih dahulu dengan menekan tombol <strong>Ganti Akun (NIM)</strong>.</p>
          </div>
        `;
      }
      if (studentHistoryLoansList) {
        studentHistoryLoansList.innerHTML = `
          <div class="empty-state-cell" style="padding: 2rem 1rem;">
            <p>Belum ada akun pemustaka yang terhubung.</p>
          </div>
        `;
      }
      return;
    }

    if (studentAccountLabel) {
      studentAccountLabel.textContent = `${currentStudent.name} (${currentStudent.id})`;
    }

    // 2. Render KTA Digital Card
    if (ktaName) ktaName.textContent = currentStudent.name;
    if (ktaId) ktaId.textContent = currentStudent.id;
    if (ktaDept) ktaDept.textContent = currentStudent.department;
    if (ktaAvatar) ktaAvatar.textContent = (currentStudent.name || 'M').charAt(0).toUpperCase();

    // 3. Filter Pinjaman Mahasiswa Ini
    const studentLoans = loans.filter((l) => l.memberId === activeStudentId);
    const activeLoans = studentLoans.filter((l) => l.status === 'Dipinjam');
    const returnedLoans = studentLoans.filter((l) => l.status === 'Dikembalikan');

    // Hitung Akumulasi Denda Berjalan
    let totalFine = 0;
    activeLoans.forEach((l) => {
      const lateDays = PustakaUtils.calculateLateDays(l.dueDate, today);
      if (lateDays > 0) totalFine += (lateDays * PustakaUtils.CONFIG.FINE_PER_DAY);
    });

    if (userTotalActiveCount) userTotalActiveCount.textContent = `${activeLoans.length} Buku`;
    if (userTotalFineAmount) userTotalFineAmount.textContent = PustakaUtils.formatRupiah(totalFine);
    if (userActiveCountBadge) userActiveCountBadge.textContent = `${activeLoans.length} buku aktif`;
    if (userHistoryCountBadge) userHistoryCountBadge.textContent = `${returnedLoans.length} riwayat`;
    if (ktaQuotaBadge) {
      ktaQuotaBadge.textContent = `Kuota Pinjaman: ${activeLoans.length}/${PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER} Buku`;
    }

    // 4. Render Daftar Buku Yang Sedang Dipinjam
    if (studentActiveLoansList) {
      if (activeLoans.length === 0) {
        studentActiveLoansList.innerHTML = `
          <div class="empty-state-cell" style="padding: 2rem 1rem;">
            <p>Anda belum memiliki buku yang sedang dipinjam saat ini.</p>
            <p class="cell-sub" style="margin-top: 0.35rem;">Buka menu <strong>Eksplorasi Katalog (OPAC)</strong> untuk memilih dan meminjam buku.</p>
          </div>
        `;
      } else {
        studentActiveLoansList.innerHTML = activeLoans.map((loan) => {
          const book = books.find((b) => b.id === loan.bookId);
          const lateDays = PustakaUtils.calculateLateDays(loan.dueDate, today);
          const isRenewed = Number(loan.renewCount || 0) >= PustakaUtils.CONFIG.MAX_RENEW_COUNT;

          let countdownBadge = '';
          if (lateDays > 0) {
            countdownBadge = `<span class="countdown-chip countdown-chip-danger">⚠️ Terlambat ${lateDays} hari (Denda ${PustakaUtils.formatRupiah(lateDays * PustakaUtils.CONFIG.FINE_PER_DAY)})</span>`;
          } else {
            // Hitung sisa hari
            const [dy, dm, dd] = loan.dueDate.split('-').map(Number);
            const [ty, tm, td] = today.split('-').map(Number);
            const diffDays = Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td)) / (1000 * 60 * 60 * 24));

            if (diffDays <= 2) {
              countdownBadge = `<span class="countdown-chip countdown-chip-warning">⏳ Sisa ${diffDays} hari lagi</span>`;
            } else {
              countdownBadge = `<span class="countdown-chip countdown-chip-safe">✓ Sisa ${diffDays} hari lagi</span>`;
            }
          }

          const renewDisabled = isRenewed || lateDays > 0;
          const renewBtnText = isRenewed ? 'Sudah Diperpanjang' : 'Perpanjang Pinjaman (+7 Hari)';

          return `
            <div class="student-loan-item">
              <div class="student-loan-info">
                <span class="student-loan-title">${PustakaUtils.escapeHTML(book ? book.title : loan.bookId)}</span>
                <span class="student-loan-meta">
                  Penulis: ${PustakaUtils.escapeHTML(book ? book.author : '-')} &bull; Tgl Pinjam: ${PustakaUtils.formatDateID(loan.loanDate)} &bull; Jatuh Tempo: <strong>${PustakaUtils.formatDateID(loan.dueDate)}</strong>
                </span>
                <div style="margin-top: 0.35rem;">${countdownBadge}</div>
              </div>
              <div>
                <button type="button" class="btn btn-outline btn-sm btn-student-renew" data-id="${PustakaUtils.escapeHTML(loan.id)}" ${renewDisabled ? 'disabled' : ''}>
                  ${renewBtnText}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 5. Render Riwayat Pengembalian Selesai
    if (studentHistoryLoansList) {
      if (returnedLoans.length === 0) {
        studentHistoryLoansList.innerHTML = '<tr><td colspan="5" class="empty-state-cell">Belum ada riwayat pengembalian.</td></tr>';
      } else {
        studentHistoryLoansList.innerHTML = returnedLoans.map((loan) => {
          const book = books.find((b) => b.id === loan.bookId);
          const fineStr = loan.fineAmount ? PustakaUtils.formatRupiah(loan.fineAmount) : 'Rp 0';
          return `
            <tr>
              <td><strong>${PustakaUtils.escapeHTML(loan.id)}</strong></td>
              <td>${PustakaUtils.escapeHTML(book ? book.title : loan.bookId)}</td>
              <td>${PustakaUtils.formatDateID(loan.loanDate)}</td>
              <td>${PustakaUtils.formatDateID(loan.returnDate)}</td>
              <td>${fineStr}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  /**
   * Membuka modal konfirmasi peminjaman mandiri bagi mahasiswa.
   */
  function openBorrowModal(bookId) {
    const books = PustakaStorage.getBooks();
    const members = PustakaStorage.getMembers();
    const loans = PustakaStorage.getLoans();
    const targetBook = books.find((b) => b.id === bookId);
    let activeStudentId = getActiveStudentId();

    if (!activeStudentId) {
      PustakaUI.showToast('Silakan masukkan NIM Anda terlebih dahulu untuk meminjam buku.', 'error');
      openLoginModal();
      return;
    }

    const student = members.find((m) => m.id === activeStudentId);
    if (!targetBook || !student) return;

    pendingBorrowBookId = bookId;
    const today = PustakaUtils.getTodayISO();
    const dueDate = PustakaUtils.addDaysISO(today, 7);

    if (userBorrowBookTitle) userBorrowBookTitle.textContent = targetBook.title;
    if (userBorrowBookAuthor) userBorrowBookAuthor.textContent = targetBook.author;
    if (userBorrowBookIsbn) userBorrowBookIsbn.textContent = targetBook.isbn;
    if (userBorrowStudentName) userBorrowStudentName.textContent = `${student.name} (${student.id})`;
    if (userBorrowDueDate) userBorrowDueDate.textContent = PustakaUtils.formatDateID(dueDate);

    // Validasi Kelayakan Peminjaman
    const studentActiveLoans = loans.filter((l) => l.memberId === activeStudentId && l.status === 'Dipinjam');
    const isQuotaFull = studentActiveLoans.length >= PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER;
    const hasOverdue = studentActiveLoans.some((l) => PustakaUtils.calculateLateDays(l.dueDate, today) > 0);

    if (userBorrowNotice) {
      if (isQuotaFull) {
        userBorrowNotice.className = 'api-status is-error';
        userBorrowNotice.textContent = `Perhatian: Kuota pinjaman Anda sudah penuh (${studentActiveLoans.length}/3 buku). Kembalikan buku terlebih dahulu.`;
        if (btnConfirmUserBorrow) btnConfirmUserBorrow.disabled = true;
      } else if (hasOverdue) {
        userBorrowNotice.className = 'api-status is-error';
        userBorrowNotice.textContent = 'Perhatian: Anda memiliki buku yang sudah melewati jatuh tempo. Selesaikan pengembalian terlebih dahulu.';
        if (btnConfirmUserBorrow) btnConfirmUserBorrow.disabled = true;
      } else {
        userBorrowNotice.className = 'api-status';
        userBorrowNotice.textContent = `Buku akan dipinjam selama 7 hari kalender hingga ${PustakaUtils.formatDateID(dueDate)}.`;
        if (btnConfirmUserBorrow) btnConfirmUserBorrow.disabled = false;
      }
    }

    if (userBorrowModal) userBorrowModal.hidden = false;
  }

  function closeBorrowModal() {
    if (userBorrowModal) userBorrowModal.hidden = true;
    pendingBorrowBookId = null;
  }

  /**
   * Memproses eksekusi peminjaman mandiri oleh mahasiswa ke LocalStorage.
   */
  function handleConfirmBorrow() {
    if (!pendingBorrowBookId) return;

    const books = PustakaStorage.getBooks();
    const loans = PustakaStorage.getLoans();
    const activeStudentId = getActiveStudentId();
    const targetBook = books.find((b) => b.id === pendingBorrowBookId);

    if (!targetBook || targetBook.stock <= 0) {
      PustakaUI.showToast('Maaf, stok buku ini sudah habis.', 'error');
      closeBorrowModal();
      return;
    }

    const today = PustakaUtils.getTodayISO();
    const dueDate = PustakaUtils.addDaysISO(today, 7);

    // Buat data peminjaman baru
    const newLoan = {
      id: PustakaStorage.generateNextLoanId(loans),
      memberId: activeStudentId,
      bookId: pendingBorrowBookId,
      loanDate: today,
      dueDate: dueDate,
      returnDate: null,
      status: 'Dipinjam',
      renewCount: 0,
      fineAmount: 0,
      finePaid: false
    };

    loans.push(newLoan);
    PustakaStorage.saveLoans(loans);

    // Kurangi stok buku
    const updatedBooks = books.map((b) =>
      b.id === pendingBorrowBookId ? { ...b, stock: Math.max(0, b.stock - 1) } : b
    );
    PustakaStorage.saveBooks(updatedBooks);

    closeBorrowModal();
    if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
      window.PustakaApp.renderAll();
    }
    if (window.PustakaUserApp && typeof window.PustakaUserApp.renderAll === 'function') {
      window.PustakaUserApp.renderAll();
    }
    renderOPAC();
    renderStudentPortal();

    PustakaUI.showToast(`Buku "${targetBook.title}" berhasil dipinjam! Lihat di menu Peminjaman Saya.`);
  }

  /**
   * Menginisialisasi event listeners portal mahasiswa.
   */
  function init() {
    // Filter dan pencarian OPAC
    if (opacSearchInput) opacSearchInput.addEventListener('input', renderOPAC);
    if (opacCategoryFilter) opacCategoryFilter.addEventListener('change', renderOPAC);
    if (opacAvailabilityFilter) opacAvailabilityFilter.addEventListener('change', renderOPAC);

    // Delegasi klik tombol "Pinjam Buku" pada grid OPAC
    if (opacBooksGrid) {
      opacBooksGrid.addEventListener('click', (e) => {
        const borrowBtn = e.target.closest('.btn-user-borrow');
        if (borrowBtn) {
          openBorrowModal(borrowBtn.dataset.id);
        }
      });
    }

    // Modal Peminjaman Mandiri
    if (btnConfirmUserBorrow) btnConfirmUserBorrow.addEventListener('click', handleConfirmBorrow);
    if (btnCancelUserBorrow) btnCancelUserBorrow.addEventListener('click', closeBorrowModal);
    if (btnCloseUserBorrowModal) btnCloseUserBorrowModal.addEventListener('click', closeBorrowModal);

    // Modal Masuk / Ganti Akun NIM (Opsi B)
    if (btnSwitchStudentAuth) btnSwitchStudentAuth.addEventListener('click', openLoginModal);
    if (studentLoginForm) studentLoginForm.addEventListener('submit', handleLoginSubmit);
    if (btnCancelStudentLogin) btnCancelStudentLogin.addEventListener('click', closeLoginModal);
    if (btnCloseStudentLoginModal) btnCloseStudentLoginModal.addEventListener('click', closeLoginModal);

    // Pilihan profil mahasiswa
    if (studentProfileSelect) {
      studentProfileSelect.addEventListener('change', () => {
        setActiveStudentId(studentProfileSelect.value);
      });
    }

    // Delegasi klik perpanjangan mandiri oleh mahasiswa
    if (studentActiveLoansList) {
      studentActiveLoansList.addEventListener('click', (e) => {
        const renewBtn = e.target.closest('.btn-student-renew');
        if (renewBtn) {
          // Manfaatkan fungsi perpanjangan yang sudah tervalidasi di PustakaCirculation
          if (window.PustakaCirculation && typeof window.PustakaCirculation.requestRenew === 'function') {
            window.PustakaCirculation.requestRenew(renewBtn.dataset.id);
          } else {
            // Fallback manual renewal
            const loans = PustakaStorage.getLoans();
            const loan = loans.find((l) => l.id === renewBtn.dataset.id);
            if (loan && loan.status === 'Dipinjam') {
              loan.dueDate = PustakaUtils.addDaysISO(loan.dueDate, 7);
              loan.renewCount = Number(loan.renewCount || 0) + 1;
              PustakaStorage.saveLoans(loans);
              if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') window.PustakaApp.renderAll();
              if (window.PustakaUserApp && typeof window.PustakaUserApp.renderAll === 'function') window.PustakaUserApp.renderAll();
              renderStudentPortal();
              PustakaUI.showToast(`Masa pinjam berhasil diperpanjang hingga ${PustakaUtils.formatDateID(loan.dueDate)}.`);
            }
          }
        }
      });
    }
  }

  return {
    init,
    renderOPAC,
    renderStudentPortal,
    getActiveStudentId,
    setActiveStudentId,
    openLoginModal,
    closeLoginModal
  };
})();
