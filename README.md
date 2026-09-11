# 💍 Wedding Planner Web App

Aplikasi web modern untuk perencanaan pernikahan dan manajemen *cash flow* secara *real-time*. Dibangun menggunakan **Vue 3**, **TypeScript**, dan **Vite** pada sisi *frontend*, serta memanfaatkan **Google Sheets** sebagai database *serverless* gratis yang dihubungkan melalui **Google Apps Script (Web App API)**.

---

## 📑 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
3. [Konfigurasi Google Sheets](#-1-konfigurasi-google-sheets)
4. [Setting Google Apps Script](#-2-setting-google-apps-script)
5. [Setting Environment Variable (.env)](#-3-setting-environment-variable-env)
6. [Cara Menjalankan Frontend](#-4-cara-menjalankan-frontend)
7. [Struktur Folder](#-5-struktur-folder)
8. [Panduan Penggunaan (Cara Pakai)](#-6-panduan-penggunaan-cara-pakai)
9. [Troubleshooting & Tips](#-7-troubleshooting--tips)

---



## ✨ Fitur Utama

- 🔐 **Autentikasi Pengguna**: Sistem login berbasis token sederhana yang tersimpan di Google Sheet `Users`. Setiap user mendapat `id_user` unik.
- 👤 **Isolasi Data per Akun (`id_user`)**: Rencana, Transaksi, Tamu, dan Pengantin tersimpan terpisah per akun. Setiap halaman menampilkan badge `ID: {{ id_user }}` akun aktif dan hanya memuat data milik akun tersebut (filter server + filter client-side).
- ⏳ **Countdown Hari-H**: Penghitungan otomatis sisa hari menuju tanggal pernikahan di Dashboard dan Header.
- 📋 **Manajemen Rencana (Checklist)**: Daftar tugas persiapan pernikahan, deadline waktu, toggle status selesai/pending, tombol **Segarkan**, serta normalisasi header yang toleran (`TugasRencana`/`tugas`/`rencana`, `tgl_deadline`/`deadline`/`target`, dll.) dengan fallback otomatis bila filter backend kosong.
- 💰 **Pencatatan Transaksi & Keuangan**: Tracking pengeluaran pernikahan berdasarkan kategori serta **Tipe Debit (+) / Kredit (−)** via radio button. Nominal Kredit disimpan sebagai nilai negatif, ditampilkan hijau (Debit) / merah (Kredit) lengkap dengan badge tipe.
- 👥 **Manajemen Tamu Undangan (RSVP)**: Daftar nama tamu, kategori relasi, nomor kontak/WhatsApp, konfirmasi kehadiran (*Hadir*, *Tidak Hadir*, *Pending*), dan kolom `ID User` di tabel desktop + badge ID di tampilan mobile.
- 👰🤵 **Profil Pernikahan**: Pengaturan nama kedua mempelai, tanggal hari-H, dan lokasi acara (satu baris profil per `id_user`, tidak menimpa akun lain).
- 📱 **Responsif & Mobile-Friendly**: Tampilan dashboard yang nyaman diakses melalui smartphone, tablet, maupun desktop.

---



## 🛠 Teknologi yang Digunakan

- **Frontend**: [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling & UI**: [Bootstrap 5](https://getbootstrap.com/) & [Bootstrap Icons](https://icons.getbootstrap.com/)
- **Routing**: [Vue Router 4](https://router.vuejs.org/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **State/Storage**: [js-cookie](https://github.com/js-cookie/js-cookie)
- **Backend & Database**: [Google Apps Script](https://developers.google.com/apps-script) & [Google Sheets](https://www.google.com/sheets/about/)

---



## 📊 1. Konfigurasi Google Sheets

Aplikasi membutuhkan satu file Google Spreadsheet yang berfungsi sebagai *database*. Buat Google Spreadsheet baru di Google Drive Anda (misal beri nama `Database Wedding Planner`), kemudian siapkan **5 sheet (tab)** dengan nama yang **persis** (case-sensitive) seperti berikut:

### Sheet 1: `Users`

Digunakan untuk data login pengguna.

- **Nama Tab**: `Users`
- **Header Kolom (Baris 1)**:

  | A         | B          | C          | D      | E      |
  | --------- | ---------- | ---------- | ------ | ------ |
  | `id_user` | `username` | `password` | `name` | `role` |

- **Contoh Data (Baris 2 dst.)**:

  | id_user | username | password   | name                | role              |
  | ------- | -------- | ---------- | ------------------- | ----------------- |
  | `1`     | `admin`  | `admin123` | `Raihan & Pasangan` | `Calon Pengantin` |
  | `2`     | `budi`   | `budi123`  | `Budi & Pasangan`   | `Calon Pengantin` |


---



### Sheet 2: `Rencana`

Digunakan untuk daftar checklist dan timeline tugas persiapan pernikahan (terpisah per akun berdasarkan `id_user`).

- **Nama Tab**: `Rencana`
- **Header Kolom (Baris 1)**:

  | A    | B         | C              | D              | E        |
  | ---- | --------- | -------------- | -------------- | -------- |
  | `id` | `id_user` | `TugasRencana` | `tgl_deadline` | `status` |

- **Contoh Data (Baris 2 dst.)**:

  | id           | id_user | TugasRencana           | tgl_deadline | status    |
  | ------------ | ------- | ---------------------- | ------------ | --------- |
  | `1712000001` | `1`     | Booking Gedung Resepsi | `2026-10-01` | `selesai` |
  | `1712000002` | `1`     | Fitting Baju Pengantin | `2026-10-15` | `pending` |


> 📌 **Catatan**: 
>
> - Kolom `id_user` berfungsi memisahkan checklist per akun pengguna.
> - Kolom `status` bernilai: `pending` atau `selesai`.
> - Format kolom `tgl_deadline` disarankan teks bertipe tanggal `YYYY-MM-DD`.

---



### Sheet 3: `Transaksi`

Digunakan untuk pencatatan anggaran dan riwayat pengeluaran/pemasukan biaya pernikahan (terpisah per akun berdasarkan `id_user`).

- **Nama Tab**: `Transaksi`
- **Header Kolom (Baris 1)**:

  | A              | B         | C            | D          | E              | F         |
  | -------------- | --------- | ------------ | ---------- | -------------- | --------- |
  | `id_transaksi` | `tanggal` | `Keterangan` | `Kategori` | `Kredit_Debit` | `id_user` |

- **Contoh Data (Baris 2 dst.)**:

  | id_transaksi | tanggal      | Keterangan            | Kategori | Kredit_Debit | id_user |
  | ------------ | ------------ | --------------------- | -------- | ------------ | ------- |
  | `1712000003` | `2026-09-01` | DP Gedung Resepsi     | Venue    | `5000000`    | `1`     |
  | `1712000004` | `2026-09-05` | DP Catering 500 Porsi | Katering | `-2000000`   | `1`     |


> 📌 **Catatan**:
>
> - Kolom `id_user` berfungsi memisahkan transaksi per akun pengguna.
> - Nilai `Kredit_Debit`: positif = **Debit** ( Pemasukan/masuk, tampil hijau), negatif = **Kredit** (pengeluaran, tampil merah). Dipilih via radio button Debit/Kredit di form frontend.


---



### Sheet 4: `Tamu`

Digunakan untuk data tamu undangan dan pelacakan status RSVP (terpisah per akun berdasarkan `id_user`).

- **Nama Tab**: `Tamu`
- **Header Kolom (Baris 1)**:

  | A    | B           | C          | D        | E            | F         |
  | ---- | ----------- | ---------- | -------- | ------------ | --------- |
  | `id` | `nama_tamu` | `kategori` | `kontak` | `konfirmasi` | `id_user` |

- **Contoh Data (Baris 2 dst.)**:

  | id           | nama_tamu    | kategori | kontak         | konfirmasi | id_user |
  | ------------ | ------------ | -------- | -------------- | ---------- | ------- |
  | `1712000005` | Budi Santoso | Sahabat  | `081234567890` | `Hadir`    | `1`     |
  | `1712000006` | Siti Aminah  | Keluarga | `089876543210` | `Pending`  | `1`     |


> 📌 **Catatan**:
>
> - Kolom `id_user` berfungsi memisahkan daftar tamu per akun pengguna (filter di sisi backend + verifikasi di sisi frontend).
> - Nilai kolom `konfirmasi`: `Hadir`, `Tidak Hadir`, atau `Pending`.
> - Untuk kolom `kontak`, awali dengan tanda petik tunggal (contoh: `'081234567890`) agar angka `0` di awal nomor HP tidak otomatis terhapus oleh spreadsheet.

---



### Sheet 5: `Pengantin`

Digunakan untuk menyimpan informasi profil kedua mempelai dan detail pernikahan (terpisah per akun berdasarkan `id_user`).

- **Nama Tab**: `Pengantin` (bisa juga dinamai `Akun` / `Pernikahan`)
- **Header Kolom (Baris 1)**:

  | A    | B         | C                      | D                        | E                    | F        |
  | ---- | --------- | ---------------------- | ------------------------ | -------------------- | -------- |
  | `id` | `id_user` | `calon_pengantin_pria` | `calon_pengantin_wanita` | `tanggal_pernikahan` | `Lokasi` |

- **Contoh Data (Baris 2 dst.)**:

  | id    | id_user | calon_pengantin_pria | calon_pengantin_wanita | tanggal_pernikahan | Lokasi                              |
  | ----- | ------- | -------------------- | ---------------------- | ------------------ | ----------------------------------- |
  | `P-1` | `1`     | Raihan               | Ummi                   | `2026-12-25`       | Ballroom Hotel Grand Sahid, Jakarta |


---



## ⚙️ 2. Setting Google Apps Script

Google Apps Script bertindak sebagai backend REST API sederhana yang membaca dan menulis data ke Google Sheets Anda.

### Langkah-langkah:

1. Buka file Google Spreadsheet yang sudah Anda buat di atas.
2. Pada menu bar atas, klik **Extensions** (atau **Ekstensi**) -> pilih **Apps Script**.
3. Di dalam editor Apps Script:
  - Hapus seluruh kode bawaan yang ada di file `Code.gs`.
  - Buka file `[apps-script/Code.gs](file:///D:/mini%20project/wedding%20planner/apps-script/Code.gs)` pada repository ini, lalu **salin (copy) seluruh kodenya** dan **tempel (paste)** ke editor `Code.gs` di Google Apps Script.
4. Klik ikon **Save (Simpan)** (atau tekan `Ctrl + S`).
5. Ubah nama proyek di kiri atas (misal: `Wedding Planner API`).



### Konfigurasi Timezone (Penting)

Pastikan zona waktu script sesuai dengan lokasi Anda agar format tanggal deadline dan transaksi akurat:

1. Klik menu **Project Settings** (ikon gerigi ⚙️ di panel kiri Apps Script).
2. Centang opsi **Show "appsscript.json" manifest file in editor**.
3. Kembali ke tab editor berkas (ikon `< >`), buka file `appsscript.json`, dan pastikan timezone sudah sesuai (misal: `"timeZone": "Asia/Jakarta"`).



### Melakukan Deployment (Deploy sebagai Web App):

1. Di kanan atas editor Apps Script, klik tombol biru **Deploy** -> pilih **New deployment** (Penerapan baru).
2. Klik ikon gerigi (⚙️) di sebelah kiri *Select type*, lalu pilih **Web app**.
3. Atur konfigurasi berikut:
  - **Description**: `Wedding Planner API v1`
  - **Execute as**: `Me (email-anda@gmail.com)` *(Aplikasi dijalankan atas nama akun Google Anda)*
  - **Who has access**: `Anyone` *(PENTING: Pilih 'Anyone' agar frontend dapat mengakses endpoint tanpa error CORS / blokir otorisasi)*
4. Klik tombol **Deploy**.
5. Google akan meminta izin otorisasi akses:
  - Klik **Authorize access**.
  - Pilih akun Google Anda.
  - Jika muncul peringatan *"Google hasn't verified this app"*, klik tautan **Advanced** di kiri bawah, lalu klik **Go to Untitled project (unsafe)**.
  - Klik **Allow** untuk memberikan akses membaca dan menulis Google Sheets.
6. Setelah deployment selesai, salin **Web app URL** yang muncul (URL berakhiran `/exec`).
  Contoh format URL:

> ⚠️ **Catatan Penting Pembaruan Script**:
> Jika di kemudian hari Anda melakukan perubahan pada `Code.gs`:
> Klik **Deploy** -> **Manage deployments** -> klik ikon **Edit (Pensil)** -> ubah bagian **Version** menjadi **New version** -> klik **Deploy**. Jangan hanya klik Save, karena Web App hanya membaca versi hasil deploy!

---



## 🔑 3. Setting Environment Variable (`.env`)

Frontend membutuhkan URL Web App Google Apps Script untuk berkomunikasi dengan spreadsheet.

1. Buka folder `frontend/`.
2. Buat file baru bernama `.env` di dalam folder `frontend/` (atau salin dari `.env.example`).
3. Tambahkan variabel `VITE_API_URL` dengan nilai URL Web App yang telah Anda salin sebelumnya:

```env
# frontend/.env
VITE_API_URL= #api appscript anda sendiri
```

> 💡 **Tips**: File `.env` ini secara otomatis diabaikan oleh Git (berada dalam `.gitignore`) sehingga kredensial deployment Anda tetap aman dan tidak terpublikasi ke publik.

---



## 🚀 4. Cara Menjalankan Frontend



### Prasyarat:

- [Node.js](https://nodejs.org/) (versi 18.x atau yang lebih baru)
- Paket manajer: `npm`, `pnpm`, atau `yarn`



### 1. Instalasi Dependensi

Buka terminal / PowerShell, masuk ke direktori folder `frontend`, lalu jalankan perintah instalasi:

```bash
cd frontend
npm install
```



### 2. Menjalankan Mode Development

Untuk menjalankan aplikasi di komputer lokal:

```bash
npm run dev
```

Setelah server Vite berjalan, buka browser dan akses URL lokal yang ditampilkan (default: [http://localhost:5173](http://localhost:5173)).

### 3. Build untuk Production

Jika ingin melakukan build aset siap rilis (misalnya untuk di-deploy ke Vercel, Netlify, atau GitHub Pages):

```bash
# Melakukan type-check dan build aset statis ke folder dist/
npm run build

# Menjalankan preview lokal hasil build production
npm run preview
```

---



## 📂 5. Struktur Folder

Berikut adalah susunan direktori dan penjelasan komponen proyek:

```text
wedding-planner/
├── apps-script/
│   └── Code.gs                  # Backend REST API serverless (Google Apps Script)
│
├── gsheet/
│   └── database.ods             # Backup/template offline database spreadsheet
│
├── frontend/
│   ├── .env                     # File environment lokal (menyimpan VITE_API_URL)
│   ├── .env.example             # Template file environment
│   ├── .gitignore               # Konfigurasi ignore file Git
│   ├── index.html               # File template HTML utama
│   ├── package.json             # Manifest dependensi & scripts NPM
│   ├── tsconfig.json            # Konfigurasi compiler TypeScript
│   ├── vite.config.ts           # Konfigurasi bundler Vite & plugin Vue
│   │
│   ├── public/                  # Aset statis publik (favicon, logo, dll.)
│   └── src/
│       ├── App.vue              # Root component aplikasi
│       ├── main.ts              # Entry point aplikasi Vue
│       ├── style.css            # Styling custom & override tema
│       ├── vite-env.d.ts        # Deklarasi tipe Vite & env
│       │
│       ├── assets/              # Aset gambar, ikon, dan styling internal
│       │
│       ├── components/          # Komponen UI reusable
│       │   └── layout/
│       │       ├── header.vue   # Header atas (nama user, countdown mini, tombol logout/mobile menu)
│       │       ├── sidebar.vue  # Navigasi samping (menu dashboard, rencana, transaksi, tamu, akun)
│       │       └── footer.vue   # Komponen footer halaman
│       │
│       ├── routes/
│       │   └── index.ts         # Konfigurasi Vue Router & Navigation Auth Guard
│       │
│       ├── services/
│       │   └── api.ts           # Axios client & service CRUD (Auth, Rencana, Transaksi, Tamu, Akun)
│       │
│       └── view/
│           ├── auth/
│           │   └── login.vue    # Halaman form login pengguna
│           │
│           └── dashboard/
│               ├── dashboard.vue        # Layout wrapper (Sidebar + Header + RouterView)
│               ├── dash-index.vue       # Dashboard utama (Statistik, Progress, Countdown)
│               ├── rencana-index.vue    # Halaman kelola rencana & checklist persiapan
│               ├── transaksi-index.vue  # Halaman pencatatan anggaran & cash flow
│               ├── tamu-index.vue       # Halaman kelola tamu undangan & RSVP
│               └── akun-index.vue       # Halaman profil pengantin & tanggal pernikahan
│
└── README.md                    # Dokumentasi lengkap proyek
```

---



## 📖 6. Panduan Penggunaan (Cara Pakai)

Setelah aplikasi berjalan di browser ([http://localhost:5173](http://localhost:5173)), ikuti alur penggunaan berikut:

### 1. Login Akun

- Buka halaman utama aplikasi.
- Masukkan **Username** dan **Password** yang telah Anda daftarkan di sheet `Users` Google Sheet (contoh: `admin` / `admin123`).
- Klik tombol **Login**. Setelah berhasil, Anda akan dialihkan ke halaman Dashboard.
- Saat login berhasil, backend mengembalikan `id_user` (diambil dari kolom `id_user`/`id` di sheet `Users`, fallback ke `username`) yang disimpan di cookie bersama token. Seluruh request berikutnya (`getRencana`, `getTransaksi`, `getTamu`, `getPengantin`, dsb.) menyertakan `id_user` ini sehingga data selalu terisolasi per akun.



### 2. Atur Profil Pernikahan (Menu "Akun")

- Sangat disarankan untuk melengkapi data mempelai terlebih dahulu melalui menu **Akun** di sidebar.
- Masukkan:
  - Nama Calon Pengantin Pria
  - Nama Calon Pengantin Wanita
  - Tanggal Pernikahan (pilih tanggal hari-H)
  - Lokasi Pernikahan (Gedung/Masjid/Alamat)
- Klik **Simpan Data**.
- *Tanggal pernikahan yang Anda masukkan akan langsung memicu perhitungan countdown otomatis di Header dan Dashboard.*



### 3. Memantau Dashboard

- Halaman **Dashboard** menyajikan ringkasan cepat:
  - **Sisa Waktu**: Hitung mundur hari menuju hari-H (misal: "85 Hari Menuju Hari-H").
  - **Progress Rencana**: Persentase tugas persiapan pernikahan yang sudah selesai.
  - **Total Pengeluaran**: Akumulasi biaya yang tercatat pada menu transaksi.
  - **Tamu Konfirmasi**: Perbandingan tamu yang sudah konfirmasi hadir dibanding total undangan.
  - Tabel ringkas rencana dan transaksi terbaru.



### 4. Manajemen Rencana (Menu "Rencana")

- Daftar tugas **difilter menurut `id_user`** — tiap akun hanya melihat checklist miliknya. Header halaman menampilkan nama akun aktif + badge `ID: <id_user>`, dan tiap item menampilkan badge ID pemiliknya.
- **Menambah Tugas**: Masukkan nama tugas (misal: *"Fitting Jas Pengantin"*) dan tenggat tanggal deadline, lalu klik **Tambah Tugas**. Data otomatis tersimpan dengan `id_user` akun yang sedang login.
- **Ceklis Tugas**: Klik kotak centang status untuk mengubah status antara `pending` dan `selesai`.
- **Segarkan**: Klik tombol **Segarkan** untuk memuat ulang data terbaru dari Google Sheet.
- **Menghapus Tugas**: Klik tombol hapus (ikon tempat sampah) untuk menghapus tugas yang dibatalkan.



### 5. Manajemen Transaksi (Menu "Transaksi")

- Daftar transaksi **difilter menurut `id_user`** dan menampilkan kolom **ID User** di tabel desktop (serta info pemilik di tampilan mobile).
- **Mencatat Pengeluaran**: Klik tombol **Catat Pengeluaran**, isi tanggal, keterangan pembayaran (misal: *"DP Fotografer"*), kategori (*Venue, Katering, Busana, Dokumentasi, dll.*), pilih **Tipe Transaksi** via radio button **Debit (+)** / **Kredit (−)**, lalu isi nominal (selalu angka positif — tanda negatif otomatis untuk Kredit).
- **Tampilan Nominal**: Debit tampil hijau dengan badge `Debit`, Kredit tampil merah dengan badge `Kredit` (nilai Kredit disimpan negatif, misal `-2000000`).
- **Filter & Rekap**: Pantau ringkasan total uang yang sudah dikeluarkan secara *real-time*.
- **Edit & Hapus**: Anda dapat memperbarui tipe, nominal, keterangan, atau menghapus data transaksi jika terjadi salah input.



### 6. Manajemen Tamu Undangan (Menu "Tamu Undangan")

- Daftar tamu **ditampilkan menurut `id_user`** — tiap akun hanya melihat tamu miliknya (filter di backend `getTamu` + verifikasi ulang di frontend). Header halaman menampilkan nama akun aktif + badge `ID: <id_user>`.
- **Tambah Tamu**: Masukkan nama tamu, kategori relasi (*Keluarga, Sahabat, Teman Kantor, Tetangga, dll.*), serta nomor WhatsApp/kontak. Data otomatis tersimpan dengan `id_user` akun yang sedang login.
- **Kolom ID User**: Tabel desktop memiliki kolom **ID User**, tampilan mobile (card) menampilkan badge `ID: <id_user>` di tiap kartu tamu.
- **Update RSVP**: Ubah status kehadiran menjadi **Hadir**, **Tidak Hadir**, atau **Pending**.
- **Pencarian & Filter**: Memudahkan memilah daftar tamu saat menyusun undangan fisik maupun digital.



### 7. Logout

- Klik nama akun Anda atau tombol **Logout** di bagian header/sidebar untuk mengakhiri sesi.

---



## ❓ 7. Troubleshooting & Tips


| Masalah                                                 | Penyebab Umum                                                       | Solusi                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Error: CORS policy / Network Error saat login**       | Setting deployment Web App di Apps Script belum terbuka untuk umum. | Buka Apps Script -> **Deploy** -> **Manage Deployments** -> ubah **Who has access** menjadi **Anyone**, lalu Deploy ulang.    |
| **Pesan error: Sheet ... tidak ditemukan**              | Nama tab pada Google Sheets berbeda dengan kode.                    | Pastikan nama tab persis: `Users`, `Rencana`, `Transaksi`, `Tamu`, dan `Pengantin` (perhatikan huruf kapital).                |
| **Nomor kontak tamu kehilangan angka** `0` **di depan** | Google Sheet mendeteksi nomor telepon sebagai angka/number.         | Tambahkan tanda kutip satu `'` di awal nomor (contoh: `'08123456789`) atau ubah format kolom ke *Plain Text*.                 |
| **Perubahan di** `Code.gs` **tidak ada efeknya**        | Apps Script belum dibuatkan versi deployment baru.                  | Di Apps Script, buka **Deploy** -> **Manage Deployments** -> Edit -> ganti **Version** ke **New version** -> klik **Deploy**. |
| **Error:** `id` **atau data tidak muncul**              | Baris header (baris 1) di Google Sheet salah eja atau kosong.       | Samakan persis nama header kolom pada baris 1 seperti panduan di [Konfigurasi Google Sheets](#-1-konfigurasi-google-sheets).  |
| **Data tercampur antar akun / data akun lain ikut tampil** | Kolom `id_user` belum ada di sheet `Transaksi`/`Tamu`, atau baris lama kosong tanpa `id_user`. | Tambahkan kolom `id_user` di baris header sesuai panduan Sheet 2–5, isi `id_user` tiap baris lama, lalu Deploy ulang Apps Script sebagai **New version**. |


---



## 📄 Lisensi

Proyek ini dibuat untuk keperluan *personal project* dan bebas dikembangkan lebih lanjut sesuai kebutuhan pernikahan Anda.