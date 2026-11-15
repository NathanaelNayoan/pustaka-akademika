/**
 * PustakaAkademika — Modul Dashboard & Analitik (PustakaDashboard)
 * Mengelola kartu metrik KPI (dengan animasi count-up), visualisasi data Chart.js
 * (Doughnut Kategori & Bar Sirkulasi) beserta fallback offline, dan tabel aktivitas terbaru.
 */

window.PustakaDashboard = (() => {
  let categoryChartInstance = null;
  let circulationChartInstance = null;

  // DOM Elements Dashboard
  const kpiTotalTitles = document.getElementById('kpiTotalTitles');
  const kpiTotalStock = document.getElementById('kpiTotalStock');
  const kpiTotalMembers = document.getElementById('kpiTotalMembers');
  const kpiActiveLoans = document.getElementById('kpiActiveLoans');
  const recentLoansBody = document.getElementById('recentLoansBody');

  /**
   * Merender seluruh data statistik metrik dan tabel sirkulasi terbaru di Dashboard.
   */
  function render() {
    const books = PustakaStorage.getBooks();
    const members = PustakaStorage.getMembers();
    const loans = PustakaStorage.getLoans();

    const totalStock = books.reduce((sum, b) => sum + Number(b.stock || 0), 0);
    const activeLoansCount = loans.filter((l) => l.status === 'Dipinjam').length;

    // Animasi counter interaktif untuk KPI Cards
    if (kpiTotalTitles) PustakaUI.animateValue(kpiTotalTitles, parseInt(kpiTotalTitles.textContent) || 0, books.length);
    if (kpiTotalStock) PustakaUI.animateValue(kpiTotalStock, parseInt(kpiTotalStock.textContent) || 0, totalStock);
    if (kpiTotalMembers) PustakaUI.animateValue(kpiTotalMembers, parseInt(kpiTotalMembers.textContent) || 0, members.length);
    if (kpiActiveLoans) PustakaUI.animateValue(kpiActiveLoans, parseInt(kpiActiveLoans.textContent) || 0, activeLoansCount);

    const recentLoans = [...loans].reverse().slice(0, 5);
    if (recentLoansBody) {
      if (recentLoans.length === 0) {
        recentLoansBody.innerHTML = '<tr><td colspan="6" class="empty-state-cell">Belum ada aktivitas peminjaman.</td></tr>';
      } else {
        recentLoansBody.innerHTML = recentLoans.map((loan) => {
          const member = members.find((m) => m.id === loan.memberId);
          const book = books.find((b) => b.id === loan.bookId);
          const statusBadge = PustakaCirculation ? PustakaCirculation.getLoanStatusBadge(loan) : loan.status;

          return `
            <tr>
              <td><strong>${PustakaUtils.escapeHTML(loan.id)}</strong></td>
              <td>${PustakaUtils.escapeHTML(member ? member.name : loan.memberId)}</td>
              <td>${PustakaUtils.escapeHTML(book ? book.title : loan.bookId)}</td>
              <td>${PustakaUtils.formatDateID(loan.loanDate)}</td>
              <td>${PustakaUtils.formatDateID(loan.dueDate)}</td>
              <td>${statusBadge}</td>
            </tr>
          `;
        }).join('');
      }
    }

    renderCharts();
  }

  /**
   * Merender grafik visual Chart.js untuk Kategori Koleksi dan Status Sirkulasi.
   */
  function renderCharts() {
    const books = PustakaStorage.getBooks();
    const loans = PustakaStorage.getLoans();
    const today = PustakaUtils.getTodayISO();

    // 1. Hitung data kategori buku
    const categoryCounts = {};
    books.forEach((b) => {
      const cat = b.category || 'Lainnya';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryLabels = Object.keys(categoryCounts);
    const categoryData = Object.values(categoryCounts);

    // 2. Hitung status sirkulasi
    let activeNormal = 0;
    let activeOverdue = 0;
    let returnedOnTime = 0;
    let returnedOverdue = 0;

    loans.forEach((l) => {
      if (l.status === 'Dipinjam') {
        const late = PustakaUtils.calculateLateDays(l.dueDate, today);
        if (late > 0) activeOverdue++;
        else activeNormal++;
      } else if (l.status === 'Dikembalikan') {
        const returnDate = l.returnDate || today;
        const late = PustakaUtils.calculateLateDays(l.dueDate, returnDate);
        if (late > 0) returnedOverdue++;
        else returnedOnTime++;
      }
    });

    const categoryCanvas = document.getElementById('categoryChart');
    const categoryFallback = document.getElementById('categoryChartFallback');
    const circulationCanvas = document.getElementById('circulationChart');
    const circulationFallback = document.getElementById('circulationChartFallback');

    // Jika Chart.js tidak tersedia (misal lingkungan offline tanpa koneksi internet CDN)
    if (typeof Chart === 'undefined') {
      if (categoryCanvas) categoryCanvas.hidden = true;
      if (circulationCanvas) circulationCanvas.hidden = true;

      if (categoryFallback) {
        categoryFallback.hidden = false;
        categoryFallback.innerHTML = categoryLabels.length === 0
          ? '<p class="cell-sub">Belum ada koleksi buku.</p>'
          : categoryLabels.map((cat, idx) => {
              const count = categoryData[idx];
              const pct = Math.round((count / (books.length || 1)) * 100);
              return `
                <div class="fallback-row">
                  <div class="fallback-label"><span>${PustakaUtils.escapeHTML(cat)}</span><strong>${count} judul (${pct}%)</strong></div>
                  <div class="fallback-bar"><div class="fallback-fill" style="width: ${pct}%;"></div></div>
                </div>
              `;
            }).join('');
      }

      if (circulationFallback) {
        const totalLoans = loans.length || 1;
        circulationFallback.hidden = false;
        circulationFallback.innerHTML = `
          <div class="fallback-row">
            <div class="fallback-label"><span>Dipinjam Aktif</span><strong>${activeNormal} transaksi (${Math.round((activeNormal / totalLoans) * 100)}%)</strong></div>
            <div class="fallback-bar"><div class="fallback-fill" style="width: ${(activeNormal / totalLoans) * 100}%; background-color: var(--color-secondary);"></div></div>
          </div>
          <div class="fallback-row">
            <div class="fallback-label"><span>Terlambat Aktif</span><strong>${activeOverdue} transaksi (${Math.round((activeOverdue / totalLoans) * 100)}%)</strong></div>
            <div class="fallback-bar"><div class="fallback-fill" style="width: ${(activeOverdue / totalLoans) * 100}%; background-color: var(--color-danger);"></div></div>
          </div>
          <div class="fallback-row">
            <div class="fallback-label"><span>Kembali Tepat Waktu</span><strong>${returnedOnTime} transaksi (${Math.round((returnedOnTime / totalLoans) * 100)}%)</strong></div>
            <div class="fallback-bar"><div class="fallback-fill" style="width: ${(returnedOnTime / totalLoans) * 100}%; background-color: var(--color-primary);"></div></div>
          </div>
          <div class="fallback-row">
            <div class="fallback-label"><span>Kembali Terlambat</span><strong>${returnedOverdue} transaksi (${Math.round((returnedOverdue / totalLoans) * 100)}%)</strong></div>
            <div class="fallback-bar"><div class="fallback-fill" style="width: ${(returnedOverdue / totalLoans) * 100}%; background-color: var(--color-accent);"></div></div>
          </div>
        `;
      }
      return;
    }

    // Jika Chart.js aktif
    if (categoryFallback) categoryFallback.hidden = true;
    if (circulationFallback) circulationFallback.hidden = true;
    if (categoryCanvas) categoryCanvas.hidden = false;
    if (circulationCanvas) circulationCanvas.hidden = false;

    if (categoryCanvas) {
      if (categoryChartInstance) {
        categoryChartInstance.destroy();
      }
      categoryChartInstance = new Chart(categoryCanvas, {
        type: 'doughnut',
        data: {
          labels: categoryLabels.length > 0 ? categoryLabels : ['Belum Ada Koleksi'],
          datasets: [{
            data: categoryData.length > 0 ? categoryData : [1],
            backgroundColor: [
              '#234B3A',
              '#3F7259',
              '#D6B77A',
              '#8A6116',
              '#C0392B',
              '#5A6B63'
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { size: 12 }
              }
            }
          }
        }
      });
    }

    if (circulationCanvas) {
      if (circulationChartInstance) {
        circulationChartInstance.destroy();
      }
      circulationChartInstance = new Chart(circulationCanvas, {
        type: 'bar',
        data: {
          labels: ['Dipinjam Aktif', 'Terlambat Aktif', 'Kembali Tepat Waktu', 'Kembali Terlambat'],
          datasets: [{
            label: 'Jumlah Transaksi',
            data: [activeNormal, activeOverdue, returnedOnTime, returnedOverdue],
            backgroundColor: [
              '#3F7259',
              '#C0392B',
              '#234B3A',
              '#D6B77A'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, precision: 0 }
            }
          }
        }
      });
    }
  }

  function init() {
    const btnGotoCirculation = document.querySelector('[data-goto="circulation"]');
    if (btnGotoCirculation) {
      btnGotoCirculation.addEventListener('click', () => {
        if (window.PustakaApp && typeof window.PustakaApp.switchView === 'function') {
          window.PustakaApp.switchView('circulation');
        }
      });
    }
  }

  return {
    init,
    render,
    renderCharts
  };
})();
