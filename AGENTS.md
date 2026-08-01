# Petunjuk Pengembangan untuk Agen AI

Dokumen ini berlaku untuk seluruh repository. Baca juga `README.md`,
`docs/ARCHITECTURE.md`, dan `docs/REGRESSION-CHECKLIST.md` sebelum mengubah alur
autentikasi, akun, pembayaran, jadwal, atau game.

## Konteks proyek

- Produk: website Les Privat Kak Harris untuk Matematika SD–SMP.
- Hosting produksi: Netlify, dengan deployment otomatis dari branch `main`.
- Frontend: HTML, CSS, dan JavaScript murni. Tidak ada bundler atau package manager.
- Backend utama: Firebase Authentication dan Cloud Firestore.
- Upload bukti pembayaran: Google Apps Script ke Google Drive, lalu metadata dicatat
  ke Firestore.
- Role akun: `admin`, `orangtua`, dan `murid`.
- Bahasa antarmuka dan pesan error: Bahasa Indonesia.

## Aturan kerja

1. Periksa status Git dan commit terbaru sebelum mulai. Jangan menimpa perubahan
   pengguna yang tidak terkait.
2. Pertahankan arsitektur tanpa build step kecuali pengguna secara eksplisit meminta
   migrasi teknologi.
3. Jangan menganggap konfigurasi Firebase Web sebagai rahasia. Namun jangan pernah
   menambahkan password, service-account JSON, token, atau kredensial privat ke repo.
4. Setiap perubahan akses data harus diperiksa bersama `firestore.rules`.
5. Jangan mengandalkan validasi UI untuk keamanan. Validasi sensitif harus ada di
   `firebase-api.js`, Firestore Rules, atau Apps Script sesuai alurnya.
6. Gunakan transaksi Firestore untuk perubahan yang menyentuh beberapa dokumen yang
   harus konsisten, terutama jadwal, kuota, pembayaran, dan counter ID murid.
7. Jangan mengubah status atau nama field yang sudah dipakai tanpa menelusuri seluruh
   referensinya dengan `rg`.
8. Setelah perubahan, jalankan pemeriksaan sintaks yang relevan dan checklist manual
   pada `docs/REGRESSION-CHECKLIST.md`.
9. Satu pekerjaan logis sebaiknya menjadi satu commit. Jangan commit atau push kecuali
   pengguna memintanya.

## Kontrak yang tidak boleh rusak

- ID murid dibuat dari `system/counters` dan selalu meningkat. ID lama tidak digunakan
  ulang ketika akun dinonaktifkan.
- Penonaktifan murid mempertahankan riwayat; data murid bukan dihapus permanen.
- Orang tua hanya boleh membaca dan mengubah data murid yang ID-nya ada dalam
  `users/{uid}.muridIds`.
- `jadwalPublik` boleh dibaca publik dan tidak boleh memuat nama, UID, nomor telepon,
  atau identitas murid lain.
- Pengajuan jadwal menahan kuota dan slot selama 24 jam. Paket biasa memiliki 1 jadwal,
  paket 8 pertemuan 2 jadwal, dan paket 12 pertemuan 3 jadwal.
- Satu murid tidak boleh mempunyai dua jadwal pada hari yang sama. Antarjadwal harus
  mempunyai jeda 15 menit.
- Penghapusan satu jadwal aktif menghapus dokumen jadwal publik, slot, serta kuota yang
  terkait dan mengubah riwayat pengajuan menjadi `Dibatalkan`.
- Aksi “hapus riwayat pengajuan” hanya boleh menghapus status `Ditolak` dan
  `Dibatalkan`; jangan menyentuh `Pending` atau `Disetujui`.
- Bukti pembayaran yang diterima membuat satu transaksi keuangan. Bukti yang sudah
  diproses tidak boleh diproses ulang.
- Game harus dijaga sesuai jenjang: Menara Aljabar khusus SMP, Petualangan Pecahan
  khusus SD, sedangkan tiga game lain untuk SD dan SMP.
- Semua game menyediakan mode `limited` dan `endless`, memakai autentikasi murid, dan
  menyimpan statistik per murid di `localStorage`.

## Peta perubahan

- Halaman publik: `index.html`, `public.js`, `public-design.css`, `style.css`.
- Login dan API browser: `login.html`, `firebase-config.js`, `firebase-api.js`.
- Admin: `dashboard.html`, `dashboard-design.css`, `notifikasi.js`.
- Portal orang tua/murid: `ortu-dashboard.html`, `murid-dashboard.html`,
  `portal-dashboard.js`, `portal-dashboard.css`.
- Katalog dan game: `games.html`, `games.js`, `games.css`, serta pasangan file setiap
  game.
- Otorisasi data: `firestore.rules`; indeks: `firestore.indexes.json`.
- Upload bukti: `payment-upload-config.js` dan `apps-script/Code.gs`.
- Header keamanan Netlify: `netlify.toml`.

## Definition of done

- Perubahan bekerja pada desktop dan layar ponsel.
- Tidak ada error JavaScript baru di console.
- Role yang tidak berhak tetap ditolak, termasuk bila fungsi dipanggil langsung dari
  DevTools.
- Data lintas koleksi tetap konsisten setelah sukses maupun gagal di tengah proses.
- CSP di `netlify.toml` mengizinkan hanya origin tambahan yang benar-benar dibutuhkan.
- Dokumentasi ikut diperbarui bila kontrak data atau alur utama berubah.
