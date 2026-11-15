/**
 * PustakaAkademika — Modul Manajemen Katalog Buku (PustakaBooks)
 * Menangani CRUD Buku, Filter Kategori & Ketersediaan, Pencarian Real-time,
 * Integrasi Open Library API Autocomplete, dan Ekspor CSV Buku.
 */

window.PustakaBooks = (() => {
  // DOM Elements Books View
  const bookSearchInput = document.getElementById('bookSearchInput');
  const bookCategoryFilter = document.getElementById('bookCategoryFilter');
  const bookAvailabilityFilter = document.getElementById('bookAvailabilityFilter');
  const btnOpenAddBook = document.getElementById('btnOpenAddBook');
  const btnExportBooksCsv = document.getElementById('btnExportBooksCsv');
  const booksTableBody = document.getElementById('booksTableBody');
  const booksCountInfo = document.getElementById('booksCountInfo');

  // DOM Elements Book Modal
  const bookModal = document.getElementById('bookModal');
  const bookModalTitle = document.getElementById('bookModalTitle');
  const btnCloseBookModal = document.getElementById('btnCloseBookModal');
  const btnCancelBookModal = document.getElementById('btnCancelBookModal');
  const bookForm = document.getElementById('bookForm');
  const bookEditId = document.getElementById('bookEditId');
  const bookIsbn = document.getElementById('bookIsbn');
  const bookTitle = document.getElementById('bookTitle');
  const bookAuthor = document.getElementById('bookAuthor');
  const bookCategory = document.getElementById('bookCategory');
  const bookYear = document.getElementById('bookYear');
  const bookStock = document.getElementById('bookStock');

  // DOM Elements Open Library API
  const apiSearchInput = document.getElementById('apiSearchInput');
  const btnApiSearch = document.getElementById('btnApiSearch');
  const apiStatusMessage = document.getElementById('apiStatusMessage');
  const apiResultsList = document.getElementById('apiResultsList');

  /**
   * Merender daftar koleksi buku ke dalam tabel sesuai filter dan kata kunci pencarian.
   */
  function render() {
    if (!booksTableBody) return;
    const books = PustakaStorage.getBooks();
    const query = bookSearchInput ? bookSearchInput.value.trim().toLowerCase() : '';
    const category = bookCategoryFilter ? bookCategoryFilter.value : 'ALL';
    const availability = bookAvailabilityFilter ? bookAvailabilityFilter.value : 'ALL';

    const filtered = books.filter((book) => {
      const matchesQuery =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query);

      const matchesCategory = category === 'ALL' || book.category === category;

      const matchesAvailability =
        availability === 'ALL' ||
        (availability === 'AVAILABLE' && book.stock > 0) ||
        (availability === 'EMPTY' && book.stock === 0);

      return matchesQuery && matchesCategory && matchesAvailability;
    });

    if (booksCountInfo) {
      booksCountInfo.textContent = `${filtered.length} buku`;
    }

    if (filtered.length === 0) {
      booksTableBody.innerHTML = '<tr><td colspan="7" class="empty-state-cell">Tidak ada buku yang sesuai dengan filter.</td></tr>';
      return;
    }

    booksTableBody.innerHTML = filtered.map((book) => {
      const statusBadge = book.stock > 0
        ? '<span class="badge badge-available">Tersedia</span>'
        : '<span class="badge badge-empty">Habis</span>';

      return `
        <tr>
          <td>
            <div class="cell-title">${PustakaUtils.escapeHTML(book.isbn)}</div>
            <div class="cell-sub">${PustakaUtils.escapeHTML(book.id)}</div>
          </td>
          <td>
            <div class="cell-title">${PustakaUtils.escapeHTML(book.title)}</div>
            <div class="cell-sub">${PustakaUtils.escapeHTML(book.author)}</div>
          </td>
          <td><span class="badge badge-category">${PustakaUtils.escapeHTML(book.category)}</span></td>
          <td>${PustakaUtils.escapeHTML(book.year)}</td>
          <td><strong>${PustakaUtils.escapeHTML(book.stock)}</strong></td>
          <td>${statusBadge}</td>
          <td class="text-right">
            <div class="action-buttons">
              <button type="button" class="btn btn-outline btn-sm btn-edit-book" data-id="${PustakaUtils.escapeHTML(book.id)}">
                Edit
              </button>
              <button type="button" class="btn btn-danger-outline btn-sm btn-delete-book" data-id="${PustakaUtils.escapeHTML(book.id)}">
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Membuka modal form untuk tambah baru atau edit data buku.
   */
  function openModal(bookToEdit = null) {
    if (!bookModal) return;
    PustakaUI.clearFormErrors(bookForm);

    if (apiSearchInput) apiSearchInput.value = '';
    if (apiStatusMessage) {
      apiStatusMessage.textContent = '';
      apiStatusMessage.className = 'api-status';
    }
    if (apiResultsList) {
      apiResultsList.innerHTML = '';
      apiResultsList.hidden = true;
    }

    if (bookToEdit) {
      bookModalTitle.textContent = 'Edit Data Buku';
      bookEditId.value = bookToEdit.id;
      bookIsbn.value = bookToEdit.isbn;
      bookTitle.value = bookToEdit.title;
      bookAuthor.value = bookToEdit.author;
      bookCategory.value = bookToEdit.category;
      bookYear.value = bookToEdit.year;
      bookStock.value = bookToEdit.stock;
    } else {
      bookModalTitle.textContent = 'Tambah Buku Baru';
      bookForm.reset();
      bookEditId.value = '';
    }

    bookModal.hidden = false;
    bookIsbn.focus();
  }

  /**
   * Menutup modal form buku.
   */
  function closeModal() {
    if (bookModal) bookModal.hidden = true;
  }

  /**
   * Mengambil data buku dari Open Library Public API secara otomatis.
   */
  async function handleApiSearch() {
    const query = apiSearchInput.value.trim();
    if (!query) {
      apiStatusMessage.textContent = 'Masukkan judul buku atau ISBN terlebih dahulu.';
      apiStatusMessage.className = 'api-status is-error';
      apiResultsList.hidden = true;
      return;
    }

    btnApiSearch.disabled = true;
    btnApiSearch.textContent = 'Mencari...';
    apiStatusMessage.textContent = 'Sedang mencari di Open Library API...';
    apiStatusMessage.className = 'api-status';
    apiResultsList.hidden = true;
    apiResultsList.innerHTML = '';

    try {
      const results = await PustakaAPI.searchOpenLibrary(query);

      if (results.length === 0) {
        apiStatusMessage.textContent = 'Tidak ditemukan hasil untuk kata kunci tersebut.';
        apiStatusMessage.className = 'api-status is-error';
        return;
      }

      apiStatusMessage.textContent = `Ditemukan ${results.length} hasil. Klik salah satu untuk mengisi form otomatis:`;
      apiResultsList.hidden = false;

      results.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'api-result-item';
        li.tabIndex = 0;

        const yearText = item.year ? ` (${item.year})` : '';
        const isbnText = item.isbn ? ` &bull; ISBN: ${PustakaUtils.escapeHTML(item.isbn)}` : '';

        li.innerHTML = `
          <div class="api-result-title">${PustakaUtils.escapeHTML(item.title)}${PustakaUtils.escapeHTML(yearText)}</div>
          <div class="api-result-meta">Penulis: ${PustakaUtils.escapeHTML(item.author)}${isbnText}</div>
        `;

        const fillForm = () => {
          if (item.isbn) bookIsbn.value = item.isbn;
          bookTitle.value = item.title;
          bookAuthor.value = item.author;
          if (item.year) bookYear.value = item.year;
          if (item.suggestedCategory) bookCategory.value = item.suggestedCategory;
          if (!bookStock.value) bookStock.value = 3;

          PustakaUI.clearFormErrors(bookForm);
          apiResultsList.hidden = true;
          apiStatusMessage.textContent = 'Data buku berhasil diisi otomatis dari Open Library.';
          apiStatusMessage.className = 'api-status';
        };

        li.addEventListener('click', fillForm);
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fillForm();
          }
        });

        apiResultsList.appendChild(li);
      });
    } catch (error) {
      apiStatusMessage.textContent = `Gagal mengambil data: ${error.message}`;
      apiStatusMessage.className = 'api-status is-error';
    } finally {
      btnApiSearch.disabled = false;
      btnApiSearch.textContent = 'Cari API';
    }
  }

  /**
   * Menangani pengiriman form buku (validasi duplikasi ISBN, tahun valid, stok valid).
   */
  function handleSubmit(e) {
    e.preventDefault();
    PustakaUI.clearFormErrors(bookForm);

    const editingId = bookEditId.value.trim();
    const isbnVal = bookIsbn.value.trim();
    const titleVal = bookTitle.value.trim();
    const authorVal = bookAuthor.value.trim();
    const categoryVal = bookCategory.value;
    const yearRaw = bookYear.value.trim();
    const stockRaw = bookStock.value.trim();

    const books = PustakaStorage.getBooks();
    let isValid = true;

    // Validasi Kode/ISBN
    if (!isbnVal) {
      PustakaUI.setFieldError(bookIsbn, 'Kode atau ISBN buku wajib diisi.');
      isValid = false;
    } else {
      const duplicateIsbn = books.some(
        (b) => b.isbn.toLowerCase() === isbnVal.toLowerCase() && b.id !== editingId
      );
      if (duplicateIsbn) {
        PustakaUI.setFieldError(bookIsbn, 'Kode / ISBN ini sudah terdaftar pada buku lain.');
        isValid = false;
      }
    }

    // Validasi Judul
    if (!titleVal) {
      PustakaUI.setFieldError(bookTitle, 'Judul buku wajib diisi.');
      isValid = false;
    }

    // Validasi Penulis
    if (!authorVal) {
      PustakaUI.setFieldError(bookAuthor, 'Nama penulis wajib diisi.');
      isValid = false;
    }

    // Validasi Kategori
    if (!categoryVal) {
      PustakaUI.setFieldError(bookCategory, 'Silakan pilih kategori buku.');
      isValid = false;
    }

    // Validasi Tahun (4 digit valid)
    const currentYear = new Date().getFullYear();
    const yearNum = Number(yearRaw);
    if (!yearRaw || !/^\d{4}$/.test(yearRaw) || yearNum < 1000 || yearNum > currentYear + 1) {
      PustakaUI.setFieldError(bookYear, `Tahun terbit harus 4 digit angka valid (1000 - ${currentYear + 1}).`);
      isValid = false;
    }

    // Validasi Stok (>= 0)
    const stockNum = Number(stockRaw);
    if (stockRaw === '' || !Number.isInteger(stockNum) || stockNum < 0) {
      PustakaUI.setFieldError(bookStock, 'Jumlah stok harus berupa bilangan bulat minimal 0.');
      isValid = false;
    }

    if (!isValid) return;

    if (editingId) {
      const updatedBooks = books.map((b) =>
        b.id === editingId
          ? {
              ...b,
              isbn: isbnVal,
              title: titleVal,
              author: authorVal,
              category: categoryVal,
              year: yearNum,
              stock: stockNum
            }
          : b
      );
      PustakaStorage.saveBooks(updatedBooks);
      PustakaUI.showToast('Data buku berhasil diperbarui.');
    } else {
      const newBook = {
        id: PustakaStorage.generateNextBookId(books),
        isbn: isbnVal,
        title: titleVal,
        author: authorVal,
        category: categoryVal,
        year: yearNum,
        stock: stockNum
      };
      books.push(newBook);
      PustakaStorage.saveBooks(books);
      PustakaUI.showToast('Buku berhasil ditambahkan ke katalog.');
    }

    closeModal();
    if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
      window.PustakaApp.renderAll();
    }
  }

  /**
   * Menghapus buku setelah memastikan tidak ada pinjaman aktif yang sedang meminjamnya.
   */
  function requestDelete(bookId) {
    const books = PustakaStorage.getBooks();
    const loans = PustakaStorage.getLoans();
    const target = books.find((b) => b.id === bookId);
    if (!target) return;

    const isCurrentlyBorrowed = loans.some(
      (l) => l.bookId === bookId && l.status === 'Dipinjam'
    );

    if (isCurrentlyBorrowed) {
      PustakaUI.showToast('Buku tidak dapat dihapus karena sedang dipinjam oleh anggota.', 'error');
      return;
    }

    PustakaUI.openConfirmModal({
      title: 'Hapus Buku',
      message: `Apakah Anda yakin ingin menghapus buku "${target.title}" (${target.isbn}) dari katalog?`,
      confirmText: 'Hapus Buku',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        const remaining = books.filter((b) => b.id !== bookId);
        PustakaStorage.saveBooks(remaining);
        PustakaUI.closeConfirmModal();
        if (window.PustakaApp && typeof window.PustakaApp.renderAll === 'function') {
          window.PustakaApp.renderAll();
        }
        PustakaUI.showToast('Buku berhasil dihapus.');
      }
    });
  }

  /**
   * Mengekspor seluruh data koleksi buku ke file CSV.
   */
  function exportCSV() {
    const books = PustakaStorage.getBooks();
    if (books.length === 0) {
      PustakaUI.showToast('Tidak ada data buku untuk diekspor.', 'error');
      return;
    }
    const rows = [
      ['ID Buku', 'Kode / ISBN', 'Judul Buku', 'Penulis', 'Kategori', 'Tahun Terbit', 'Jumlah Stok', 'Status']
    ];
    books.forEach((b) => {
      rows.push([
        b.id,
        b.isbn,
        b.title,
        b.author,
        b.category,
        b.year,
        b.stock,
        b.stock > 0 ? 'Tersedia' : 'Habis'
      ]);
    });
    PustakaUtils.downloadCSV(`koleksi-buku-pustaka-${PustakaUtils.getTodayISO()}.csv`, rows);
    PustakaUI.showToast('Data koleksi buku berhasil diekspor ke CSV.');
  }

  /**
   * Menginisialisasi seluruh event listeners modul Buku.
   */
  function init() {
    if (bookSearchInput) bookSearchInput.addEventListener('input', render);
    if (bookCategoryFilter) bookCategoryFilter.addEventListener('change', render);
    if (bookAvailabilityFilter) bookAvailabilityFilter.addEventListener('change', render);
    if (btnOpenAddBook) btnOpenAddBook.addEventListener('click', () => openModal(null));
    if (btnExportBooksCsv) btnExportBooksCsv.addEventListener('click', exportCSV);

    if (booksTableBody) {
      booksTableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-book');
        const deleteBtn = e.target.closest('.btn-delete-book');

        if (editBtn) {
          const book = PustakaStorage.getBooks().find((b) => b.id === editBtn.dataset.id);
          if (book) openModal(book);
        } else if (deleteBtn) {
          requestDelete(deleteBtn.dataset.id);
        }
      });
    }

    if (btnCloseBookModal) btnCloseBookModal.addEventListener('click', closeModal);
    if (btnCancelBookModal) btnCancelBookModal.addEventListener('click', closeModal);
    if (bookForm) bookForm.addEventListener('submit', handleSubmit);
    if (btnApiSearch) btnApiSearch.addEventListener('click', handleApiSearch);
    if (apiSearchInput) {
      apiSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleApiSearch();
        }
      });
    }
  }

  return {
    init,
    render,
    openModal,
    closeModal,
    exportCSV
  };
})();
