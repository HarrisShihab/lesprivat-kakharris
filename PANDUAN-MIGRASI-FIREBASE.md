# Panduan migrasi Firebase

Website tetap di-deploy ke Netlify dengan alamat yang sama. Firebase hanya dipakai untuk Authentication dan Firestore.

## Yang sudah diubah

- Login memakai Firebase Authentication.
- Role aktif: `admin`, `orangtua`, dan `murid`.
- Hak akses data ditegakkan oleh `firestore.rules`.
- Browser tidak lagi memanggil Google Apps Script.
- PIN tidak disimpan di Firestore atau browser.
- Upload foto dan bukti pembayaran dinonaktifkan. Bukti pembayaran dikirim lewat WhatsApp.
- Jadwal publik dipisah dari jadwal privat sehingga ID murid tidak tampil ke publik.
- Data lama dapat diimpor dari satu file XLSX hasil unduhan Google Sheets.

## Langkah 1 — konfigurasi web Firebase (sudah selesai)

Konfigurasi Web App proyek `les-privat-kak-harris` sudah dimasukkan ke
`firebase-config.js`. Jangan mengubah `FIREBASE_USERNAME_DOMAIN`.

Konfigurasi Firebase di frontend memang boleh terlihat. Pengaman sebenarnya adalah Authentication dan Firestore Rules.

## Langkah 2 — aktifkan login email/password

1. Firebase Console → **Authentication → Sign-in method**.
2. Aktifkan **Email/Password**.
3. Authentication → **Settings → Authorized domains**.
4. Tambahkan `lesprivat-kakharris.netlify.app`.

## Langkah 3 — deploy Firestore Rules

Dari folder utama proyek, jalankan:

```bash
npx firebase-tools@latest login
npx firebase-tools@latest deploy --only firestore:rules,firestore:indexes
```

Jangan menguji data nyata sebelum Rules berhasil di-deploy.

## Langkah 4 — unduh data Google Sheets

Pada Google Sheets lama:

1. **File → Download → Microsoft Excel (.xlsx)**.
2. Simpan file tersebut di folder `tools`.
3. Jangan mengubah nama tab: `Murid`, `Absensi`, `Keuangan`, `Jadwal`, `PengajuanJadwal`, dan `RuangBelajar`.

## Langkah 5 — buat Service Account lokal

1. Firebase Console → **Project settings → Service accounts**.
2. Klik **Generate new private key**.
3. Simpan sebagai `tools/serviceAccountKey.json`.
4. File ini rahasia. Jangan dimasukkan ke ZIP publik, GitHub, atau Netlify.

Sebelum membuat akun atau menulis data ke Firestore, periksa file XLSX:

```bash
cd tools
npm install
npm run periksa -- data-les-privat.xlsx
```

Jika muncul `XLSX BELUM SIAP DIIMPOR`, perbaiki referensi yang disebutkan terlebih dahulu.
Alat migrasi juga menjalankan pemeriksaan yang sama dan akan berhenti sebelum menulis data
apabila ada ID murid duplikat atau data anak yang tidak terhubung ke sheet `Murid`.

## Langkah 6 — tentukan akun baru

1. Salin `tools/accounts.template.json` menjadi `tools/accounts.json`.
2. Isi akun admin, orang tua, dan murid.
3. Setiap akun orang tua/murid harus memiliki `muridIds` yang sesuai, misalnya `["M001"]`.
4. Password minimal 10 karakter dan jangan menggunakan PIN lama.

Username tanpa `@` otomatis dipetakan menjadi email internal. Contoh `kezia` menjadi `kezia@akun.lesprivat-kakharris.id`, tetapi pengguna tetap cukup mengetik `kezia` di halaman login.

## Langkah 7 — jalankan migrasi

Buka terminal di folder `tools`, kemudian:

```bash
npm install
npm run migrate -- data-les-privat.xlsx accounts.json serviceAccountKey.json
```

Alat migrasi:

- Mengabaikan PIN lama dan sheet Admin.
- Memindahkan data akademik/keuangan ke Firestore.
- Membuat akun Firebase Authentication.
- Menghubungkan akun ke data murid.
- Membersihkan karakter berbahaya dari teks lama.
- Menolak impor jika ada ID murid duplikat atau referensi ke murid yang tidak terdaftar.
- Memakai ID transaksi/absensi lama sebagai ID dokumen agar pengulangan tidak menggandakan data.
- Mempertahankan tipe dan status konfirmasi transaksi lama.
- Tidak memindahkan bukti bayar atau foto Drive lama.

Jalankan satu kali pada database kosong. Jika perlu mengulang, gunakan proyek uji atau hapus data hasil pengujian secara terkontrol terlebih dahulu.

## Membuat akun tambahan setelah migrasi

Jika admin menambahkan murid baru dari dashboard:

1. Tambahkan akun yang diperlukan ke `tools/accounts.json`.
2. Jalankan dari folder `tools`:

```bash
npm run provision -- accounts.json serviceAccountKey.json
```

Perintah ini hanya membuat/memperbarui Authentication dan dokumen `users`. Perintah ini tidak mengimpor ulang XLSX.

## Langkah 8 — pengujian sebelum deploy Netlify

Uji minimal:

1. Admin bisa login dan melihat semua murid.
2. Orang tua hanya melihat anak yang terhubung.
3. Murid tidak dapat membuka laporan keuangan.
4. Orang tua/murid tidak dapat membuka `dashboard.html`.
5. Admin bisa menambah absensi, pembayaran, dan materi.
6. Pengajuan jadwal bisa dibuat dan diproses.
7. Jadwal publik di beranda tidak memuat nama atau ID murid.
8. Setelah logout, tombol Back tidak membuka data akun.

## Langkah 9 — deploy Netlify

Upload isi folder utama proyek ini seperti biasa. Jangan ikut mengunggah:

- folder `tools/node_modules`;
- `tools/serviceAccountKey.json`;
- `tools/accounts.json`;
- file XLSX data lama.

`netlify.toml` sudah berisi header keamanan.

## Langkah 10 — tutup sistem lama

Setelah Firebase lolos pengujian dan data cocok:

1. Nonaktifkan deployment Google Apps Script lama.
2. Jangan hapus Google Sheets dulu; simpan sebagai arsip privat.
3. Ganti PIN lama apabila PIN tersebut pernah dipakai di layanan lain.
4. Kirim akun baru secara pribadi melalui WhatsApp.
