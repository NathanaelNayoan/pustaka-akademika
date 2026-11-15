/**
 * PustakaAkademika — Modul Sirkulasi (PustakaCirculation)
 * Menangani Pencatatan Peminjaman Buku, Pengurangan Stok Otomatis,
 * Validasi Kuota Maksimal & Blokir Terlambat, Perpanjangan (+7 Hari),
 * Pengembalian Buku dengan Hitung Denda Otomatis, dan Ekspor CSV.
 */

window.PustakaCirculation = (() => {
  // DOM Elements Circulation View
  const loanForm = document.getElementById('loanForm');
  const loanMemberSelect = document.getElementById('loanMemberSelect');
  const loanBookSelect = document.getElementById('loanBookSelect');
  const loanDateInput = document.getElementById('loanDateInput');
  const loanDueDateInput = document.getElementById('loanDueDateInput');
  const loanSearchInput = document.getElementById('loanSearchInput');
  const loanStatusFilter = document.getElementById('loanStatusFilter');
  const btnExportLoansCsv = document.getElementById('btnExportLoansCsv');
  const loansTableBody = document.getElementById('loansTableBody');
  const loansCountInfo = document.getElementById('loansCountInfo');

  /**
   * Menghasilkan elemen HTML badge status peminjaman.
   */
  function getLoanStatusBadge(loan) {
    if (loan.status === 'Dikembalikan') {
      return '<span class="badge badge-returned">Dikembalikan</span>';
    }
    const lateDays = PustakaUtils.calculateLateDays(loan.dueDate, PustakaUtils.getTodayISO());
    if (lateDays > 0) {
      return `<span class="badge badge-overdue">Terlambat (${lateDays} hr)</span>`;
    }
    if (Number(loan.renewCount || 0) > 0) {
      return '<span class="badge badge-borrowed">Dipinjam (Diperpanjang)</span>';
    }
    return '<span class="badge badge-borrowed">Dipinjam</span>';
  }

  /**
   * Merender daftar dropdown pilihan anggota & buku, serta tabel riwayat transaksi sirkulasi.
   */
  function render() {
    const members = PustakaStorage.getMembers();
    const books = PustakaStorage.getBooks();
    const loans = PustakaStorage.getLoans();
    const today = PustakaUtils.getTodayISO();

    // Populate Member Dropdown
    if (loanMemberSelect) {
      const prevMemberVal = loanMemberSelect.value;
      loanMemberSelect.innerHTML = '<option value="">-- Pilih Anggota --</option>' +
        members.map((m) => {
          const activeCount = loans.filter((l) => l.memberId === m.id && l.status === 'Dipinjam').length;
          const hasOverdue = loans.some((l) => l.memberId === m.id && l.status === 'Dipinjam' && PustakaUtils.calculateLateDays(l.dueDate, today) > 0);
          let quotaText = `(${activeCount}/${PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER} buku)`;
          if (hasOverdue) {
            quotaText += ' [TERLAMBAT]';
          } else if (activeCount >= PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER) {
            quotaText += ' [KUOTA PENUH]';
          }
          return `<option value="${PustakaUtils.escapeHTML(m.id)}">${PustakaUtils.escapeHTML(m.id)} - ${PustakaUtils.escapeHTML(m.name)} ${quotaText}</option>`;
        }).join('');
      if (members.some((m) => m.id === prevMemberVal)) {
        loanMemberSelect.value = prevMemberVal;
      }
    }

    // Populate Available Books Dropdown (stok > 0)
    if (loanBookSelect) {
      const availableBooks = books.filter((b) => b.stock > 0);
      const prevBookVal = loanBookSelect.value;
      if (availableBooks.length === 0) {
        loanBookSelect.innerHTML = '<option value="">-- Semua Koleksi Buku Sedang Dipinjam (Stok Habis) --</option>';
      } else {
        loanBookSelect.innerHTML = `<option value="">-- Pilih Buku (${availableBooks.length} judul tersedia) --</option>` +
          availableBooks.map((b) => `<option value="${PustakaUtils.escapeHTML(b.id)}">${PustakaUtils.escapeHTML(b.title)} (Stok: ${b.stock})</option>`).join('');
      }
      if (availableBooks.some((b) => b.id === prevBookVal)) {
        loanBookSelect.value = prevBookVal;
      }
    }

    // Default dates if empty
    if (loanDateInput && !loanDateInput.value) {
      loanDateInput.value = today;
      if (loanDueDateInput) loanDueDateInput.value = PustakaUtils.addDaysISO(today, 7);
    }

    // Filter & Render Loans Table
    if (!loansTableBody) return;
    const statusFilter = loanStatusFilter ? loanStatusFilter.value : 'ALL';
    const searchQuery = loanSearchInput ? loanSearchInput.value.trim().toLowerCase() : '';

    const filteredLoans = [...loans].reverse().filter((l) => {
      const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
      if (!matchesStatus) return false;

      if (!searchQuery) return true;

      const m = members.find((mem) => mem.id === l.memberId);
      const b = books.find((bk) => bk.id === l.bookId);
      const memberName = m ? m.name.toLowerCase() : '';
      const bookTitle = b ? b.title.toLowerCase() : '';
      const bookIsbn = b ? b.isbn.toLowerCase() : '';

      return (
        l.id.toLowerCase().includes(searchQuery) ||
        l.memberId.toLowerCase().includes(searchQuery) ||
        memberName.includes(searchQuery) ||
        l.bookId.toLowerCase().includes(searchQuery) ||
        bookTitle.includes(searchQuery) ||
        bookIsbn.includes(searchQuery)
      );
    });

    if (loansCountInfo) {
      loansCountInfo.textContent = `${filteredLoans.length} transaksi`;
    }

    if (filteredLoans.length === 0) {
      const emptyMsg = searchQuery || statusFilter !== 'ALL'
        ? 'Tidak ada transaksi sirkulasi yang cocok dengan filter / pencarian.'
        : 'Belum ada data transaksi sirkulasi.';
      loansTableBody.innerHTML = `<tr><td colspan="8" class="empty-state-cell">${emptyMsg}</td></tr>`;
      return;
    }

    loansTableBody.innerHTML = filteredLoans.map((loan) => {
      const member = members.find((m) => m.id === loan.memberId);
      const book = books.find((b) => b.id === loan.bookId);

      const compareDate = loan.status === 'Dikembalikan' && loan.returnDate
        ? loan.returnDate
        : today;
      const lateDays = PustakaUtils.calculateLateDays(loan.dueDate, compareDate);
      const fineAmount = lateDays * PustakaUtils.CONFIG.FINE_PER_DAY;

      let fineDisplay = 'Rp 0';
      if (loan.status === 'Dikembalikan') {
        const fineVal = Number(loan.fineAmount || 0);
        if (fineVal > 0) {
          fineDisplay = `<span class="fine-text">${PustakaUtils.formatRupiah(fineVal)}</span> <span class="badge badge-fine-paid">Lunas</span>`;
        }
      } else {
        if (fineAmount > 0) {
          fineDisplay = `<span class="fine-text">${PustakaUtils.formatRupiah(fineAmount)}</span> <span class="badge badge-fine-unpaid">Berjalan</span>`;
        }
      }

      const returnInfo = loan.returnDate
        ? `<div class="cell-sub">Kembali: ${PustakaUtils.formatDateID(loan.returnDate)}</div>`
        : '';

      let actionCell = '';
      if (loan.status === 'Dipinjam') {
        const isRenewed = Number(loan.renewCount || 0) >= PustakaUtils.CONFIG.MAX_RENEW_COUNT;
        const isOverdue = lateDays > 0;
        const renewDisabled = isRenewed || isOverdue;
        const renewTitle = isOverdue
          ? 'Tidak dapat diperpanjang (sudah melewati jatuh tempo)'
          : (isRenewed ? 'Sudah diperpanjang 1x' : 'Perpanjang masa pinjam +7 hari');

        actionCell = `
          <div class="action-buttons">
            <button type="button" class="btn btn-secondary btn-sm btn-return-book" data-id="${PustakaUtils.escapeHTML(loan.id)}">
              Kembalikan
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-renew-book" data-id="${PustakaUtils.escapeHTML(loan.id)}" ${renewDisabled ? 'disabled' : ''} title="${renewTitle}">
              ${isRenewed ? 'Diperpanjang' : 'Perpanjang'}
            </button>
          </div>
        `;
      } else {
        actionCell = '<span class="cell-sub">Selesai</span>';
      }

      return `
        <tr>
          <td><strong>${PustakaUtils.escapeHTML(loan.id)}</strong></td>
          <td>${PustakaUtils.escapeHTML(member ? member.name : loan.memberId)}</td>
          <td>${PustakaUtils.escapeHTML(book ? book.title : loan.bookId)}</td>
          <td>${PustakaUtils.formatDateID(loan.loanDate)}</td>
          <td>
            <div>${PustakaUtils.formatDateID(loan.dueDate)}</div>
            ${returnInfo}
          </td>
          <td>${getLoanStatusBadge(loan)}</td>
          <td>${fineDisplay}</td>
          <td class="text-right">${actionCell}</td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Menangani pengajuan peminjaman baru dengan validasi kuota & status keterlambatan.
   */
  function handleSubmit(e) {
    e.preventDefault();
    PustakaUI.clearFormErrors(loanForm);

    const selectedMemberId = loanMemberSelect.value;
    const selectedBookId = loanBookSelect.value;
    const loanDateVal = loanDateInput.value;
    const dueDateVal = loanDueDateInput.value;

    const books = PustakaStorage.getBooks();
    const members = PustakaStorage.getMembers();
    const loans = PustakaStorage.getLoans();

    let isValid = true;

    if (!selectedMemberId || !members.some((m) => m.id === selectedMemberId)) {
      PustakaUI.setFieldError(loanMemberSelect, 'Silakan pilih anggota peminjam.');
      isValid = false;
    } else {
      // 1. Cek kuota maksimal peminjaman
      const memberActiveLoans = loans.filter(
        (l) => l.memberId === selectedMemberId && l.status === 'Dipinjam'
      );
      if (memberActiveLoans.length >= PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER) {
        PustakaUI.setFieldError(
          loanMemberSelect,
          `Anggota ini telah mencapai kuota maksimal (${PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER} buku aktif). Kembalikan buku terlebih dahulu.`
        );
        isValid = false;
      }

      // 2. Cek apakah ada pinjaman yang telah terlambat
      const hasOverdueLoans = memberActiveLoans.some(
        (l) => PustakaUtils.calculateLateDays(l.dueDate, PustakaUtils.getTodayISO()) > 0
      );
      if (hasOverdueLoans) {
        PustakaUI.setFieldError(
          loanMemberSelect,
          'Anggota memiliki pinjaman yang melewati jatuh tempo. Harap selesaikan pengembalian buku yang terlambat terlebih dahulu.'
        );
        isValid = false;
      }
    }

    const selectedBook = books.find((b) => b.id === selectedBookId);
    if (!selectedBookId || !selectedBook) {
      PustakaUI.setFieldError(loanBookSelect, 'Silakan pilih buku yang akan dipinjam.');
      isValid = false;
    } else if (selectedBook.stock <= 0) {
      PustakaUI.setFieldError(loanBookSelect, 'Stok buku ini sudah habis.');
      isValid = false;
    }

    if (!loanDateVal) {
      PustakaUI.setFieldError(loanDateInput, 'Tanggal pinjam wajib diisi.');
      isValid = false;
    }

    if (!dueDateVal) {
      PustakaUI.setFieldError(loanDueDateInput, 'Tanggal jatuh tempo wajib diisi.');
      isValid = false;
    } else if (loanDateVal && dueDateVal < loanDateVal) {
      PustakaUI.setFieldError(loanDueDateInput, 'Tanggal jatuh tempo tidak boleh lebih awal dari tanggal pinjam.');
      isValid = false;
    }

    if (!isValid) return;

    // 1. Catat transaksi peminjaman
    const newLoan = {
      id: PustakaStorage.generateNextLoanId(loans),
      memberId: selectedMemberId,
      bookId: selectedBookId,
      loanDate: loanDateVal,
      dueDate: dueDateVal,
      returnDate: null,
      status: 'Dipinjam',
      renewCount: 0,
      fineAmount: 0,
      finePaid: false
    };
    loans.push(newLoan);
    PustakaStorage.saveLoans(loans);

    // 2. Kurangi stok buku otomatis sebesar 1
    const updatedBooks = books.map((b) =>
      b.id === selectedBookId ? { ...b, stock: Math.max(0, b.stock - 1) } : b
    );
    PustakaStorage.saveBooks(updatedBooks);

    // Reset pilihan form
    const today = PustakaUtils.getTodayISO();
    loanMemberSelect.value = '';
    loanBookSelect.value = '';
    loanDateInput.value = today;
    loanDueDateInput.value = PustakaUtils.addDaysISO(today, 7);

    if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
      window.PustakaApp.renderAll();
    }
    PustakaUI.showToast(`Peminjaman ${newLoan.id} berhasil dicatat. Stok buku berkurang 1.`);
  }

  /**
   * Memproses perpanjangan masa pinjam (+7 hari).
   */
  function requestRenew(loanId) {
    const loans = PustakaStorage.getLoans();
    const books = PustakaStorage.getBooks();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== 'Dipinjam') return;

    const book = books.find((b) => b.id === loan.bookId);
    const today = PustakaUtils.getTodayISO();
    const lateDays = PustakaUtils.calculateLateDays(loan.dueDate, today);

    if (lateDays > 0) {
      PustakaUI.showToast('Buku yang sudah terlambat tidak dapat diperpanjang. Harap segera kembalikan di meja sirkulasi.', 'error');
      return;
    }

    const currentRenew = Number(loan.renewCount || 0);
    if (currentRenew >= PustakaUtils.CONFIG.MAX_RENEW_COUNT) {
      PustakaUI.showToast(`Masa pinjam buku ini sudah pernah diperpanjang (maksimal ${PustakaUtils.CONFIG.MAX_RENEW_COUNT}x).`, 'error');
      return;
    }

    const newDueDate = PustakaUtils.addDaysISO(loan.dueDate, 7);

    PustakaUI.openConfirmModal({
      title: 'Perpanjang Masa Pinjam (+7 Hari)',
      message: `Perpanjang masa pinjam buku "${book ? book.title : loan.bookId}" selama 7 hari? Tanggal jatuh tempo baru menjadi ${PustakaUtils.formatDateID(newDueDate)}.`,
      confirmText: 'Perpanjang Pinjaman',
      confirmClass: 'btn-secondary',
      onConfirm: () => {
        const updatedLoans = loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                dueDate: newDueDate,
                renewCount: currentRenew + 1
              }
            : l
        );
        PustakaStorage.saveLoans(updatedLoans);
        PustakaUI.closeConfirmModal();
        if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
          window.PustakaApp.renderAll();
        }
        PustakaUI.showToast(`Masa pinjam transaksi ${loan.id} berhasil diperpanjang hingga ${PustakaUtils.formatDateID(newDueDate)}.`);
      }
    });
  }

  /**
   * Memproses pengembalian buku, menghitung denda otomatis jika telat, dan mengembalikan stok +1.
   */
  function requestReturn(loanId) {
    const loans = PustakaStorage.getLoans();
    const books = PustakaStorage.getBooks();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== 'Dikembalikan') return;

    const book = books.find((b) => b.id === loan.bookId);
    const today = PustakaUtils.getTodayISO();
    const lateDays = PustakaUtils.calculateLateDays(loan.dueDate, today);
    const fine = lateDays * PustakaUtils.CONFIG.FINE_PER_DAY;

    const fineNotice = lateDays > 0
      ? ` Buku terlambat ${lateDays} hari dengan total denda ${PustakaUtils.formatRupiah(fine)}. Transaksi akan ditandai dengan denda lunas.`
      : ' Buku dikembalikan tepat waktu (tanpa denda).';

    PustakaUI.openConfirmModal({
      title: 'Konfirmasi Pengembalian Buku',
      message: `Kembalikan buku "${book ? book.title : loan.bookId}" untuk transaksi ${loan.id}?${fineNotice}`,
      confirmText: lateDays > 0 ? 'Bayar Denda & Kembalikan' : 'Kembalikan Buku',
      confirmClass: 'btn-primary',
      onConfirm: () => {
        const updatedLoans = loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                status: 'Dikembalikan',
                returnDate: today,
                fineAmount: fine,
                finePaid: fine > 0
              }
            : l
        );
        PustakaStorage.saveLoans(updatedLoans);

        const updatedBooks = books.map((b) =>
          b.id === loan.bookId ? { ...b, stock: Number(b.stock) + 1 } : b
        );
        PustakaStorage.saveBooks(updatedBooks);

        PustakaUI.closeConfirmModal();
        if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
          window.PustakaApp.renderAll();
        }
        PustakaUI.showToast('Buku berhasil dikembalikan dan stok bertambah 1.');
      }
    });
  }

  /**
   * Mengekspor data riwayat transaksi sirkulasi ke file CSV.
   */
  function exportCSV() {
    const loans = PustakaStorage.getLoans();
    const members = PustakaStorage.getMembers();
    const books = PustakaStorage.getBooks();

    if (loans.length === 0) {
      PustakaUI.showToast('Tidak ada data transaksi untuk diekspor.', 'error');
      return;
    }

    const rows = [
      ['ID Transaksi', 'ID Anggota', 'Nama Anggota', 'ID Buku', 'Judul Buku', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status', 'Jml Denda (Rp)', 'Denda Lunas']
    ];

    loans.forEach((l) => {
      const m = members.find((mem) => mem.id === l.memberId);
      const b = books.find((bk) => bk.id === l.bookId);
      rows.push([
        l.id,
        l.memberId,
        m ? m.name : l.memberId,
        l.bookId,
        b ? b.title : l.bookId,
        l.loanDate,
        l.dueDate,
        l.returnDate || '-',
        l.status,
        l.fineAmount || 0,
        l.finePaid ? 'Ya' : 'Tidak'
      ]);
    });

    PustakaUtils.downloadCSV(`laporan-sirkulasi-${PustakaUtils.getTodayISO()}.csv`, rows);
    PustakaUI.showToast('Laporan sirkulasi berhasil diekspor ke CSV.');
  }

  /**
   * Menginisialisasi event listeners modul Sirkulasi.
   */
  function init() {
    if (loanMemberSelect) {
      loanMemberSelect.addEventListener('change', () => {
        const selectedMemberId = loanMemberSelect.value;
        if (!selectedMemberId) {
          PustakaUI.setFieldError(loanMemberSelect, '');
          return;
        }
        const loans = PustakaStorage.getLoans();
        const activeLoans = loans.filter((l) => l.memberId === selectedMemberId && l.status === 'Dipinjam');
        const hasOverdue = activeLoans.some((l) => PustakaUtils.calculateLateDays(l.dueDate, PustakaUtils.getTodayISO()) > 0);

        if (activeLoans.length >= PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER) {
          PustakaUI.setFieldError(loanMemberSelect, `Perhatian: Anggota ini telah mencapai batas kuota (${activeLoans.length}/${PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER} buku). Kembalikan buku aktif terlebih dahulu.`);
        } else if (hasOverdue) {
          PustakaUI.setFieldError(loanMemberSelect, 'Perhatian: Anggota ini memiliki buku terlambat. Harap selesaikan pengembalian buku yang terlambat terlebih dahulu.');
        } else {
          PustakaUI.setFieldError(loanMemberSelect, '');
        }
      });
    }

    if (loanDateInput) {
      loanDateInput.addEventListener('change', () => {
        if (loanDateInput.value && loanDueDateInput) {
          loanDueDateInput.value = PustakaUtils.addDaysISO(loanDateInput.value, 7);
          PustakaUI.setFieldError(loanDueDateInput, '');
        }
      });
    }

    if (loanForm) loanForm.addEventListener('submit', handleSubmit);
    if (loanStatusFilter) loanStatusFilter.addEventListener('change', render);
    if (loanSearchInput) loanSearchInput.addEventListener('input', render);
    if (btnExportLoansCsv) btnExportLoansCsv.addEventListener('click', exportCSV);

    if (loansTableBody) {
      loansTableBody.addEventListener('click', (e) => {
        const returnBtn = e.target.closest('.btn-return-book');
        const renewBtn = e.target.closest('.btn-renew-book');

        if (returnBtn) {
          requestReturn(returnBtn.dataset.id);
        } else if (renewBtn) {
          requestRenew(renewBtn.dataset.id);
        }
      });
    }
  }

  return {
    init,
    render,
    getLoanStatusBadge,
    requestRenew,
    requestReturn,
    exportCSV
  };
})();
