/**
 * PustakaAkademika — Storage & Seed Data Management
 * Mengelola seluruh persistensi data di localStorage browser.
 */

window.PustakaStorage = (() => {
  const KEYS = {
    BOOKS: 'pustaka_books',
    MEMBERS: 'pustaka_members',
    LOANS: 'pustaka_loans'
  };

  const SEED_BOOKS = [
    {
      id: 'BK-001',
      isbn: '9786020332956',
      title: 'Algoritma dan Pemrograman Dasar',
      author: 'Rinaldi Munir',
      category: 'Teknologi',
      year: 2021,
      stock: 4
    },
    {
      id: 'BK-002',
      isbn: '9786024246945',
      title: 'Sapiens: Riwayat Singkat Umat Manusia',
      author: 'Yuval Noah Harari',
      category: 'Sejarah',
      year: 2018,
      stock: 3
    },
    {
      id: 'BK-003',
      isbn: '9789799731234',
      title: 'Bumi Manusia',
      author: 'Pramoedya Ananta Toer',
      category: 'Sastra',
      year: 2005,
      stock: 2
    },
    {
      id: 'BK-004',
      isbn: '9780132350884',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      category: 'Teknologi',
      year: 2008,
      stock: 5
    },
    {
      id: 'BK-005',
      isbn: '9780307887894',
      title: 'Principles of Microeconomics',
      author: 'N. Gregory Mankiw',
      category: 'Ekonomi',
      year: 2020,
      stock: 0
    },
    {
      id: 'BK-006',
      isbn: '9780553380163',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      category: 'Sains',
      year: 1998,
      stock: 3
    }
  ];

  const SEED_MEMBERS = [
    {
      id: 'MHS-2026001',
      name: 'Alya Putri Rahmawati',
      department: 'Teknik Informatika',
      phone: '081234567890',
      email: 'alya.putri@kampus.ac.id'
    },
    {
      id: 'MHS-2026002',
      name: 'Bagas Pratama Wijaya',
      department: 'Ekonomi Pembangunan',
      phone: '081298765432',
      email: 'bagas.pratama@kampus.ac.id'
    },
    {
      id: 'MHS-2026003',
      name: 'Citra Lestari Kusuma',
      department: 'Sastra Indonesia',
      phone: '085611223344',
      email: 'citra.lestari@kampus.ac.id'
    },
    {
      id: 'MHS-2026004',
      name: 'Dimas Adi Nugroho',
      department: 'Fisika Murni',
      phone: '087755667788',
      email: 'dimas.adi@kampus.ac.id'
    }
  ];

  const SEED_LOANS = [
    {
      id: 'TRX-001',
      memberId: 'MHS-2026001',
      bookId: 'BK-001',
      loanDate: '2026-11-10',
      dueDate: '2026-11-17',
      returnDate: null,
      status: 'Dipinjam',
      renewCount: 0,
      fineAmount: 0,
      finePaid: false
    },
    {
      id: 'TRX-002',
      memberId: 'MHS-2026003',
      bookId: 'BK-003',
      loanDate: '2026-11-01',
      dueDate: '2026-11-08',
      returnDate: '2026-11-07',
      status: 'Dikembalikan',
      renewCount: 0,
      fineAmount: 0,
      finePaid: true
    }
  ];

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      console.error(`Gagal membaca localStorage (${key}):`, error);
      return fallback;
    }
  }

  function safeWrite(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Gagal menyimpan ke localStorage (${key}):`, error);
      return false;
    }
  }

  function init() {
    if (localStorage.getItem(KEYS.BOOKS) === null) {
      safeWrite(KEYS.BOOKS, clone(SEED_BOOKS));
    }
    if (localStorage.getItem(KEYS.MEMBERS) === null) {
      safeWrite(KEYS.MEMBERS, clone(SEED_MEMBERS));
    }
    if (localStorage.getItem(KEYS.LOANS) === null) {
      safeWrite(KEYS.LOANS, clone(SEED_LOANS));
    }
  }

  function resetDemoData() {
    safeWrite(KEYS.BOOKS, clone(SEED_BOOKS));
    safeWrite(KEYS.MEMBERS, clone(SEED_MEMBERS));
    safeWrite(KEYS.LOANS, clone(SEED_LOANS));
  }

  function getBooks() {
    return safeRead(KEYS.BOOKS, []);
  }

  function saveBooks(books) {
    return safeWrite(KEYS.BOOKS, books);
  }

  function getMembers() {
    return safeRead(KEYS.MEMBERS, []);
  }

  function saveMembers(members) {
    return safeWrite(KEYS.MEMBERS, members);
  }

  function getLoans() {
    return safeRead(KEYS.LOANS, []);
  }

  function saveLoans(loans) {
    return safeWrite(KEYS.LOANS, loans);
  }

  function generateNextBookId(books) {
    let maxNum = 0;
    books.forEach((b) => {
      const match = /^BK-(\d+)$/i.exec(b.id);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    });
    return `BK-${String(maxNum + 1).padStart(3, '0')}`;
  }

  function generateNextLoanId(loans) {
    let maxNum = 0;
    loans.forEach((l) => {
      const match = /^TRX-(\d+)$/i.exec(l.id);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
    });
    return `TRX-${String(maxNum + 1).padStart(3, '0')}`;
  }

  return {
    init,
    resetDemoData,
    getBooks,
    saveBooks,
    getMembers,
    saveMembers,
    getLoans,
    saveLoans,
    generateNextBookId,
    generateNextLoanId
  };
})();