/**
 * PustakaAkademika — Modul Manajemen Anggota Perpustakaan (PustakaMembers)
 * Menangani CRUD Anggota, Indikator Tanggungan Pinjaman, Modal Detail Riwayat Anggota,
 * dan Ekspor CSV Data Anggota.
 */

window.PustakaMembers = (() => {
  // DOM Elements Members View
  const memberSearchInput = document.getElementById('memberSearchInput');
  const btnOpenAddMember = document.getElementById('btnOpenAddMember');
  const btnExportMembersCsv = document.getElementById('btnExportMembersCsv');
  const membersTableBody = document.getElementById('membersTableBody');
  const membersCountInfo = document.getElementById('membersCountInfo');

  // DOM Elements Member Form Modal
  const memberModal = document.getElementById('memberModal');
  const memberModalTitle = document.getElementById('memberModalTitle');
  const btnCloseMemberModal = document.getElementById('btnCloseMemberModal');
  const btnCancelMemberModal = document.getElementById('btnCancelMemberModal');
  const memberForm = document.getElementById('memberForm');
  const memberEditId = document.getElementById('memberEditId');
  const memberId = document.getElementById('memberId');
  const memberName = document.getElementById('memberName');
  const memberDepartment = document.getElementById('memberDepartment');
  const memberPhone = document.getElementById('memberPhone');
  const memberEmail = document.getElementById('memberEmail');

  // DOM Elements Member Detail Modal
  const memberDetailModal = document.getElementById('memberDetailModal');
  const memberDetailModalTitle = document.getElementById('memberDetailModalTitle');
  const memberDetailBody = document.getElementById('memberDetailBody');
  const btnCloseMemberDetailModal = document.getElementById('btnCloseMemberDetailModal');
  const btnCancelMemberDetailModal = document.getElementById('btnCancelMemberDetailModal');

  /**
   * Merender daftar anggota ke dalam tabel beserta status kuota pinjaman aktif.
   */
  function render() {
    if (!membersTableBody) return;
    const members = PustakaStorage.getMembers();
    const loans = PustakaStorage.getLoans();
    const query = memberSearchInput ? memberSearchInput.value.trim().toLowerCase() : '';
    const today = PustakaUtils.getTodayISO();

    const filtered = members.filter((m) => {
      return (
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.department.toLowerCase().includes(query)
      );
    });

    if (membersCountInfo) {
      membersCountInfo.textContent = `${filtered.length} anggota`;
    }

    if (filtered.length === 0) {
      membersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state-cell">Tidak ada data anggota yang ditemukan.</td></tr>';
      return;
    }

    membersTableBody.innerHTML = filtered.map((member) => {
      const activeLoans = loans.filter(
        (l) => l.memberId === member.id && l.status === 'Dipinjam'
      );
      const activeLoanCount = activeLoans.length;
      const hasOverdue = activeLoans.some((l) => PustakaUtils.calculateLateDays(l.dueDate, today) > 0);

      let loanBadge = '<span class="badge badge-returned">0 buku</span>';
      if (activeLoanCount >= PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER) {
        loanBadge = `<span class="badge badge-overdue" title="Batas kuota pinjaman maksimal telah tercapai">${activeLoanCount}/3 buku (Penuh)</span>`;
      } else if (hasOverdue) {
        loanBadge = `<span class="badge badge-overdue" title="Memiliki pinjaman yang telah melewati jatuh tempo">${activeLoanCount} buku (Ada Terlambat)</span>`;
      } else if (activeLoanCount > 0) {
        loanBadge = `<span class="badge badge-borrowed">${activeLoanCount} buku</span>`;
      }

      return `
        <tr>
          <td><strong>${PustakaUtils.escapeHTML(member.id)}</strong></td>
          <td><div class="cell-title">${PustakaUtils.escapeHTML(member.name)}</div></td>
          <td>${PustakaUtils.escapeHTML(member.department)}</td>
          <td>
            <div>${PustakaUtils.escapeHTML(member.phone)}</div>
            <div class="cell-sub">${PustakaUtils.escapeHTML(member.email)}</div>
          </td>
          <td>${loanBadge}</td>
          <td class="text-right">
            <div class="action-buttons">
              <button type="button" class="btn btn-outline btn-sm btn-view-member" data-id="${PustakaUtils.escapeHTML(member.id)}" title="Lihat profil & riwayat pinjaman">
                Detail
              </button>
              <button type="button" class="btn btn-outline btn-sm btn-edit-member" data-id="${PustakaUtils.escapeHTML(member.id)}">
                Edit
              </button>
              <button type="button" class="btn btn-danger-outline btn-sm btn-delete-member" data-id="${PustakaUtils.escapeHTML(member.id)}">
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Membuka modal form tambah / edit anggota.
   */
  function openModal(memberToEdit = null) {
    if (!memberModal) return;
    PustakaUI.clearFormErrors(memberForm);

    if (memberToEdit) {
      memberModalTitle.textContent = 'Edit Data Anggota';
      memberEditId.value = memberToEdit.id;
      memberId.value = memberToEdit.id;
      memberName.value = memberToEdit.name;
      memberDepartment.value = memberToEdit.department;
      memberPhone.value = memberToEdit.phone;
      memberEmail.value = memberToEdit.email;
    } else {
      memberModalTitle.textContent = 'Tambah Anggota Baru';
      memberForm.reset();
      memberEditId.value = '';
    }

    memberModal.hidden = false;
    memberId.focus();
  }

  /**
   * Menutup modal form anggota.
   */
  function closeModal() {
    if (memberModal) memberModal.hidden = true;
  }

  /**
   * Menangani pengiriman form pendaftaran/pembaruan anggota dengan validasi lengkap.
   */
  function handleSubmit(e) {
    e.preventDefault();
    PustakaUI.clearFormErrors(memberForm);

    const editingOriginalId = memberEditId.value.trim();
    const idVal = memberId.value.trim();
    const nameVal = memberName.value.trim();
    const deptVal = memberDepartment.value.trim();
    const phoneVal = memberPhone.value.trim();
    const emailVal = memberEmail.value.trim();

    const members = PustakaStorage.getMembers();
    let isValid = true;

    // Validasi ID Anggota & Cek Duplikasi
    if (!idVal) {
      PustakaUI.setFieldError(memberId, 'ID Anggota (NIM/NIS) wajib diisi.');
      isValid = false;
    } else {
      const duplicateId = members.some(
        (m) => m.id.toLowerCase() === idVal.toLowerCase() && m.id !== editingOriginalId
      );
      if (duplicateId) {
        PustakaUI.setFieldError(memberId, 'ID Anggota ini sudah terdaftar.');
        isValid = false;
      }
    }

    if (!nameVal) {
      PustakaUI.setFieldError(memberName, 'Nama lengkap anggota wajib diisi.');
      isValid = false;
    }

    if (!deptVal) {
      PustakaUI.setFieldError(memberDepartment, 'Fakultas / Jurusan / Kelas wajib diisi.');
      isValid = false;
    }

    if (!phoneVal || !/^[0-9+\-\s]{8,16}$/.test(phoneVal)) {
      PustakaUI.setFieldError(memberPhone, 'Nomor telepon tidak valid (8-16 digit angka).');
      isValid = false;
    }

    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      PustakaUI.setFieldError(memberEmail, 'Format email tidak valid.');
      isValid = false;
    }

    if (!isValid) return;

    if (editingOriginalId) {
      const updatedMembers = members.map((m) =>
        m.id === editingOriginalId
          ? {
              id: idVal,
              name: nameVal,
              department: deptVal,
              phone: phoneVal,
              email: emailVal
            }
          : m
      );
      PustakaStorage.saveMembers(updatedMembers);

      // Sinkronkan referensi memberId di riwayat pinjaman jika ID diubah
      if (idVal !== editingOriginalId) {
        const loans = PustakaStorage.getLoans().map((l) =>
          l.memberId === editingOriginalId ? { ...l, memberId: idVal } : l
        );
        PustakaStorage.saveLoans(loans);
      }

      PustakaUI.showToast('Data anggota berhasil diperbarui.');
    } else {
      members.push({
        id: idVal,
        name: nameVal,
        department: deptVal,
        phone: phoneVal,
        email: emailVal
      });
      PustakaStorage.saveMembers(members);
      PustakaUI.showToast('Anggota baru berhasil didaftarkan.');
    }

    closeModal();
    if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
      window.PustakaApp.renderAll();
    }
  }

  /**
   * Menghapus anggota setelah memastikan tidak memiliki tanggungan pinjaman aktif.
   */
  function requestDelete(targetMemberId) {
    const members = PustakaStorage.getMembers();
    const loans = PustakaStorage.getLoans();
    const target = members.find((m) => m.id === targetMemberId);
    if (!target) return;

    const activeLoans = loans.filter(
      (l) => l.memberId === targetMemberId && l.status === 'Dipinjam'
    );

    if (activeLoans.length > 0) {
      PustakaUI.showToast(
        `Anggota tidak dapat dihapus karena masih meminjam ${activeLoans.length} buku.`,
        'error'
      );
      return;
    }

    PustakaUI.openConfirmModal({
      title: 'Hapus Anggota',
      message: `Apakah Anda yakin ingin menghapus data anggota "${target.name}" (${target.id})?`,
      confirmText: 'Hapus Anggota',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        const remaining = members.filter((m) => m.id !== targetMemberId);
        PustakaStorage.saveMembers(remaining);
        PustakaUI.closeConfirmModal();
        if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
          window.PustakaApp.renderAll();
        }
        PustakaUI.showToast('Data anggota berhasil dihapus.');
      }
    });
  }

  /**
   * Membuka modal profil detail dan riwayat transaksi peminjaman milik anggota tertentu.
   */
  function openDetailModal(targetMemberId) {
    if (!memberDetailModal) return;
    const member = PustakaStorage.getMembers().find((m) => m.id === targetMemberId);
    if (!member) return;

    const loans = PustakaStorage.getLoans();
    const books = PustakaStorage.getBooks();

    const memberLoans = loans.filter((l) => l.memberId === targetMemberId);
    const activeLoans = memberLoans.filter((l) => l.status === 'Dipinjam');
    const historyLoans = memberLoans.filter((l) => l.status === 'Dikembalikan');

    memberDetailModalTitle.textContent = `Profil Anggota — ${member.name}`;

    let activeHtml = '';
    if (activeLoans.length === 0) {
      activeHtml = '<p class="cell-sub">Tidak ada buku yang sedang dipinjam saat ini.</p>';
    } else {
      activeHtml = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Judul Buku</th>
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${activeLoans.map((l) => {
                const book = books.find((b) => b.id === l.bookId);
                const statusBadge = PustakaCirculation ? PustakaCirculation.getLoanStatusBadge(l) : l.status;
                return `
                  <tr>
                    <td><strong>${PustakaUtils.escapeHTML(l.id)}</strong></td>
                    <td>${PustakaUtils.escapeHTML(book ? book.title : l.bookId)}</td>
                    <td>${PustakaUtils.formatDateID(l.loanDate)}</td>
                    <td>${PustakaUtils.formatDateID(l.dueDate)}</td>
                    <td>${statusBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    let historyHtml = '';
    if (historyLoans.length === 0) {
      historyHtml = '<p class="cell-sub">Belum ada riwayat pengembalian buku.</p>';
    } else {
      historyHtml = `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID Transaksi</th>
                <th>Judul Buku</th>
                <th>Tgl Pinjam</th>
                <th>Tgl Kembali</th>
                <th>Denda</th>
              </tr>
            </thead>
            <tbody>
              ${historyLoans.map((l) => {
                const book = books.find((b) => b.id === l.bookId);
                const fineStr = l.fineAmount ? PustakaUtils.formatRupiah(l.fineAmount) : 'Rp 0';
                return `
                  <tr>
                    <td><strong>${PustakaUtils.escapeHTML(l.id)}</strong></td>
                    <td>${PustakaUtils.escapeHTML(book ? book.title : l.bookId)}</td>
                    <td>${PustakaUtils.formatDateID(l.loanDate)}</td>
                    <td>${PustakaUtils.formatDateID(l.returnDate)}</td>
                    <td>${fineStr}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    memberDetailBody.innerHTML = `
      <div class="member-profile-header">
        <div class="member-profile-item">
          <span class="member-profile-label">Nomor Induk (NIM / NIS)</span>
          <span class="member-profile-value">${PustakaUtils.escapeHTML(member.id)}</span>
        </div>
        <div class="member-profile-item">
          <span class="member-profile-label">Nama Lengkap</span>
          <span class="member-profile-value">${PustakaUtils.escapeHTML(member.name)}</span>
        </div>
        <div class="member-profile-item">
          <span class="member-profile-label">Fakultas / Jurusan</span>
          <span class="member-profile-value">${PustakaUtils.escapeHTML(member.department)}</span>
        </div>
        <div class="member-profile-item">
          <span class="member-profile-label">Kontak &amp; Email</span>
          <span class="member-profile-value">${PustakaUtils.escapeHTML(member.phone)} &bull; ${PustakaUtils.escapeHTML(member.email)}</span>
        </div>
      </div>

      <div class="member-detail-section">
        <h4 class="member-detail-title">
          <span>Buku Sedang Dipinjam (${activeLoans.length}/${PustakaUtils.CONFIG.MAX_LOANS_PER_MEMBER})</span>
        </h4>
        ${activeHtml}
      </div>

      <div class="member-detail-section">
        <h4 class="member-detail-title">
          <span>Riwayat Peminjaman Selesai (${historyLoans.length})</span>
        </h4>
        ${historyHtml}
      </div>
    `;

    memberDetailModal.hidden = false;
  }

  /**
   * Menutup modal detail anggota.
   */
  function closeDetailModal() {
    if (memberDetailModal) memberDetailModal.hidden = true;
  }

  /**
   * Mengekspor seluruh data anggota ke file CSV.
   */
  function exportCSV() {
    const members = PustakaStorage.getMembers();
    const loans = PustakaStorage.getLoans();
    if (members.length === 0) {
      PustakaUI.showToast('Tidak ada data anggota untuk diekspor.', 'error');
      return;
    }
    const rows = [
      ['ID Anggota (NIM/NIS)', 'Nama Lengkap', 'Fakultas / Jurusan', 'Nomor Telepon', 'Email', 'Pinjaman Aktif']
    ];
    members.forEach((m) => {
      const activeCount = loans.filter((l) => l.memberId === m.id && l.status === 'Dipinjam').length;
      rows.push([m.id, m.name, m.department, m.phone, m.email, activeCount]);
    });
    PustakaUtils.downloadCSV(`data-anggota-pustaka-${PustakaUtils.getTodayISO()}.csv`, rows);
    PustakaUI.showToast('Data anggota berhasil diekspor ke CSV.');
  }

  /**
   * Menginisialisasi seluruh event listeners modul Anggota.
   */
  function init() {
    if (memberSearchInput) memberSearchInput.addEventListener('input', render);
    if (btnOpenAddMember) btnOpenAddMember.addEventListener('click', () => openModal(null));
    if (btnExportMembersCsv) btnExportMembersCsv.addEventListener('click', exportCSV);

    if (membersTableBody) {
      membersTableBody.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.btn-view-member');
        const editBtn = e.target.closest('.btn-edit-member');
        const deleteBtn = e.target.closest('.btn-delete-member');

        if (viewBtn) {
          openDetailModal(viewBtn.dataset.id);
        } else if (editBtn) {
          const member = PustakaStorage.getMembers().find((m) => m.id === editBtn.dataset.id);
          if (member) openModal(member);
        } else if (deleteBtn) {
          requestDelete(deleteBtn.dataset.id);
        }
      });
    }

    if (btnCloseMemberModal) btnCloseMemberModal.addEventListener('click', closeModal);
    if (btnCancelMemberModal) btnCancelMemberModal.addEventListener('click', closeModal);
    if (memberForm) memberForm.addEventListener('submit', handleSubmit);

    if (btnCloseMemberDetailModal) btnCloseMemberDetailModal.addEventListener('click', closeDetailModal);
    if (btnCancelMemberDetailModal) btnCancelMemberDetailModal.addEventListener('click', closeDetailModal);
  }

  return {
    init,
    render,
    openModal,
    closeModal,
    openDetailModal,
    closeDetailModal,
    exportCSV
  };
})();
