# PustakaAkademika

Sistem manajemen perpustakaan akademik berbasis web yang dibangun menggunakan HTML5, CSS3, dan Vanilla JavaScript. Semua data disimpan di Local Storage browser, jadi tidak perlu backend atau database eksternal. Visualisasi statistik menggunakan Chart.js.


## Tentang Aplikasi

PustakaAkademika dibuat untuk menyelesaikan permasalahan pengelolaan perpustakaan kampus secara digital. Aplikasi ini memiliki dua portal terpisah: satu untuk mahasiswa (pemustaka) dan satu untuk pustakawan (admin), masing-masing dengan halaman dan fitur yang berbeda.

Alur masuknya sederhana. Pengguna membuka login.html, lalu memilih masuk sebagai mahasiswa atau admin. Kalau mahasiswa baru, bisa langsung daftar lewat tab Sign Up. Setelah login berhasil, sistem mengarahkan ke halaman masing-masing.


## Teknologi yang Dipakai

- HTML5 (semantik)
- CSS3 (Flexbox, Grid, desain responsif untuk desktop, tablet, dan mobile)
- JavaScript vanilla (ES6+), tanpa React, Vue, Angular, atau framework sejenis
- Local Storage untuk penyimpanan data
- Chart.js untuk grafik di dashboard admin
- Open Library API untuk autocomplete data buku


## Fitur Utama

### Halaman Login dan Sign Up (login.html)

- Form login dengan pilihan peran: mahasiswa atau admin
- Tombol demo quick-fill supaya penguji bisa langsung coba tanpa bikin akun
- Form pendaftaran mahasiswa baru dengan kolom NIM, nama, fakultas, prodi, email, WhatsApp, dan password
- Akun baru langsung tersimpan dan otomatis login

### Portal Pemustaka / Mahasiswa (index.html)

- Katalog buku (OPAC) dengan pencarian dan filter kategori serta ketersediaan
- Peminjaman buku mandiri langsung dari katalog
- Kartu Tanda Anggota (KTA) digital yang menampilkan data diri mahasiswa
- Pelacakan jatuh tempo pinjaman dengan hitung mundur hari
- Perpanjangan mandiri (+7 hari, 1 kali per pinjaman)
- Riwayat pengembalian dan informasi denda
- Halaman panduan dan tata tertib perpustakaan
- Tombol logout di header

### Portal Admin / Pustakawan (admin.html)

- Dashboard dengan 4 kartu KPI (total judul, stok, anggota, pinjaman aktif) dan grafik Chart.js
- CRUD data buku lengkap dengan pencarian, validasi ISBN, dan autocomplete dari Open Library API
- CRUD data anggota dengan pemantauan tanggungan pinjaman
- Meja sirkulasi: catat pinjam, kembalikan, perpanjang, hitung denda otomatis (Rp 2.000/hari)
- Proteksi kuota maksimal 3 buku per anggota dan blokir kalau ada keterlambatan
- Ekspor data ke CSV (buku, anggota, sirkulasi)
- Tombol logout dan reset data demo


## Struktur File

```
pustaka-akademika/
├── index.html          -- Portal mahasiswa
├── admin.html          -- Portal admin
├── login.html          -- Halaman login dan sign up
├── README.md
├── css/
│   ├── style.css       -- Import semua modul CSS
│   ├── variables.css   -- Warna, font, dan variabel dasar
│   ├── layout.css      -- Tata letak sidebar dan header
│   ├── components.css  -- Tombol, kartu, tabel, badge
│   ├── views.css       -- Styling KPI, grafik, sirkulasi
│   ├── user-portal.css -- Styling khusus portal mahasiswa
│   ├── modals.css      -- Modal, toast, autocomplete
│   ├── animations.css  -- Animasi (fade, ripple, pulse)
│   └── responsive.css  -- Breakpoint tablet dan mobile
└── js/
    ├── storage.js      -- Local Storage dan generator ID
    ├── auth.js         -- Login, registrasi, sesi, route guard
    ├── api.js          -- Fetch ke Open Library API
    ├── utils.js        -- Escape HTML, format uang, tanggal, CSV
    ├── ui.js           -- Toast, counter animasi, modal konfirmasi
    ├── dashboard.js    -- KPI dan Chart.js
    ├── books.js        -- CRUD buku dan filter
    ├── members.js      -- CRUD anggota
    ├── circulation.js  -- Sirkulasi, aturan pinjam, denda
    ├── user-portal.js  -- OPAC, KTA digital, pinjam mandiri
    ├── user-app.js     -- Koordinator portal mahasiswa
    └── app.js          -- Koordinator portal admin
```


## Cara Menjalankan

1. Clone atau download repositori ini.
2. Buka file login.html di browser (Chrome, Edge, Firefox, dll).
3. Untuk coba cepat, pakai tombol quick-fill demo di halaman login:
   - Admin: username "admin", password "admin123"
   - Mahasiswa: pilih salah satu akun demo yang tersedia
   - Atau daftar akun baru lewat tab Sign Up
4. Kalau mau reset data ke awal, klik tombol "Reset Demo" di halaman admin.


## Catatan

- Tidak menggunakan framework frontend apapun, murni HTML, CSS, dan JavaScript.
- Semua data tersimpan di Local Storage browser, tidak ada server.
- Aplikasi bisa langsung dijalankan tanpa instalasi apapun.


## Lisensi

Dibuat untuk tugas akhir mata kuliah Web Design & Development.
Hak Cipta 2026 PustakaAkademika Team.

## Preview Website

### 1. Portal Autentikasi (`login.html`)
![Tampilan Halaman Login](sign-in.png)

### 2. Portal Autentikasi Admin (`login.html`)
![Tampilan Halaman Login Admin](sign-in-admin.png)

### 3. Portal Pendaftaran Pengguna Baru (`login.html`)
![Tampilan Halaman Sign-up](sign-up.png)

### 4. Laman Katalog Buku (`index.html`)
![Tampilan Halaman Katalog Pencari Buku](eksplorasi-katalog.png)

### 5. Laman Profil dan Peminjaman Buku (`index.html`)
![Tampilan Halaman Profil](profil-buku-dipinjam.png)

### 6. Laman Tata-tertib (`index.html`)
![Tampilan Halaman Tata-tertib](tata-tertib.png)

### 7. Laman Dashboard Admin (`admin.html`)
![Tampilan Halaman Dashboard Admin](dashboard.png)

### 8. Laman Koleksi Buku (`admin.html`)
![Tampilan Halaman Koleksi Buku Perpustakaan](katalog-buku.png)

### 9. Laman Manajemen Anggota (`admin.html`)
![Tampilan Halaman Manajemen Anggota](manajemen.png)

### 10. Laman Sirkulasi Perpustakaan (`admin.html`)
![Tampilan Halaman Sirkulasi](sirkulasi.png)