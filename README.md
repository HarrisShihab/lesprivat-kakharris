# Les Privat Kak Harris

Website publik dan portal manajemen Les Privat Kak Harris. Repository ini memakai
HTML/CSS/JavaScript tanpa proses build, Firebase Authentication + Cloud Firestore
sebagai backend, Netlify untuk hosting, serta Google Apps Script/Drive untuk upload
bukti pembayaran.

Dokumentasi ini disusun berdasarkan branch `main` pada commit
`877e3a724546050ce15b385c5d2934293731a716` (2 Agustus 2026).

## Fitur utama

- Landing page, pricelist, jadwal publik realtime, dan halaman promosi.
- Login berbasis username atau email melalui Firebase Authentication.
- Dashboard admin untuk murid, akun, absensi, keuangan, bukti pembayaran, jadwal, dan
  materi belajar.
- Portal orang tua untuk beberapa anak, pembayaran, pengajuan jadwal, dan profil.
- Portal murid untuk absensi, materi, profil, dan akses game belajar.
- Lima game Matematika dengan filter jenjang, mode terbatas/endless, dan skor lokal:
  Hitung Tanpa Batas, Toko Matematika, Detektif Pola Bilangan, Menara Aljabar, dan
  Petualangan Pecahan.

## Struktur ringkas

| Area | File utama |
|---|---|
| Publik | `index.html`, `public.js`, `public-design.css` |
| Autentikasi/API | `login.html`, `firebase-config.js`, `firebase-api.js` |
| Admin | `dashboard.html`, `dashboard-design.css`, `notifikasi.js` |
| Portal | `ortu-dashboard.html`, `murid-dashboard.html`, `portal-dashboard.js` |
| Game | `games.html`, `games.js`, file HTML/JS/CSS tiap game |
| Keamanan data | `firestore.rules`, `firestore.indexes.json` |
| Upload pembayaran | `payment-upload-config.js`, `apps-script/` |
| Hosting | `netlify.toml` |

Penjelasan alur data ada di `docs/ARCHITECTURE.md`. Checklist pengujian ada di
`docs/REGRESSION-CHECKLIST.md`.

## Menjalankan lokal

Jangan membuka halaman langsung dengan skema `file://`. Jalankan server statis dari
root repository, misalnya:

```bash
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`. Domain lokal harus diizinkan pada Firebase
Authentication bila pengujian login gagal karena domain.

Tidak ada instalasi dependency dan tidak ada perintah build.

## Pemeriksaan dasar sebelum commit

```bash
git status --short
git diff --check
node --check firebase-api.js
node --check portal-dashboard.js
node --check games.js
```

Jalankan `node --check` juga pada file JavaScript game yang berubah. Pemeriksaan ini
hanya memvalidasi sintaks; alur Firebase tetap perlu diuji manual.

## Deployment

- Frontend terdeploy otomatis ke Netlify setelah branch `main` di-push.
- Perubahan Firestore Rules tidak ikut terdeploy melalui Netlify. Deploy secara
  terpisah dengan Firebase CLI:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

- Perubahan di `apps-script/Code.gs` juga harus dibuat sebagai deployment Google Apps
  Script baru, lalu URL `/exec` yang aktif diperiksa di `payment-upload-config.js`.
- Setelah deployment, lakukan smoke test produksi menggunakan akun admin, orang tua,
  dan murid.

## Catatan keamanan

- Konfigurasi Firebase Web memang berada di sisi klien; perlindungan data bergantung
  pada Firebase Authentication dan `firestore.rules`.
- Jangan commit service-account JSON, password, ID token, atau kredensial lain.
- `jadwalPublik` sengaja publik tetapi hanya boleh berisi informasi slot, bukan
  identitas murid.
- Jika menambah origin eksternal, sinkronkan perubahan dengan CSP pada `netlify.toml`.

## Dokumentasi lama

`PANDUAN-MIGRASI-FIREBASE.md` mencatat proses migrasi historis. Sebagian statusnya
sudah tertinggal karena proyek terus berkembang. Untuk pengembangan baru, utamakan
README dan dokumen di folder `docs/` serta verifikasi langsung terhadap kode.
