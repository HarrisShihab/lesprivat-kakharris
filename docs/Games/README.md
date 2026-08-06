# Dokumentasi Sistem Game

**Proyek:** Website Les Privat Kak Harris  
**Status:** rancangan teknis selesai; implementasi kode belum dimulai  
**Pemeriksaan silang terakhir:** 6 Agustus 2026

## 1. Tujuan

Folder ini menjadi acuan pengembangan seluruh game matematika pada website Les Privat Kak Harris. Dokumentasi memisahkan engine, mode, konten, UI, penyimpanan data, progres, dan analitik agar game baru dapat ditambahkan tanpa menyalin ulang sistem yang sama.

Rilis awal berfokus pada **SD–SMP**. Struktur data tetap dapat menerima kelas 10–12, tetapi konten dan fitur input matematika SMA belum menjadi target.

## 2. Status Dokumentasi

Seluruh dokumen rancangan utama sudah selesai dan telah diperiksa silang. Pemeriksaan mencakup:

- ID engine dan nama mode;
- unit progres tiap engine;
- kontrak hasil sesi dan `finishReason`;
- checkpoint, idempotensi, XP, dan achievement;
- nama event analitik;
- batas MVP dan urutan implementasi;
- fokus SD–SMP serta kesiapan ekspansi SMA.

Status **selesai** pada tabel di bawah berarti rancangan siap menjadi acuan implementasi, bukan berarti fiturnya sudah tersedia di website.

## 3. Kontrak Kanonis

### ID engine

```text
quiz
generated_drill
matching
drag_drop
puzzle
adventure
```

Nama file `04-Engine-Endless.md` dipertahankan agar urutan dokumentasi tidak berubah, tetapi ID teknis engine tersebut adalah `generated_drill`. Kata `endless` hanya dipakai sebagai nama mode.

### Mode permainan

```text
endless
limited_questions
limited_time
limited_lives
```

`limited_lives` disiapkan dalam kontrak, tetapi bukan prioritas MVP dasar. Adventure tidak memakai mode parent tersebut; parent Adventure memakai lifecycle `ending_driven`, sedangkan aktivitas anak memakai mode resmi sesuai engine masing-masing.

### Alasan sesi selesai

```text
question_limit_reached
time_expired
lives_depleted
target_reached
ending_reached
manual_finish
safety_limit_reached
no_content
incompatible_version
unrecoverable_error
abandoned
```

### Bentuk hasil

Kontrak runtime mengikuti `14-Mode-Permainan.md`. Data permanen mengikuti projection pada `11-Database.md`:

| Runtime | Penyimpanan Firestore |
| --- | --- |
| `mode.type` | `modeType` |
| `answeredCount` | `attemptedCount` |
| `engineSummary` | `engineSummary` |
| `activeDurationSeconds` | `activeDurationSeconds` |

Result Service melakukan mapping tersebut. Engine tidak menulis hasil, XP, atau achievement langsung ke Firestore.

## 4. Indeks Dokumen

### Fondasi

| Dokumen | Isi | Status |
| --- | --- | --- |
| [`01-Roadmap.md`](01-Roadmap.md) | fase, prioritas, batas MVP, dan gerbang rilis | Selesai |
| [`02-Arsitektur-Game.md`](02-Arsitektur-Game.md) | komponen, kontrak runtime, alur sesi, dan struktur kode | Selesai |
| [`14-Mode-Permainan.md`](14-Mode-Permainan.md) | mode, kondisi selesai, timer, pause, dan hasil runtime | Selesai |

### Engine

| Dokumen | ID teknis | Peran | Status |
| --- | --- | --- | --- |
| [`03-Engine-Quiz.md`](03-Engine-Quiz.md) | `quiz` | pilihan tunggal, benar–salah, dan input angka | Selesai |
| [`04-Engine-Endless.md`](04-Engine-Endless.md) | `generated_drill` | latihan dari generator deterministik | Selesai |
| [`05-Engine-Matching.md`](05-Engine-Matching.md) | `matching` | mencocokkan pasangan dua sisi | Selesai |
| [`06-Engine-DragDrop.md`](06-Engine-DragDrop.md) | `drag_drop` | klasifikasi dan pelabelan item–target | Selesai |
| [`07-Engine-Puzzle.md`](07-Engine-Puzzle.md) | `puzzle` | transformasi state papan dan penyusunan urutan | Selesai |
| [`08-Engine-Adventure.md`](08-Engine-Adventure.md) | `adventure` | orkestrasi perjalanan dan engine anak | Selesai |

### Sistem Pendukung

| Dokumen | Isi | Status |
| --- | --- | --- |
| [`09-Bank-Soal.md`](09-Bank-Soal.md) | konten lintas engine, versi, kurasi, dan projection | Selesai |
| [`10-UI-UX.md`](10-UI-UX.md) | mobile-first, komponen bersama, feedback, dan aksesibilitas | Selesai |
| [`11-Database.md`](11-Database.md) | Firestore, checkpoint, hasil, rules, indeks, dan migrasi | Selesai |
| [`12-Achievement.md`](12-Achievement.md) | definisi, progres, unlock, dan anti-duplikasi | Selesai |
| [`13-Level-XP.md`](13-Level-XP.md) | rumus XP, kurva level, ledger, cap, dan anti-farming | Selesai |
| [`15-Analitik.md`](15-Analitik.md) | event, metrik, dashboard, retensi, dan privasi | Selesai |
| [`99-Ide-Game.md`](99-Ide-Game.md) | portofolio awal, prioritas, dan urutan produk | Selesai |

## 5. Urutan Implementasi

1. Audit kode **Toko Matematika** dan **Endless Berhitung** yang sudah ada.
2. Buat kontrak bersama, Engine Registry, Session Manager, Mode Controller, Result Service, serta primitive input dan evaluasi dari Engine Quiz.
3. Bangun **Hitung Cepat** sebagai game baru pertama memakai `generated_drill`.
4. Tambahkan **Misi Bilangan Bulat** sebagai paket percontohan SMP.
5. Migrasikan **Toko Matematika** ke Engine Quiz tanpa menghapus versi lama sebelum kesetaraan fitur dan data terbukti aman.
6. Uji alur penuh di Android layar kecil dan desktop, termasuk recovery serta pencegahan hasil ganda.
7. Bangun Matching dan Drag & Drop pertama.
8. Aktifkan progres, XP, achievement, dan analitik setelah finalisasi hasil tepercaya tersedia.
9. Bangun Puzzle, lalu Adventure linear.
10. Berhenti pada 10–15 game matang, evaluasi data penggunaan, kemudian tentukan ekspansi.

## 6. Prioritas Produk Awal

| Urutan | Game | Engine | Target |
| ---: | --- | --- | --- |
| 1 | Hitung Cepat | `generated_drill` | SD kelas 2–6 |
| 2 | Misi Bilangan Bulat | `generated_drill` | SMP kelas 7 |
| 3 | Toko Matematika | `quiz` | SD kelas 3–6 |
| 4 | Pasangan Hitung Cepat | `matching` | SD kelas 1–4 |
| 5 | Kelompok Ganjil–Genap | `drag_drop` | SD kelas 2–4 |

Toko Matematika tetap dipertahankan selama proses migrasi. Variasi kelas atau materi dibuat sebagai paket konten, bukan otomatis menjadi kartu game baru.

## 7. Urutan Otoritas Dokumen

Jika implementasi menemukan perbedaan penafsiran, gunakan dokumen berikut sebagai sumber utama:

| Topik | Dokumen otoritatif |
| --- | --- |
| komponen dan kontrak runtime | `02-Arsitektur-Game.md` |
| mode dan `finishReason` | `14-Mode-Permainan.md` |
| perilaku khusus engine | dokumen engine `03`–`08` |
| konten, versi, dan evaluasi | `09-Bank-Soal.md` |
| tampilan dan aksesibilitas | `10-UI-UX.md` |
| bentuk data permanen dan keamanan | `11-Database.md` |
| achievement | `12-Achievement.md` |
| XP dan level | `13-Level-XP.md` |
| event dan metrik | `15-Analitik.md` |
| urutan produk | `99-Ide-Game.md` |

Perubahan kontrak setelah implementasi dimulai harus menaikkan versi yang relevan dan memperbarui semua dokumen terdampak dalam perubahan yang sama.

## 8. Batas yang Belum Dikerjakan

- konten SMA;
- multiplayer dan leaderboard publik;
- ekonomi virtual atau energi harian;
- editor visual bank soal;
- Adventure bercabang kompleks;
- input simbol matematika tingkat lanjut;
- XP dari achievement pada MVP awal.
