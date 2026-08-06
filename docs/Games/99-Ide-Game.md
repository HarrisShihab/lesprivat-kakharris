# Katalog Ide Game Matematika

**Proyek:** Website Les Privat Kak Harris  
**Lokasi tujuan:** `docs/Games/99-Ide-Game.md`  
**Status:** Katalog pengembangan awal  
**Fokus rilis:** Matematika SD–SMP

## 1. Tujuan

Dokumen ini menjadi antrean resmi ide game yang dapat dibangun dari engine bersama. Katalog tidak hanya mencatat nama game, tetapi juga tujuan belajar, target kelas, engine, mode, kompleksitas, kebutuhan konten, dan syarat agar sebuah ide layak masuk implementasi.

Dokumen ini bukan janji bahwa semua ide akan dibuat. Prioritas tetap mengikuti `01-Roadmap.md`: selesaikan sedikit game yang matang, ukur penggunaannya, kemudian perluas konten berdasarkan kebutuhan murid.

## 2. Prinsip Katalog

1. **Satu engine dapat menghasilkan banyak game.** Perbedaan materi atau tema visual tidak otomatis membutuhkan engine baru.
2. **Tujuan belajar mendahului tema.** Nama dan cerita boleh menarik, tetapi mekanik harus membantu latihan konsep yang jelas.
3. **Game tidak identik dengan satu bank soal.** Satu game dapat memiliki beberapa paket materi dan tingkat kesulitan.
4. **Mobile-first.** Semua ide harus dapat diselesaikan pada ponsel tanpa keyboard fisik.
5. **SD–SMP lebih dahulu.** SMA hanya dicatat sebagai kemungkinan ekspansi dan tidak masuk antrean awal.
6. **Game lama tidak dihapus otomatis.** Game yang sudah ada diaudit, dipertahankan jika berguna, lalu secara bertahap dipindahkan ke kontrak engine bersama.
7. **Kualitas lebih penting daripada jumlah.** Target awal adalah 10–15 game matang, bukan puluhan game setengah jadi.
8. **Tidak ada duplikasi mekanik terselubung.** Variasi konten dicatat sebagai paket, bukan dipasarkan sebagai engine baru.

## 3. Perbedaan Engine, Game, Paket Konten, dan Tema

| Lapisan | Contoh | Fungsi |
| --- | --- | --- |
| Engine | `quiz`, `generated_drill`, `matching` | Menentukan mekanik dan lifecycle sesi |
| Game | Toko Matematika | Menentukan pengalaman, tujuan umum, dan konfigurasi |
| Paket konten | Uang kelas 3, diskon SMP | Menentukan materi dan item yang dimainkan |
| Tema | toko, pulau, laboratorium | Menentukan identitas visual dan narasi |
| Mode | `endless`, `limited_questions`, `limited_time`, `limited_lives` | Menentukan batas dan kondisi selesai |

Contoh: **Toko Matematika** tetap satu game walaupun mempunyai paket penjumlahan uang, kembalian, diskon, dan untung-rugi. Paket tersebut dapat memakai tingkat kelas berbeda tanpa membuat empat engine atau empat aplikasi terpisah.

## 4. Status Ide

| Status | Arti |
| --- | --- |
| `idea` | Baru dicatat, belum ditinjau lengkap |
| `screened` | Tujuan belajar, engine, dan target kelas sudah jelas |
| `planned` | Masuk roadmap implementasi dan memiliki spesifikasi |
| `prototype` | Sudah memiliki versi uji |
| `pilot` | Sedang diuji dengan pengguna terbatas |
| `released` | Tersedia untuk pengguna sesuai target |
| `paused` | Ditunda tanpa dihapus dari katalog |
| `retired` | Tidak lagi ditawarkan; alasan dan riwayat tetap dicatat |

Status pada tabel katalog di bawah merupakan **rekomendasi perencanaan**, bukan klaim status kode yang ada di repository. Status aktual wajib diaudit sebelum implementasi dimulai.

## 5. Prioritas

| Prioritas | Arti | Keputusan |
| --- | --- | --- |
| P0 | Wajib untuk MVP | Dibangun dan diuji lebih dahulu |
| P1 | Variasi interaksi setelah MVP stabil | Masuk gelombang kedua |
| P2 | Engine atau orkestrasi lanjutan | Dikerjakan setelah data penggunaan tersedia |
| P3 | Eksperimen atau kebutuhan belum terbukti | Disimpan sebagai backlog |

Prioritas tidak ditentukan oleh seberapa menarik nama game, tetapi oleh manfaat belajar, penggunaan ulang komponen, biaya konten, risiko teknis, dan kecocokan dengan layanan Les Privat Kak Harris.

## 6. Skala Kompleksitas

| Nilai | Makna |
| --- | --- |
| S | Konfigurasi sederhana pada engine dan komponen yang sudah stabil |
| M | Membutuhkan paket konten, UI, atau evaluator tambahan yang masih wajar |
| L | Membutuhkan aset, orkestrasi, validator, atau pengujian yang lebih luas |
| XL | Di luar target awal; hanya boleh masuk roadmap dengan alasan kuat |

Kompleksitas menilai pekerjaan setelah engine terkait tersedia. Pembangunan engine itu sendiri tetap mengikuti prioritas pada roadmap.

## 7. Format Kartu Ide Wajib

Ide baru hanya boleh masuk antrean jika minimal memiliki data berikut:

```yaml
gameId: string
title: string
status: idea | screened | planned | prototype | pilot | released | paused | retired
priority: P0 | P1 | P2 | P3
learningGoal: string
educationLevels: [SD, SMP]
grades: [number]
topics: [string]
engineType: quiz | generated_drill | matching | drag_drop | puzzle | adventure
supportedModes: [limited_questions, limited_time]
recommendedMode: limited_questions
complexity: S | M | L | XL
contentNeeds: string
assetNeeds: string
acceptanceSummary: string
```

Aturan ID:

- gunakan huruf kecil dan `kebab-case`;
- ID tidak memuat kelas agar game dapat diperluas melalui paket konten;
- ID tidak diubah ketika judul tampilan diperbaiki;
- game lama yang dimigrasikan mempertahankan ID jika tidak menimbulkan konflik;
- variasi materi memakai `contentPackId`, bukan `gameId` baru.

## 8. Portofolio Awal yang Direkomendasikan

Lima belas game berikut menjadi batas portofolio awal. Artinya, katalog boleh lebih besar, tetapi ekspansi rilis dihentikan dahulu ketika 10–15 game ini sudah mencakup variasi materi dan mekanik yang cukup.

| Urutan | Game | Engine | Target | Prioritas | Kompleksitas | Peran dalam portofolio |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Hitung Cepat | `generated_drill` | SD 2–6 | P0 | S | Validasi generator, input angka, dan mode waktu |
| 2 | Toko Matematika | `quiz` | SD 3–6 | P0 | M | Mempertahankan konsep game kontekstual yang sudah ada |
| 3 | Misi Bilangan Bulat | `generated_drill` | SMP 7 | P0 | S | Game percontohan SMP dan kesulitan adaptif |
| 4 | Pecahan Bertahap | `generated_drill` | SD 5–6, SMP 7 | P1 | M | Menguji evaluator pecahan terstruktur |
| 5 | Pasangan Hitung Cepat | `matching` | SD 1–4 | P1 | S | Implementasi pertama Matching |
| 6 | Pecahan Kembar | `matching` | SD 4–6 | P1 | M | Representasi pecahan senilai |
| 7 | Kelompok Ganjil–Genap | `drag_drop` | SD 2–4 | P1 | S | Implementasi pertama Drag & Drop |
| 8 | Kelompok Suku Aljabar | `drag_drop` | SMP 7 | P1 | M | Klasifikasi konsep aljabar |
| 9 | Urutkan Bilangan | `puzzle` | SD 2–6, SMP 7 | P2 | M | Implementasi pertama Puzzle |
| 10 | Tangga Pecahan | `puzzle` | SD 5–6, SMP 7 | P2 | M | Membandingkan pecahan, desimal, dan persen |
| 11 | Statistik Cocok | `matching` | SMP 7–9 | P1 | M | Memasangkan istilah, data, dan representasi |
| 12 | Detektif Bangun Datar | `quiz` | SD 4–6, SMP 7 | P1 | M | Sifat, keliling, dan luas dalam satu payung game |
| 13 | Kereta Konversi Satuan | `matching` | SD 3–6 | P1 | M | Latihan konversi panjang, berat, waktu, dan volume |
| 14 | Ekspedisi Pulau Bilangan | `adventure` | SD 4–6, SMP 7 | P2 | L | Validasi orkestrasi linear beberapa aktivitas |
| 15 | Misi Aljabar Dasar | `adventure` | SMP 7 | P2 | L | Perjalanan belajar variabel sampai persamaan sederhana |

Urutan implementasi tidak boleh langsung melompat dari nomor 3 ke Adventure. Engine dan sistem pendukungnya harus lolos gerbang pada `01-Roadmap.md` terlebih dahulu.

## 9. Kandidat MVP P0

### 9.1 Hitung Cepat

| Elemen | Rancangan |
| --- | --- |
| `gameId` | `hitung-cepat` |
| Tujuan belajar | Meningkatkan ketepatan dan kelancaran operasi hitung dasar |
| Target | SD kelas 2–6 dengan paket konten terpisah |
| Engine | `generated_drill` |
| Mode awal | 10 soal dan 60 detik |
| Konten awal | Penjumlahan, pengurangan, perkalian, pembagian habis |
| Kompleksitas | S |
| Aset | Ikon operasi dan ilustrasi ringan; tanpa aset kompleks |
| Kriteria selesai | Tiga generator tervalidasi, anti-pengulangan aktif, sesi dapat dipulihkan, dan hasil tersimpan tepat satu kali |

Game ini menjadi implementasi pertama karena jawaban mudah diverifikasi, materi luas, dan semua bagian dasar engine dapat diuji tanpa narasi rumit.

### 9.2 Toko Matematika

| Elemen | Rancangan |
| --- | --- |
| `gameId` | `toko-matematika` |
| Tujuan belajar | Menggunakan aritmetika dalam situasi harga, pembayaran, dan kembalian |
| Target | SD kelas 3–6 |
| Engine | `quiz` untuk MVP; dapat memakai `generated_drill` pada versi berikutnya |
| Mode awal | 10 soal tanpa tekanan waktu |
| Konten awal | Total belanja, uang dibayar, dan kembalian |
| Kompleksitas | M |
| Aset | Kartu produk dan ikon uang yang ringan |
| Kriteria selesai | Nilai uang terbaca jelas, pilihan tidak ambigu, dan seluruh soal sesuai kelas |

Konsep Toko Matematika yang sudah ada sebaiknya dipertahankan. Sebelum migrasi, audit mekanik, data, dan UI-nya. Refactor dilakukan bertahap; game lama tidak dihapus sebelum versi engine bersama memiliki kesetaraan fitur dan data pengguna aman.

### 9.3 Misi Bilangan Bulat

| Elemen | Rancangan |
| --- | --- |
| `gameId` | `misi-bilangan-bulat` |
| Tujuan belajar | Menguasai operasi dan urutan operasi bilangan bulat |
| Target | SMP kelas 7 |
| Engine | `generated_drill` |
| Mode awal | 20 soal dan Endless |
| Konten awal | Tambah, kurang, kali, bagi, dan operasi campuran |
| Kompleksitas | S |
| Aset | Tema misi sederhana tanpa peta Adventure |
| Kriteria selesai | Tingkat kesulitan adaptif, tanda negatif nyaman dimasukkan di HP, dan generator menghasilkan soal valid |

Tema “misi” pada versi ini hanya membungkus sesi latihan. Game tidak perlu menunggu Engine Adventure.

## 10. Ide Berbasis Engine Quiz

| ID | Judul | Kelas | Tujuan belajar | Mode utama | Kompleksitas | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| `toko-matematika` | Toko Matematika | SD 3–6 | Harga, total, pembayaran, kembalian | Batas soal | M | P0 |
| `detektif-bangun-datar` | Detektif Bangun Datar | SD 4–6, SMP 7 | Sifat, keliling, dan luas bangun | Batas soal | M | P1 |
| `tebak-nilai-tempat` | Tebak Nilai Tempat | SD 1–4 | Nilai tempat dan bentuk panjang bilangan | Batas soal | S | P1 |
| `cerita-operasi` | Cerita Operasi | SD 2–6 | Memilih operasi dari soal cerita | Batas soal | M | P1 |
| `pecahan-dalam-gambar` | Pecahan dalam Gambar | SD 3–6 | Mengenali pecahan dari model visual | Batas soal | M | P1 |
| `persen-sehari-hari` | Persen Sehari-hari | SMP 7–8 | Diskon, kenaikan, dan persentase | Batas soal | M | P1 |
| `tebak-koordinat` | Tebak Koordinat | SMP 7–8 | Membaca titik dan kuadran | Batas soal | M | P2 |
| `data-berbicara` | Data Berbicara | SD 5–6, SMP 7–8 | Membaca tabel dan diagram sederhana | Batas soal | M | P1 |
| `benar-salah-aljabar` | Benar atau Salah: Aljabar | SMP 7 | Variabel, koefisien, suku, dan operasi | Nyawa | S | P1 |
| `estimasi-cerdas` | Estimasi Cerdas | SD 4–6 | Pembulatan dan taksiran | Batas waktu | S | P2 |

Game Quiz dengan tema berbeda boleh berbagi komponen layar. Perbedaan yang hanya berupa warna atau nama tidak cukup untuk membuat entri baru.

## 11. Ide Berbasis Engine Generated Drill

| ID | Judul | Kelas | Generator | Mode utama | Kompleksitas | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| `hitung-cepat` | Hitung Cepat | SD 2–6 | Operasi aritmetika dasar | Batas waktu | S | P0 |
| `misi-bilangan-bulat` | Misi Bilangan Bulat | SMP 7 | Operasi bilangan bulat | Endless | S | P0 |
| `pecahan-bertahap` | Pecahan Bertahap | SD 5–6, SMP 7 | Pecahan senilai dan operasi pecahan | Batas soal | M | P1 |
| `kelipatan-faktor` | Pemburu Faktor | SD 4–6 | Faktor, kelipatan, FPB, KPK | Batas soal | M | P1 |
| `desimal-cepat` | Desimal Cepat | SD 5–6 | Operasi desimal | Batas soal | M | P1 |
| `pangkat-dasar` | Tangga Pangkat | SMP 8–9 | Pangkat bulat sederhana | Batas soal | M | P2 |
| `persamaan-satu-langkah` | Persamaan Kilat | SMP 7 | Persamaan linear satu langkah | Batas soal | M | P1 |
| `perbandingan-cepat` | Rasio Cepat | SD 6, SMP 7 | Perbandingan dan skala sederhana | Batas soal | M | P2 |

Generator simbolik kompleks, grafik fungsi, akar yang memerlukan penyederhanaan, dan input ekspresi bebas belum masuk rilis awal.

## 12. Ide Berbasis Engine Matching

| ID | Judul | Kelas | Pasangan | Mode utama | Kompleksitas | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| `pasangan-hitung-cepat` | Pasangan Hitung Cepat | SD 1–4 | Operasi–hasil | Batas pasangan | S | P1 |
| `pecahan-kembar` | Pecahan Kembar | SD 4–6 | Dua representasi senilai | Batas pasangan | M | P1 |
| `kereta-konversi-satuan` | Kereta Konversi Satuan | SD 3–6 | Besaran–hasil konversi | Batas pasangan | M | P1 |
| `jodohkan-bangun` | Jodohkan Bangun | SD 3–6, SMP 7 | Bangun–sifat atau rumus | Batas pasangan | M | P1 |
| `aljabar-berpasangan` | Aljabar Berpasangan | SMP 7 | Bentuk–hasil sederhana | Batas pasangan | M | P1 |
| `statistik-cocok` | Statistik Cocok | SMP 7–9 | Istilah–definisi atau contoh | Batas pasangan | M | P1 |
| `simbol-dan-arti` | Simbol dan Arti | SD 1–4 | Simbol matematika–makna | Batas pasangan | S | P2 |
| `koordinat-berpasangan` | Koordinat Berpasangan | SMP 7–8 | Titik–posisi atau kuadran | Batas waktu | M | P2 |

## 13. Ide Berbasis Engine Drag & Drop

| ID | Judul | Kelas | Tugas | Mode utama | Kompleksitas | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| `kelompok-ganjil-genap` | Kelompok Ganjil–Genap | SD 2–4 | Klasifikasi bilangan | Batas item | S | P1 |
| `kelompok-suku-aljabar` | Kelompok Suku Aljabar | SMP 7 | Mengelompokkan suku sejenis | Batas item | M | P1 |
| `klasifikasi-sudut` | Kenali Jenis Sudut | SD 4–6, SMP 7 | Lancip, siku-siku, tumpul | Batas item | M | P1 |
| `kelompok-pecahan-senilai` | Kelompok Pecahan Senilai | SD 5–6 | Klasifikasi nilai pecahan | Batas item | M | P1 |
| `bedah-lingkaran` | Bedah Lingkaran | SMP 8 | Pelabelan bagian lingkaran | Batas item | L | P2 |
| `kelompok-bilangan` | Keluarga Bilangan | SMP 7 | Bulat, cacah, prima, komposit | Batas item | M | P2 |
| `konversi-satuan-drop` | Stasiun Satuan | SD 4–6 | Nilai–kategori konversi | Batas waktu | M | P2 |
| `pilah-data` | Pilah Data | SMP 7–8 | Data kategorik dan numerik | Batas item | M | P2 |

Mengurutkan langkah kompleks tidak memakai Drag & Drop. Tantangan yang dinilai dari keseluruhan state papan masuk Engine Puzzle.

## 14. Ide Berbasis Engine Puzzle

| ID | Judul | Kelas | Jenis puzzle | Mode utama | Kompleksitas | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| `urutkan-bilangan` | Urutkan Bilangan | SD 2–6, SMP 7 | `ordered_sequence` | Batas puzzle | M | P2 |
| `tangga-pecahan` | Tangga Pecahan | SD 5–6, SMP 7 | `ordered_sequence` | Batas puzzle | M | P2 |
| `rantai-operasi` | Rantai Operasi | SD 4–6, SMP 7 | `ordered_sequence` | Batas puzzle | M | P2 |
| `langkah-persamaan` | Langkah Persamaan | SMP 7–8 | `ordered_sequence` | Batas puzzle | M | P2 |
| `pola-yang-hilang` | Pola yang Hilang | SD 4–6, SMP 7 | `grid_rearrangement` | Batas puzzle | L | P2 |
| `grid-koordinat` | Grid Koordinat | SMP 7–8 | `grid_rearrangement` | Batas puzzle | L | P3 |
| `jalur-konversi` | Jalur Konversi | SD 4–6 | `ordered_sequence` | Batas puzzle | M | P2 |
| `urutan-pecahkan-soal` | Urutan Pecahkan Soal | SD 5–6, SMP 7 | `ordered_sequence` | Batas puzzle | M | P3 |

## 15. Ide Berbasis Engine Adventure

| ID | Judul | Kelas | Aktivitas anak utama | Kompleksitas | Prioritas |
| --- | --- | --- | --- | --- | --- |
| `ekspedisi-pulau-bilangan` | Ekspedisi Pulau Bilangan | SD 4–6, SMP 7 | Quiz, Generated Drill, Puzzle | L | P2 |
| `misteri-kota-pecahan` | Misteri Kota Pecahan | SD 5–6, SMP 7 | Quiz, Matching, Puzzle | L | P2 |
| `laboratorium-bangun-datar` | Laboratorium Bangun Datar | SD 5–6, SMP 7 | Quiz, Matching, Drag & Drop | L | P2 |
| `misi-aljabar-dasar` | Misi Aljabar Dasar | SMP 7 | Quiz, Drag & Drop, Puzzle | L | P2 |
| `jelajah-koordinat` | Jelajah Koordinat | SMP 7–8 | Quiz dan Puzzle | L | P3 |
| `rute-remedial` | Rute Remedial Matematika | SD–SMP | Cabang sesuai materi yang perlu dilatih | XL | P3 |

Versi Adventure pertama wajib linear, memakai tiga node Engine Quiz, satu ending, dan tanpa cabang. Tema tidak boleh dipakai untuk menyamarkan ketergantungan engine anak yang belum stabil.

## 16. Paket Konten yang Dapat Dipakai Ulang

| `contentPackId` | Target | Materi | Engine yang dapat memakai |
| --- | --- | --- | --- |
| `sd-aritmetika-dasar-v1` | SD 2–4 | Tambah, kurang, kali, bagi | Quiz, Generated Drill, Matching |
| `sd-uang-v1` | SD 3–5 | Nilai uang, total, kembalian | Quiz, Matching |
| `sd-pecahan-dasar-v1` | SD 4–6 | Representasi dan pecahan senilai | Quiz, Matching, Drag & Drop, Puzzle |
| `sd-konversi-satuan-v1` | SD 3–6 | Panjang, berat, waktu, volume | Quiz, Matching, Drag & Drop, Puzzle |
| `sd-bangun-datar-v1` | SD 4–6 | Sifat, keliling, luas | Quiz, Matching, Drag & Drop |
| `smp-bilangan-bulat-v1` | SMP 7 | Operasi bilangan bulat | Quiz, Generated Drill, Puzzle |
| `smp-aljabar-dasar-v1` | SMP 7 | Komponen, suku sejenis, operasi | Quiz, Matching, Drag & Drop, Puzzle |
| `smp-statistika-dasar-v1` | SMP 7–8 | Istilah, tabel, mean, median, modus | Quiz, Matching |
| `smp-koordinat-v1` | SMP 7–8 | Titik dan kuadran | Quiz, Matching, Puzzle |

Pemakaian lintas engine tidak berarti satu bentuk konten mentah langsung cocok untuk semua engine. Metadata, konsep, dan aset dapat digunakan ulang, sedangkan projection presentasi dan evaluation spec tetap mengikuti `09-Bank-Soal.md`.

## 17. Cara Menghasilkan Ratusan Variasi Tanpa Ratusan Engine

Jumlah variasi berasal dari kombinasi terkontrol:

```text
engine × paket materi × kelas × tingkat kesulitan × mode × tema
```

Contoh satu Engine Quiz dapat dipakai untuk:

- 8 paket materi;
- 3 tingkat kesulitan;
- 2 mode yang relevan;
- 2 tema visual.

Secara teoritis kombinasi tersebut menghasilkan 96 konfigurasi. Namun, setiap kombinasi tidak otomatis menjadi produk. Hanya kombinasi yang masuk akal secara pembelajaran, memiliki konten cukup, dan lolos pengujian yang boleh diterbitkan.

Katalog membedakan:

- **game publik**, yang tampil sebagai pilihan bermakna bagi murid;
- **paket materi**, yang dipilih di dalam game;
- **varian konfigurasi**, yang dipakai sistem tanpa memenuhi katalog dengan kartu duplikat.

## 18. Matriks Kecocokan Materi dan Engine

| Materi | Quiz | Generated Drill | Matching | Drag & Drop | Puzzle | Adventure |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Aritmetika dasar | Sangat cocok | Sangat cocok | Cocok | Terbatas | Cocok | Cocok |
| Bilangan bulat | Sangat cocok | Sangat cocok | Cocok | Cocok | Sangat cocok | Cocok |
| Pecahan | Sangat cocok | Cocok setelah evaluator siap | Sangat cocok | Cocok | Sangat cocok | Cocok |
| Geometri | Sangat cocok | Terbatas | Cocok | Sangat cocok | Cocok | Sangat cocok |
| Konversi satuan | Cocok | Cocok | Sangat cocok | Cocok | Cocok | Cocok |
| Aljabar dasar | Sangat cocok | Cocok | Cocok | Sangat cocok | Sangat cocok | Sangat cocok |
| Statistika | Sangat cocok | Terbatas | Sangat cocok | Cocok | Terbatas | Cocok |
| Koordinat | Cocok | Terbatas | Cocok | Cocok | Sangat cocok | Cocok |

Label “terbatas” berarti mekanik hanya cocok untuk sebagian tujuan belajar dan tidak boleh dipaksakan.

## 19. Aturan Pemilihan Mode

- Gunakan `limited_questions` sebagai default ketika ketuntasan paket lebih penting daripada kecepatan.
- Gunakan `limited_time` hanya jika kecepatan memang menjadi target latihan; jangan memakainya pada materi baru.
- Gunakan `limited_lives` untuk tantangan singkat, bukan sebagai hukuman terus-menerus.
- Gunakan `endless` untuk latihan berkelanjutan yang memiliki pasokan konten cukup dan penghentian manual aman.
- Matching menghitung pasangan selesai, Drag & Drop menghitung item selesai, dan Puzzle menghitung puzzle selesai.
- Adventure memakai lifecycle `ending_driven`; mode resmi diterapkan pada aktivitas anak, bukan parent.

## 20. Aturan Jenjang dan Kelas

1. Setiap game memiliki daftar kelas yang eksplisit.
2. Filter jenjang dilakukan sebelum kartu game ditampilkan.
3. Paket lintas jenjang harus memiliki konfigurasi, bahasa, dan kesulitan terpisah.
4. Label SD–SMP tidak boleh dipakai jika isi hanya diuji pada salah satu jenjang.
5. Satu akun tidak boleh melihat konten kelas lebih tinggi hanya karena engine mendukungnya.
6. Tutor atau admin dapat merekomendasikan paket tambahan melalui aturan akses yang jelas.
7. SMA tidak dimasukkan pada `audienceKeys` rilis awal walaupun struktur data mendukung kelas 10–12.

## 21. Kebutuhan Aset

| Tingkat | Contoh | Kebijakan |
| --- | --- | --- |
| Ringan | ikon angka, simbol, kartu warna | Boleh masuk P0 |
| Sedang | gambar uang, bangun, diagram sederhana | Masuk setelah aset memiliki lisensi dan alt text |
| Berat | peta Adventure, karakter, banyak ilustrasi | P2; jangan menghambat engine dasar |

Semua aset wajib:

- memiliki hak pakai yang jelas;
- dikompresi untuk web;
- mempunyai fallback teks jika membawa makna;
- tidak menjadi satu-satunya penanda benar atau salah;
- tetap terbaca pada layar kecil dan mode kontras tinggi.

## 22. Migrasi Game yang Sudah Ada

Game yang sudah tersedia harus melalui langkah berikut:

1. Catat ID, route, mekanik, target kelas, data tersimpan, dan pengguna aktif.
2. Petakan mekaniknya ke engine bersama.
3. Tentukan fitur yang wajib dipertahankan.
4. Buat versi baru di balik feature flag atau route uji.
5. Bandingkan hasil, performa, dan kenyamanan pada ponsel.
6. Migrasikan hanya setelah data lama dan progres aman.
7. Hapus kode lama pada pekerjaan terpisah setelah periode pengamatan.

Keputusan awal:

| Game lama | Arah yang disarankan |
| --- | --- |
| Toko Matematika | Dipertahankan; audit dan migrasikan ke Engine Quiz secara bertahap |
| Endless Berhitung | Dipertahankan sebagai konsep; refactor menuju `generated_drill` dan standar mode baru |

Nama aktual, route, dan status implementasi wajib diverifikasi dari repository sebelum pekerjaan migrasi. Dokumen ini tidak menggantikan audit kode.

## 23. Scoring Kandidat Implementasi

Setiap ide diberi nilai 1–5 pada kriteria berikut:

| Kriteria | Bobot |
| --- | ---: |
| Dampak pembelajaran | 30% |
| Kesesuaian dengan target murid | 20% |
| Penggunaan ulang engine dan konten | 15% |
| Kemudahan validasi jawaban | 15% |
| Biaya implementasi | 10% |
| Potensi penggunaan berulang | 10% |

Rumus:

```text
priorityScore =
  learningImpact × 0.30 +
  audienceFit × 0.20 +
  reuse × 0.15 +
  answerVerifiability × 0.15 +
  implementationEase × 0.10 +
  replayValue × 0.10
```

Skor membantu pengurutan, tetapi tidak menggantikan dependensi roadmap. Adventure dengan skor tinggi tetap tidak dibangun sebelum engine anak stabil.

## 24. Definition of Ready

Sebuah game siap masuk implementasi jika:

1. tujuan belajar dinyatakan dalam satu kalimat yang dapat diuji;
2. kelas, fase, dan prasyarat jelas;
3. engine dan mode sudah tersedia atau masuk sprint yang sama secara sah;
4. minimal satu paket konten telah lolos kurasi;
5. format jawaban dan evaluator tidak ambigu;
6. alur layar utama sudah ditentukan;
7. kebutuhan aset dan lisensinya jelas;
8. risiko aksesibilitas dan layar kecil telah dipertimbangkan;
9. data hasil, event analitik, dan kebijakan XP sudah dipetakan;
10. acceptance criteria dapat diuji tanpa bergantung pada opini visual saja.

## 25. Definition of Done

Sebuah game dianggap selesai jika:

1. seluruh kriteria pada `01-Roadmap.md` terpenuhi;
2. konten terbit berversi dan tidak memiliki jawaban salah yang diketahui;
3. filter kelas dan akses diuji;
4. mode, skor, XP, hasil, dan checkpoint sesuai kontrak;
5. sesi tidak dapat memberi hadiah dua kali;
6. loading, empty, error, offline, pause, keluar, dan pemulihan tersedia;
7. dapat diselesaikan dengan sentuhan dan alternatif input yang diwajibkan engine;
8. lulus pengujian ponsel Android kecil dan desktop;
9. analitik minimum terkirim tanpa data pribadi atau jawaban mentah;
10. dokumentasi, katalog, dan status game diperbarui.

## 26. Ide yang Ditunda

Ide berikut tidak masuk portofolio awal:

| Ide | Alasan ditunda |
| --- | --- |
| Multiplayer real-time | Sinkronisasi, moderasi, dan biaya terlalu besar untuk manfaat awal |
| Papan peringkat publik | Risiko privasi dan perbandingan sosial murid |
| Game berbasis AI generatif langsung | Jawaban, biaya, dan reproduksibilitas belum cukup terkendali |
| RPG dengan inventori dan ekonomi virtual | Mengalihkan fokus dari latihan dan memperbesar sistem hadiah |
| Simulasi geometri 3D | Kompleksitas grafis dan perangkat tidak sebanding dengan target MVP |
| Input aljabar bebas lengkap | Memerlukan parser dan evaluator simbolik yang belum menjadi prioritas |
| Konten SMA | Menunggu permintaan nyata dan kesiapan input matematika kompleks |

## 27. Risiko Katalog

| Risiko | Pengendalian |
| --- | --- |
| Terlalu banyak kartu game serupa | Gabungkan sebagai paket materi atau mode di dalam satu game |
| Nama menarik tetapi tujuan kabur | Wajibkan learning goal dan acceptance criteria |
| Game SD tampil pada kelas yang salah | Filter menggunakan metadata kelas sebelum render |
| Konten sedikit tetapi diberi mode Endless | Wajibkan generator atau jumlah konten minimum dan anti-pengulangan |
| Tema visual memperlambat rilis | Gunakan sistem visual bersama sebelum aset khusus |
| Game lama rusak saat migrasi | Gunakan audit, feature flag, dan periode kesetaraan |
| Adventure dibangun terlalu dini | Patuhi gerbang dependensi engine anak |
| Katalog menjadi daftar mati | Review status dan data penggunaan secara berkala |

## 28. Review Katalog

Review dilakukan setelah tersedia cukup data penggunaan atau ketika ada perubahan kurikulum, layanan, dan kebutuhan murid. Review tidak harus mengikuti jadwal yang memaksa sebelum jumlah pengguna memadai.

Pertanyaan review:

- Game mana yang benar-benar dimainkan sampai selesai?
- Materi mana yang paling banyak dibutuhkan murid?
- Apakah game memberi variasi belajar atau hanya mengganti tema?
- Apakah ada paket konten yang dapat dipakai oleh engine lain?
- Apakah tingkat kesulitan sesuai kelas?
- Apakah game membantu latihan atau justru menambah beban interaksi?
- Game mana yang sebaiknya diperbaiki, digabungkan, dijeda, atau dihentikan?

## 29. Urutan Implementasi yang Disarankan

1. Audit Toko Matematika dan Endless Berhitung yang sudah ada.
2. Implementasikan runtime dan primitive Quiz bersama, lalu validasi kontraknya melalui **Hitung Cepat**.
3. Buat paket SMP melalui **Misi Bilangan Bulat**.
4. Migrasikan **Toko Matematika** tanpa menghapus versi lama lebih dahulu.
5. Validasi penggunaan, hasil, checkpoint, dan pengalaman ponsel.
6. Bangun **Pasangan Hitung Cepat** sebagai Matching pertama.
7. Bangun **Kelompok Ganjil–Genap** sebagai Drag & Drop pertama.
8. Tambahkan 3–5 paket materi yang memakai komponen dan bank konten bersama.
9. Aktifkan sistem progres, XP, achievement, dan analitik sesuai tahap roadmap.
10. Bangun **Urutkan Bilangan** sebagai Puzzle pertama.
11. Bangun **Ekspedisi Pulau Bilangan** linear sebagai Adventure pertama.
12. Berhenti pada 10–15 game matang, evaluasi data, lalu tentukan ekspansi berikutnya.

## 30. Keputusan yang Ditetapkan

1. Katalog berfokus pada SD–SMP.
2. Target awal adalah 10–15 game matang.
3. Game lama dipertahankan sampai migrasi tervalidasi.
4. Toko Matematika diarahkan ke Engine Quiz.
5. Endless Berhitung diarahkan ke `generated_drill` dengan mode bersama.
6. Hitung Cepat menjadi game baru pertama; fondasi runtime dan primitive Quiz tetap dibangun lebih dahulu.
7. Misi Bilangan Bulat menjadi paket percontohan SMP.
8. Matching pertama adalah Pasangan Hitung Cepat.
9. Drag & Drop pertama adalah Kelompok Ganjil–Genap.
10. Puzzle pertama adalah Urutkan Bilangan.
11. Adventure pertama adalah Ekspedisi Pulau Bilangan versi linear.
12. Variasi materi tidak otomatis dibuat sebagai game baru.
13. Mode waktu hanya dipakai ketika kelancaran merupakan tujuan belajar.
14. Multiplayer, leaderboard publik, ekonomi virtual, dan SMA ditunda.

## 31. Langkah Berikutnya

Pemeriksaan silang seluruh dokumen telah selesai dan kontrak kanonis dirangkum dalam `README.md`. Langkah berikutnya adalah audit kode game lama, implementasi runtime bersama dan primitive Quiz, lalu pembuatan **Hitung Cepat** sebagai game baru pertama berbasis `generated_drill`.
