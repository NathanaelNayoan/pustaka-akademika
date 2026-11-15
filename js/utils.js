/**
 * PustakaAkademika — Modul Utilitas (PustakaUtils)
 * Menyediakan fungsi-fungsi pembantu: sanitasi HTML, tanggal, mata uang,
 * kalkulasi hari keterlambatan, dan ekspor CSV.
 */

window.PustakaUtils = (() => {
  // Konstanta Aturan Sistem Perpustakaan
  const CONFIG = {
    FINE_PER_DAY: 2000,          // Tarif denda per hari (Rp 2.000)
    MAX_LOANS_PER_MEMBER: 3,     // Kuota maksimal buku aktif per anggota
    MAX_RENEW_COUNT: 1           // Maksimal perpanjangan masa pinjam (1 kali)
  };

  /**
   * Mencegah celah XSS dengan mengubah karakter khusus HTML menjadi entitas teks aman.
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Mendapatkan tanggal hari ini dalam format standar ISO 'YYYY-MM-DD'.
   */
  function getTodayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Menambahkan sejumlah hari ke tanggal ISO yang diberikan.
   */
  function addDaysISO(isoDate, days) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  /**
   * Memformat tanggal ISO menjadi teks tanggal bahasa Indonesia yang ramah (contoh: 15 Nov 2026).
   */
  function formatDateID(isoDate) {
    if (!isoDate) return '-';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Menghitung jumlah hari keterlambatan secara akurat berbasis UTC tanpa terpengaruh DST/timezone.
   */
  function calculateLateDays(dueDateStr, compareDateStr) {
    if (!dueDateStr || !compareDateStr) return 0;
    const [dy, dm, dd] = dueDateStr.split('-').map(Number);
    const [cy, cm, cd] = compareDateStr.split('-').map(Number);
    const dueUtc = Date.UTC(dy, dm - 1, dd);
    const compareUtc = Date.UTC(cy, cm - 1, cd);
    const diffMs = compareUtc - dueUtc;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Memformat angka nominal menjadi format mata uang Rupiah Indonesia (contoh: Rp 10.000).
   */
  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Mengunduh baris data array menjadi file CSV dengan UTF-8 BOM agar kompatibel dengan Microsoft Excel.
   */
  function downloadCSV(filename, rows) {
    const csvContent = rows
      .map((row) =>
        row
          .map((cell) => {
            const str = cell === null || cell === undefined ? '' : String(cell);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    CONFIG,
    escapeHTML,
    getTodayISO,
    addDaysISO,
    formatDateID,
    calculateLateDays,
    formatRupiah,
    downloadCSV
  };
})();
