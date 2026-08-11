# Arsitektur dan Kontrak Data

## Status dokumen

Dokumen ini mencerminkan implementasi yang diperiksa pada **11 Agustus 2026**. Jika ada perbedaan dengan kode, kode dan `firestore.rules` menjadi sumber kebenaran terakhir.

## Gambaran sistem

Browser memuat halaman statis dari Netlify. `firebase-api.js` menginisialisasi Firebase compat SDK dan mengganti `window.fetch` khusus URL internal `firebase://secure-api`. Dengan pola ini, kode halaman lama tetap memanggil antarmuka mirip HTTP, tetapi operasi data dijalankan langsung melalui Firebase SDK dengan sesi pengguna yang aktif.

Upload bukti pembayaran adalah pengecualian. Browser mengirim Firebase ID token dan file berformat base64 ke Google Apps Script. Apps Script memverifikasi token, memastikan akun orang tua memiliki murid tersebut, menyimpan file ke Drive, lalu membuat metadata `buktiPembayaran` di Firestore.

## Role dan halaman

| Role | Halaman | Akses utama |
|---|---|---|
| Publik | `index.html` | Membaca `jadwalPublik` |
| `admin` | `dashboard.html` | Mengelola seluruh data operasional |
| `orangtua` | `ortu-dashboard.html` | Membaca data anak, upload bukti, mengajukan jadwal |
| `murid` | `murid-dashboard.html`, game | Membaca data belajar sendiri dan bermain game |

`users/{uid}` adalah sumber role dan cakupan akses. Field `muridIds` menghubungkan akun orang tua/murid dengan dokumen `murid/{idMurid}`.

## Koleksi Firestore

| Koleksi | Tujuan | Penulis utama |
|---|---|---|
| `users` | Profil, role, status aktif, dan daftar `muridIds` | Admin; pemilik hanya field profil tertentu |
| `murid` | Data murid, paket, durasi, status, UID akun, sesi | Admin |
| `absensi` | Kehadiran dan catatan sesi | Admin |
| `keuangan` | Riwayat transaksi | Admin |
| `buktiPembayaran` | Metadata bukti dan status pemeriksaan | Apps Script/admin |
| `materi` | Materi, video YouTube, tautan Quizizz/Wayground | Admin |
| `jadwal` | Jadwal privat yang memuat `idMurid` | Admin |
| `jadwalPublik` | Slot jadwal tanpa identitas murid | Admin; baca publik |
| `pengajuanJadwal` | Pengajuan orang tua dan riwayat keputusan | Orang tua membuat; admin memproses |
| `slotJadwal` | Pengunci waktu per 15 menit | Transaksi pengajuan/admin |
| `kuotaJadwal` | Pengunci nomor jadwal per murid dan paket | Transaksi pengajuan/admin |
| `system` | Counter monotonik, terutama `system/counters.murid` | Admin |

Semua koleksi lain ditolak oleh rule catch-all.

## Status penting

- Murid: `Pending`, `Aktif`, `Nonaktif` (kode lama juga mengenali `Dihapus`).
- Pengajuan jadwal: `Pending`, `Disetujui`, `Ditolak`, `Dibatalkan`.
- Jadwal/slot/kuota aktif: `Aktif`; slot/kuota sementara: `Pending`.
- Bukti pembayaran: `Menunggu konfirmasi`, `Diterima`, `Ditolak`.

Perubahan ejaan atau kapitalisasi status adalah breaking change karena UI, API, dan Rules membandingkan string secara langsung.

## Alur ID murid

1. Admin mendaftarkan murid.
2. Transaksi membaca `system/counters.murid`, menaikkannya, lalu membuat ID seperti `M001`, `M002`, dan seterusnya.
3. Penonaktifan hanya mengubah status dan hubungan akun; counter tidak pernah mundur.
4. Aktivasi kembali memakai dokumen dan ID lama.

## Alur jadwal

### Batasan

- Hari: Senin–Sabtu.
- Senin–Jumat mulai pukul 13.00–17.00; Sabtu mulai pukul 09.00–17.00.
- Kelipatan waktu 15 menit, durasi 60 atau 90 menit, selesai maksimal 17.30.
- Jeda minimum antarjadwal 15 menit.
- Hari dalam satu pengiriman harus berbeda.
- Maksimal jadwal: 1 secara default, 2 untuk paket dengan penanda `_8_`, dan 3 untuk paket dengan penanda `_12_`.

### Pengajuan orang tua

1. UI memeriksa sisa kuota dan slot tersedia.
2. Satu pengiriman dapat memuat 1–3 jadwal sesuai sisa kuota.
3. Setiap jadwal dibuat dalam transaksi yang menulis `pengajuanJadwal`, satu `kuotaJadwal`, dan token `slotJadwal` yang diperlukan.
4. Pengunci berstatus `Pending` dan kedaluwarsa dalam 24 jam.
5. Firestore Rules memvalidasi ownership, paket, durasi, slot, status, expiry, dan hubungan antar-dokumen melalui `existsAfter()`/`getAfter()`.

### Persetujuan admin

Transaksi mengubah pengajuan, mengaktifkan kuota dan token slot, lalu membuat pasangan `jadwal` + `jadwalPublik`. Penolakan membebaskan kuota dan token.

### Penghapusan

- Hapus jadwal individual hanya berlaku untuk pengajuan `Disetujui`, menghapus jadwal privat/publik beserta penguncinya, lalu menandai pengajuan `Dibatalkan`.
- Bersihkan riwayat hanya menghapus dokumen `Ditolak` dan `Dibatalkan`.
- Reset semua jadwal adalah aksi admin terpisah dan destruktif; aksi ini menghapus lima koleksi jadwal tetapi tidak menghapus murid.

## Alur pembayaran

1. Orang tua memilih anak, nominal, keterangan, dan file JPG/PNG/WebP/PDF maksimal 5 MB.
2. Apps Script memverifikasi Firebase ID token dan `users/{uid}.muridIds`.
3. File disimpan privat di Drive dan metadata dibuat dengan status `Menunggu konfirmasi`.
4. Admin menerima atau menolak. Penerimaan atomik membuat transaksi `keuangan` dan menyimpan `transaksiId` pada bukti.

## Game belajar

### Arsitektur

Game tidak lagi menyimpan seluruh mekanik quiz secara terpisah. Lima game eksisting menggunakan shared `game-engine.js`, sedangkan konfigurasi/bank soal berada di file `*-config.js`.

Alur umumnya:

`game HTML/JS → game config/bank → KakHarrisGameEngine.createQuizGame() → hasil sesi → saveGameResult() → localStorage`

Engine saat ini menangani antara lain:

- mode Endless dan Terbatas berdasarkan jumlah soal;
- scoring, streak, dan best streak;
- lives untuk game yang menggunakannya;
- hint dengan biaya skor;
- jawaban angka maupun teks/pilihan;
- pencegahan pengulangan soal terlalu cepat;
- adaptive difficulty yang dapat diaktifkan per game;
- callback untuk UI dan hasil sesi;
- penyimpanan statistik per murid.

Statistik memakai key `kakHarrisGameStats:<id-murid>` di `localStorage` dan tidak tersinkron antarperangkat.

### Katalog game

| Game | Jenjang | Mode terbatas | Engine |
|---|---|---|---|
| Hitung Tanpa Batas | SD, SMP | 10 soal | Quiz |
| Toko Matematika | SD, SMP | 10 transaksi | Quiz |
| Detektif Pola Bilangan | SD, SMP | 10 kasus | Quiz |
| Menara Aljabar | SMP | 10 lantai | Quiz |
| Petualangan Pecahan | SD | 10 misi | Quiz |

Katalog baru dirender setelah role dan jenjang murid terbaca agar kartu lintas jenjang tidak sempat muncul. Halaman game tetap melakukan guard sendiri; filter katalog bukan kontrol keamanan.

### Pengujian engine

`test-quiz-engine.js` menyediakan test lokal untuk alur limited/endless, skip, jawaban salah, lives, hint, custom scoring, text/choice answer, boss flag, pilihan Petualangan, idempotensi finish, konsistensi summary, anti-repeat, grade filter, dan adaptive difficulty.

Test tersebut memperkuat mekanik engine, tetapi belum menggantikan pengujian UI, Firebase Rules, browser, dan perangkat fisik.

## SEO dan publik

Halaman utama publik saat ini memiliki title/description, canonical, robots directive, Open Graph, Twitter Card, structured data `EducationalOrganization`/`Course`, serta sitemap dan robots.txt. Target SEO berikutnya adalah memperkuat konten halaman yang menjawab intent pencarian seperti les privat Matematika SD/SMP online, kelas tertentu, dan kebutuhan belajar tertentu.

## Keamanan dan deployment

`firestore.rules` menggunakan autentikasi, role aktif, ownership `muridIds`, pembatasan field, validasi jadwal/quota, dan catch-all deny. `netlify.toml` memasang security headers dan CSP.

Firebase Web config berada di sisi klien dan bukan secret. Secret yang harus dilindungi tetap mencakup service-account credential, password, ID token, dan kredensial server lainnya.

Frontend terdeploy melalui Netlify. Firestore Rules/indexes dan Apps Script mempunyai deployment terpisah.

## Utang teknis dan pekerjaan terbuka

- `dashboard.html` masih memuat logika admin inline dalam file yang sangat besar.
- Versi Firebase compat SDK belum seragam: sebagian halaman memakai 12.16.0 dan portal memakai 10.14.1; perlu audit dan penyatuan sebelum upgrade lebih lanjut.
- Limited mode berbasis waktu belum menjadi bagian umum dari engine.
- Validasi mobile/desktop menyeluruh untuk lima game masih perlu dilakukan.
- Automated test saat ini fokus pada game engine; belum ada test suite menyeluruh untuk flow Firebase/Rules/UI.
- Belum ada lint/quality tooling khusus.
- Engine Matching, Drag & Drop, Puzzle, dan Adventure masih tahap roadmap.
- XP, achievement, riwayat hasil terstruktur, dan analitik belajar belum menjadi sistem penuh.
