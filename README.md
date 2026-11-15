# PustakaAkademika — Sistem Manajemen Perpustakaan Akademik Berbasis Web

PustakaAkademika adalah aplikasi sistem perpustakaan akademik modern yang dibangun murni menggunakan **HTML5, CSS3, dan Vanilla JavaScript (ES6+)**, berbasis penyimpanan **Local Storage** mandiri tanpa ketergantungan backend eksternal, visualisasi analitik interaktif menggunakan **Chart.js**, serta antarmuka elegan bertema **Modern Academic** dengan **portal autentikasi terpadu (Sign In & Sign Up)** dan **pemisahan halaman fisik antara Pustakawan (Admin) dan Pemustaka (Mahasiswa)**.

---

## 📌 Ketentuan Teknologi (Kepatuhan Aturan Perkuliahan)

- **Frontend**: Murni HTML5 semantik, CSS3 modern modular (tanpa Tailwind, Bootstrap, atau UI framework), dan Vanilla JavaScript murni.
- **Bebas Framework**: 100% tanpa React, Vue, Angular, jQuery, atau runtime framework frontend sejenis.
- **Penyimpanan Data**: Pure Browser **Local Storage** (portabel, langsung dapat dijalankan tanpa konfigurasi database server atau instalasi backend).
- **Library & Integrasi API**:
  - **Chart.js**: Untuk visualisasi analitik statistik di Dashboard Admin (disertai fallback offline).
  - **Open Library Public API**: Integrasi live autocomplete metadata buku otomatis berdasarkan judul atau ISBN.

---

## 🚪 Alur Autentikasi & Pemisahan Portal

Sistem menerapkan arsitektur *Role Separation* yang tegas dan aman melalui portal autentikasi terpusat:

```
                            ┌───────────────────────────────────────────────┐
                            │                  login.html                   │
                            │   Portal Masuk & Registrasi (Sign In / Up)    │
                            └───────┬───────────────────────────────┬───────┘
                                    │                               │
                          [Sign In sebagai User]          [Sign In sebagai Admin]
                                    │                               │
                                    ▼                               ▼
                                index.html                      admin.html
                          (Portal Pemustaka 1 User)       (Dashboard Pustakawan)
```

### 1. Portal Masuk & Pendaftaran (`login.html`)
- **Tampilan Terpusat (*Centered Layout*)**: Kotak login berada tepat di tengah layar dengan animasi masuk halus (*pop animation*) dan teks hak cipta terpusat di bawahnya.
- **Tab Masuk (Sign In)**:
  - Toggle pemilihan peran: **Mahasiswa / Pemustaka** (menggunakan NIM atau Email) atau **Pustakawan / Admin** (menggunakan username & password admin).
  - **Tombol Uji Coba Demo (*Quick-Fill*)**: 1-klik mengisi otomatis akun admin (`admin` / `admin123`) atau akun mahasiswa demo (`MHS-2026001` - Alya Putri, `MHS-2026002` - Bagas Pratama) untuk mempermudah evaluasi dosen dan penguji.
- **Tab Pendaftaran Pemustaka (Sign Up)**:
  - Formulir registrasi mahasiswa baru dengan pemisahan kolom yang jelas:
    - **NIM / ID Anggota**
    - **Nama Lengkap**
    - **Fakultas** (contoh: *Ilmu Komputer*, *Ekonomi & Bisnis*, *Teknik*)
    - **Program Studi (Prodi)** (contoh: *Teknik Informatika*, *Sistem Informasi*, *Manajemen*)
    - **Email Akademik & Nomor WhatsApp**
    - **Kata Sandi (Password)**
  - Akun baru otomatis disimpan ke database `localStorage` dan langsung login menuju portal pemustaka.

---

### 2. Portal Pemustaka Mandiri (`index.html`)
Khusus dirancang untuk kenyamanan mahasiswa dalam mode **1 User Terkunci**:
- **Eksplorasi Katalog Publik (OPAC)**: Grid kartu buku visual (*Book Cards*) lengkap dengan foto cover, status stok tersedia/habis, pencarian instan multi-kategori, serta tombol **"Pinjam Buku"** mandiri 24/7.
- **Peminjaman Saya & KTA Digital**:
  - **Kartu Tanda Anggota (KTA) Digital**: Menampilkan inisial avatar, nama lengkap, NIM, Program Studi, Fakultas, chip kartu emas, serta status keanggotaan aktif.
  - **Pelacakan Jatuh Tempo (*Visual Countdown*)**: Menghitung mundur sisa hari peminjaman (contoh: *"Sisa 3 hari lagi"*, *"Jatuh tempo hari ini"*, atau *"Terlambat 2 hari"* disertai estimasi denda dinamis).
  - **Perpanjangan Mandiri (+7 Hari)**: Perpanjangan masa pinjam 1 kali secara mandiri sebelum tanggal jatuh tempo.
  - **Riwayat Pengembalian**: Catatan riwayat buku yang telah dikembalikan beserta status tagihan denda.
- **Panduan & Tata Tertib**: Regulasi resmi kuota maksimal 3 buku, masa pinjam 7 hari kalender, kebijakan denda keterlambatan Rp 2.000/hari, dan jam operasional helpdesk.
- **Header Atas**: Tombol **Keluar (Logout)** yang mengakhiri sesi pemustaka dan kembali ke `login.html`.

---

### 3. Portal Pengelola / Pustakawan (`admin.html`)
Khusus operasional staf perpustakaan mengelola seluruh siklus data:
- **Dashboard Analitik**: 4 kartu KPI counter animasi (Total Judul, Total Eksemplar Stok, Anggota Terdaftar, dan Peminjaman Berjalan) beserta grafik **Chart.js** (Doughnut Kategori Koleksi & Bar Transaksi Sirkulasi).
- **Katalog Koleksi Buku**: CRUD data buku, filter pencarian real-time, validasi ISBN unik, manajemen stok, ekspor CSV, serta fitur **Cari Otomatis via Open Library API** (autocomplete data judul, penulis, tahun, dan kategori).
- **Manajemen Anggota**: CRUD data mahasiswa/siswa, pemantauan tanggungan pinjaman aktif, modal profil detail riwayat anggota, dan ekspor CSV data anggota.
- **Meja Sirkulasi**: Pencatatan peminjaman baru (dengan proteksi kuota maksimal 3 buku dan blokir otomatis bagi anggota yang memiliki tunggakan keterlambatan), pengembalian buku dengan kalkulator denda otomatis (Rp 2.000/hari), perpanjangan manual, dan ekspor riwayat sirkulasi ke CSV.
- **Header Atas**: Tombol **Keluar (Logout)** dan tombol **Reset Data Demo**.

---

## 🏗️ Struktur Berkas & Modularitas Kode

Proyek ini menerapkan prinsip *Separation of Concerns* (pemisahan tanggung jawab kode yang terisolasi dan mudah dirawat):

```text
pustaka-akademika/
├── index.html              # Laman Utama Portal Pemustaka / Mahasiswa (Mode 1 User)
├── admin.html              # Laman Khusus Pengelola / Pustakawan (Dashboard & CRUD)
├── login.html              # Portal Masuk (Sign In) & Pendaftaran (Sign Up) Terpusat
├── README.md               # Dokumentasi Proyek
├── css/
│   ├── style.css           # Master Stylesheet (mengimpor semua modul CSS)
│   ├── variables.css       # Token warna Modern Academic, tipografi, radius, & reset
│   ├── layout.css          # Struktur tata letak desktop 2-kolom, sidebar, & header
│   ├── components.css      # Komponen tombol, kartu (.card), tabel, pill, & badge
│   ├── views.css           # Styling spesifik kartu KPI, grid grafik, & sirkulasi
│   ├── user-portal.css     # Styling KTA digital, kartu visual OPAC, & countdown
│   ├── modals.css          # Modal dialog, autokomplit Open Library, konfirmasi, & toast
│   ├── animations.css      # Keyframes animasi (fade in, modal pop, ripple, pulse)
│   └── responsive.css      # Aturan breakpoint responsive (Tablet <=1024px, Mobile <=768px)
└── js/
    ├── storage.js          # Persistensi data LocalStorage & generator ID unik
    ├── auth.js             # Modul autentikasi, registrasi akun, sesi, & route guard
    ├── api.js              # Integrasi komunikasi fetch HTTP ke Open Library API
    ├── utils.js            # Utilitas escapeHTML (Anti-XSS), format mata uang, tanggal, & CSV
    ├── ui.js               # Toast notification, animasi counter KPI, modal konfirmasi global
    ├── dashboard.js        # KPI metrik analitik & integrasi grafik Chart.js
    ├── books.js            # Modul CRUD buku, filter pencarian, & ekspor CSV
    ├── members.js          # Modul CRUD anggota, validasi kuota, & detail modal
    ├── circulation.js      # Modul meja sirkulasi, validasi aturan pinjam, & hitung denda
    ├── user-portal.js      # Render visual OPAC, KTA digital mahasiswa, & pinjam mandiri
    ├── user-app.js         # Koordinator aplikasi khusus portal pemustaka (index.html)
    └── app.js              # Koordinator aplikasi khusus portal pustakawan (admin.html)
```

---

## 🎨 Desain UI & Animasi Interaktif (*Modern Academic*)

1. **Palet Warna Harmonis**:
   - Primary: **Deep Forest Green** (`#234B3A`)
   - Secondary: **Sage Academic Green** (`#3F7259`)
   - Surface & Card: **Pure White** (`#FFFFFF`)
   - Background Body: **Warm Parchment Beige** (`#F5F1E8`)
   - Accent & Chip: **Academic Gold** (`#D6B77A`)
   - Danger & Sanksi: **Muted Crimson** (`#C0392B`)
2. **Animasi Angka Counter (*Count-Up*)**: Angka pada kartu KPI bertambah secara dinamis dengan kurva cubic easing saat halaman dashboard dibuka.
3. **Efek Ripple Interaktif**: Efek gelombang radial terpancar saat tombol diklik.
4. **Indikator Keterlambatan Berdenyut (*Pulse Animation*)**: Label denda dan status terlambat berkedip lembut merah marun untuk menarik perhatian pengguna.
5. **Toast Notifications Mulus**: Pesan konfirmasi tindakan (berhasil tambah, edit, pinjam, perpanjang) meluncur dari sudut layar dan dapat ditutup manual.

---

## 🚀 Panduan Menjalankan Aplikasi

Aplikasi ini bersifat **portabel dan mandiri**:

1. Unduh atau clone repositori ini ke komputer Anda.
2. Buka berkas **`login.html`** langsung menggunakan peramban modern apa pun (Google Chrome, Microsoft Edge, Mozilla Firefox, dsb.).
3. **Uji Coba Langsung (Gunakan Tombol Quick-Fill Demo)**:
   - Klik **"Admin (admin / admin123)"** lalu tekan **Masuk ke Sistem** untuk menguji portal pengelola.
   - Klik **"Alya Putri (MHS-2026001)"** lalu tekan **Masuk ke Sistem** untuk menguji portal pemustaka.
   - Atau klik tab **"Daftar Pemustaka (Sign Up)"** untuk mencoba mendaftarkan mahasiswa baru secara langsung.
4. Jika ingin mengembalikan data ke kondisi awal, klik tombol **"Reset Demo"** di pojok kanan atas aplikasi.

---

## ⚖️ Lisensi & Hak Cipta

Dibuat untuk keperluan tugas dan proyek akademik mata kuliah Web Development / Sistem Informasi.  
Hak Cipta &copy; 2026 **PustakaAkademika Team**.
