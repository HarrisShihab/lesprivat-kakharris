# Roadmap Sistem Game

**Proyek:** Website Les Privat Kak Harris  
**Lokasi tujuan:** `docs/Games/01-Roadmap.md`  
**Status:** Rancangan awal  
**Fokus rilis:** Matematika SD–SMP

## 1. Tujuan Roadmap

Roadmap ini mengatur urutan perancangan, pembangunan, pengujian, dan pengembangan sistem game agar setiap game tidak dibuat sebagai fitur yang berdiri sendiri. Target akhirnya adalah kumpulan engine yang dapat digunakan ulang untuk menghasilkan banyak variasi game matematika dengan biaya pengembangan yang lebih rendah.

## 2. Batas Cakupan

### Target saat ini

- Siswa SD kelas 1–6.
- Siswa SMP kelas 7–9.
- Materi matematika yang sesuai dengan jenjang akun murid.
- Dua kelompok mode permainan: **Endless** dan **Terbatas**.
- Tampilan responsif untuk ponsel dan desktop.
- Progres permainan terhubung dengan akun murid.
- Bank soal terpisah dari kode engine.

### Belum menjadi target rilis awal

- Konten matematika SMA.
- Multiplayer waktu nyata.
- Papan peringkat publik lintas sekolah.
- Transaksi atau item berbayar di dalam game.
- Aplikasi Android/iOS native.
- Animasi dan grafis kompleks setingkat game komersial.

SMA dicatat sebagai ekspansi masa depan. Struktur data tidak boleh membatasi jenjang hanya pada SD dan SMP, tetapi soal, antarmuka khusus, serta pengujiannya belum dikerjakan pada fase awal.

## 3. Prinsip Pengembangan

1. **Dokumentasi sebelum implementasi.** Kontrak engine dan data disepakati sebelum kode utama dibuat.
2. **Engine dapat digunakan ulang.** Materi, soal, tema visual, dan aturan permainan tidak ditanam langsung ke dalam engine.
3. **Konten terpisah dari mekanik.** Satu mekanik harus dapat melayani banyak materi dan jenjang.
4. **Mobile-first.** Alur utama wajib nyaman digunakan di ponsel tanpa bergantung pada keyboard fisik.
5. **Bertahap.** Versi pertama mengutamakan stabilitas dan manfaat belajar, bukan jumlah fitur.
6. **Terukur.** Setiap game memiliki data hasil yang dapat dipakai untuk melihat performa belajar.
7. **Mudah diperluas.** Penambahan jenjang, materi, mode, atau engine tidak mengharuskan perombakan total.

## 4. Urutan Penyusunan Dokumentasi

### Fase A — Fondasi

| Urutan | Dokumen | Hasil yang harus ditetapkan |
| --- | --- | --- |
| 1 | `README.md` | Struktur dokumentasi dan prinsip umum |
| 2 | `01-Roadmap.md` | Tahapan, prioritas, dan batas cakupan |
| 3 | `02-Arsitektur-Game.md` | Komponen sistem dan hubungan antarbagian |
| 4 | `14-Mode-Permainan.md` | Standar Endless dan Terbatas untuk semua engine |

**Gerbang fase:** arsitektur, istilah, format konfigurasi umum, dan aturan mode tidak saling bertentangan.

### Fase B — Engine Inti

| Urutan | Dokumen | Prioritas | Contoh penggunaan |
| --- | --- | --- | --- |
| 5 | `03-Engine-Quiz.md` | P0 | Pilihan ganda, benar–salah, jawaban angka |
| 6 | `04-Engine-Endless.md` | P0 | Latihan berhitung berkelanjutan |
| 7 | `05-Engine-Matching.md` | P1 | Memasangkan soal–jawaban atau konsep–contoh |
| 8 | `06-Engine-DragDrop.md` | P1 | Mengurutkan, mengelompokkan, melengkapi |
| 9 | `07-Engine-Puzzle.md` | P2 | Pola, logika, susunan bilangan |
| 10 | `08-Engine-Adventure.md` | P2 | Progres berbasis level dan tantangan |

Keterangan prioritas:

- **P0:** wajib untuk MVP.
- **P1:** dibuat setelah MVP stabil.
- **P2:** pengembangan lanjutan.

**Gerbang fase:** setiap dokumen engine memiliki kontrak input/output, alur permainan, aturan skor, kondisi selesai, penanganan kesalahan, penyimpanan hasil, serta minimal satu contoh konfigurasi.

### Fase C — Sistem Pendukung

| Urutan | Dokumen | Fungsi |
| --- | --- | --- |
| 11 | `09-Bank-Soal.md` | Skema soal, metadata materi, jenjang, tingkat kesulitan, dan validasi |
| 12 | `10-UI-UX.md` | Pola layar, navigasi, aksesibilitas, responsivitas, dan umpan balik |
| 13 | `11-Database.md` | Koleksi data, relasi, keamanan, dan penyimpanan progres |
| 14 | `12-Achievement.md` | Definisi pencapaian dan aturan pemberian |
| 15 | `13-Level-XP.md` | Perhitungan XP, level, dan pencegahan eksploitasi |
| 16 | `15-Analitik.md` | Peristiwa yang dicatat dan laporan performa belajar |

**Gerbang fase:** tidak ada data penting yang hanya tersimpan di tampilan; aturan XP dan achievement tidak dapat dimanipulasi dengan mudah dari sisi klien; pengumpulan analitik dibatasi pada data yang memang berguna.

### Fase D — Katalog Pengembangan

| Urutan | Dokumen | Fungsi |
| --- | --- | --- |
| 17 | `99-Ide-Game.md` | Daftar ide game berdasarkan engine, materi, jenjang, dan prioritas |

Ide game baru hanya masuk antrean implementasi jika sudah memiliki target belajar, engine yang digunakan, jenjang, mode, estimasi kompleksitas, dan kriteria selesai.

## 5. Roadmap Implementasi

### Status Integrasi Game Eksisting (Selesai — 11 Agustus 2026)

- **Shared Game Engine Core (`game-engine.js`)**: Berhasil dibuat dan terpasang pada seluruh 5 game eksisting.
- **5 Game Eksisting Terintegrasi**: `Hitung Tanpa Batas`, `Toko Matematika`, `Detektif Pola Bilangan`, `Menara Aljabar`, dan `Petualangan Pecahan`.
- **Kompatibilitas Data**: Format `localStorage` (`kakHarrisGameStats`) dipertahankan 100% kompatibel.
- **Dokumentasi Migrasi**: Tersedia di [`docs/Games/16-Migrasi-Game-Eksisting.md`](file:///E:/web-les-27-07/docs/Games/16-Migrasi-Game-Eksisting.md).

### Tahap 1 — MVP Engine Quiz

Target:

- Satu kontrak konfigurasi game.
- Soal pilihan ganda dan jawaban angka.
- Mode Terbatas berdasarkan jumlah soal dan waktu.
- Mode Endless dengan kenaikan kesulitan.
- Skor, streak, waktu respons, dan ringkasan hasil.
- Filter konten sesuai jenjang akun sebelum daftar game ditampilkan.
- Penyimpanan progres dasar.

Game percontohan disarankan menggunakan materi yang mudah diverifikasi, misalnya operasi hitung bilangan bulat atau aritmetika dasar.

### Tahap 2 — Validasi MVP

Pengujian minimum:

- Ponsel Android berlayar kecil.
- Desktop.
- Akun SD tidak melihat konten khusus SMP.
- Soal tidak berulang terlalu cepat pada mode Endless.
- Sesi yang terputus tidak menghasilkan progres ganda.
- Jawaban angka dapat dimasukkan tanpa memunculkan keyboard yang tidak sesuai.
- Ringkasan hasil cocok dengan jawaban yang dikerjakan.

MVP dianggap lolos jika alur utama dapat diselesaikan tanpa error kritis, data hasil konsisten, dan permainan tetap nyaman pada ponsel.

### Tahap 3 — Engine Interaksi

- Bangun Engine Matching.
- Bangun Engine Drag & Drop.
- Gunakan komponen umum dari Engine Quiz, bukan membuat ulang sistem skor, waktu, dan penyimpanan.
- Tambahkan beberapa game yang menggunakan bank soal yang sama dengan mekanik berbeda.

### Tahap 4 — Progres dan Retensi

- Aktifkan XP dan level.
- Tambahkan achievement yang mendorong konsistensi belajar.
- Buat riwayat hasil yang mudah dibaca murid dan admin.
- Tambahkan analitik untuk melihat materi yang sering salah, tingkat penyelesaian, dan game yang benar-benar dimainkan.

### Tahap 5 — Engine Lanjutan

- Bangun Engine Puzzle setelah komponen dasar stabil.
- Bangun Engine Adventure sebagai lapisan yang menggabungkan beberapa engine.
- Hindari membuat Adventure sebagai engine pertama karena ketergantungannya paling banyak.

### Tahap 6 — Ekspansi Konten

- Perluas katalog menuju 10–15 game matang untuk SD–SMP.
- Evaluasi permintaan pengguna, performa game, dan kebutuhan pembelajaran.
- Pertimbangkan konten SMA hanya jika ada permintaan nyata dan dukungan input matematika kompleks sudah siap.

## 6. Standar Kesiapan Dokumen Engine

Sebuah dokumen engine dianggap selesai jika memuat:

- tujuan dan batas engine;
- target jenjang dan contoh materi;
- alur permainan dari mulai hingga selesai;
- dukungan mode Endless dan/atau Terbatas;
- struktur konfigurasi;
- kontrak input dan output;
- aturan skor, waktu, nyawa, streak, dan kesulitan yang relevan;
- kondisi menang, kalah, berhenti, dan melanjutkan;
- komponen UI serta perilaku pada ponsel;
- integrasi bank soal dan database;
- data analitik yang dicatat;
- penanganan error dan kondisi kosong;
- contoh game;
- batas MVP dan fitur lanjutan;
- kriteria pengujian dan penerimaan.

## 7. Kriteria Game Siap Dirilis

Sebuah game hanya boleh ditandai siap rilis jika:

1. Tujuan belajarnya jelas.
2. Materinya sesuai dengan jenjang yang ditampilkan.
3. Semua soal memiliki jawaban dan validasi yang benar.
4. Mode permainan mengikuti standar bersama.
5. Dapat dimainkan sampai selesai di ponsel dan desktop.
6. Skor dan progres tersimpan dengan benar.
7. Tidak membuka data murid lain.
8. Memiliki keadaan loading, kosong, error, selesai, dan coba lagi.
9. Lulus pengujian manual untuk jalur utama dan kasus batas.
10. Dokumentasi terkait sudah diperbarui.

## 8. Risiko Utama dan Pengendalian

| Risiko | Dampak | Pengendalian |
| --- | --- | --- |
| Terlalu banyak engine dibuat sekaligus | MVP terlambat selesai | Dahulukan Quiz dan Endless |
| Soal ditanam langsung dalam kode | Sulit menambah konten | Gunakan bank soal terpisah |
| Sistem XP mudah dieksploitasi | Progres tidak bermakna | Validasi hasil dan batasi hadiah berulang |
| Filter jenjang terlambat diterapkan | Konten salah sempat terlihat | Filter sebelum daftar game dirender |
| Fokus visual berlebihan | Waktu habis tanpa manfaat belajar | Prioritaskan alur, keterbacaan, dan umpan balik |
| Ekspansi SMA terlalu dini | Cakupan membesar | Simpan sebagai ekspansi, bukan target MVP |
| Data analitik terlalu banyak | Beban dan risiko privasi | Catat hanya data yang mendukung evaluasi belajar |

## 9. Indikator Keberhasilan Awal

Indikator teknis:

- Persentase sesi yang dapat diselesaikan tanpa error.
- Konsistensi penyimpanan skor dan progres.
- Waktu muat daftar game dan sesi permainan.
- Jumlah error per engine dan perangkat.

Indikator penggunaan:

- Jumlah murid yang mencoba game.
- Persentase sesi yang diselesaikan.
- Frekuensi murid kembali bermain.
- Materi dan engine yang paling sering digunakan.

Indikator pembelajaran:

- Akurasi per materi.
- Perubahan akurasi dari waktu ke waktu.
- Waktu respons rata-rata.
- Konsep yang paling sering dijawab salah.

Angka target kuantitatif ditentukan setelah MVP menghasilkan data awal agar target tidak dibuat berdasarkan tebakan.

## 10. Keputusan yang Sudah Ditetapkan

- Fokus konten awal: SD–SMP.
- SMA: ekspansi masa depan, bukan target rilis awal.
- Engine pertama: Quiz.
- Endless dan Terbatas: standar lintas game, bukan dua aplikasi terpisah.
- Bank soal: dipisahkan dari engine.
- Adventure: dibangun setelah engine dasar stabil.
- Platform utama: website responsif, dengan prioritas pengalaman ponsel.

## 11. Langkah Berikutnya

Seluruh rangkaian dokumentasi `02`–`15` dan `99` telah selesai serta diperiksa silang. Langkah berikutnya adalah memulai implementasi fondasi runtime dan primitive Engine Quiz, kemudian merilis game percontohan **Hitung Cepat** melalui `generated_drill` sesuai urutan pada `99-Ide-Game.md`.
