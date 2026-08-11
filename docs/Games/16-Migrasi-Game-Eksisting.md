# Dokumentasi Migrasi 5 Game Eksisting ke Shared Game Engine

**Proyek:** Website Les Privat Kak Harris  
**Lokasi:** `docs/Games/16-Migrasi-Game-Eksisting.md`  
**Status:** Selesai Terintegrasi + Vertical Slice Engine Quiz  
**Tanggal:** 11 Agustus 2026

## 1. Ringkasan Migrasi

Seluruh 5 game matematika eksisting yang tersedia di repository telah berhasil diintegrasikan ke modul **Shared Game Engine** (`game-engine.js`). Integrasi ini menyatukan alur autentikasi murid, manajemen sesi permainan, sistem poin & streak, pengolahan timer, serta penyimpanan statistik lokal (`kakHarrisGameStats`) tanpa mengubah antarmuka visual maupun merusak data statistik pengguna yang sudah tersimpan.

Sebagai langkah lanjutan (vertical slice), tahap **Engine Quiz** diterapkan pada **seluruh 5 game**. Logika loop soal dipindahkan ke modul engine quiz yang dapat digunakan ulang, sementara konten/soal dipisah ke berkas konfigurasi tersendiri (prinsip "konten terpisah dari mekanik").

## 2. Modul Inti: `game-engine.js`

Engine bersama ini terekspos dalam nama global `window.KakHarrisGameEngine` dan menyediakan API utama sebagai berikut:

- `initStudentAuth(allowedRoles)`: Melakukan otentikasi role murid (`firebasePortal.guard`), mengekstrak profil akun murid, dan membentuk `storageKey` lokal (`kakHarrisGameStats:<studentId>`).
- `loadStats(storageKey)`: Membaca data statistik dari `localStorage` dengan aman.
- `saveGameResult(storageKey, perGameKey, result)`: Memperbarui rekor tertinggi (`bestScore`), streak terbaik (`bestStreak`), total soal terjawab (`totalAnswered`), dan jumlah permainan (`gamesPlayed`) baik secara global maupun per-game.
- `calculatePoints(level, basePointsMap, streak)`: Menghitung skor adaptif beserta bonus streak.
- `createTimer(durationSeconds, onTick, onEnd)`: Pengelola interval timer permainan.
- `createQuizGame(config)`: Membuat sesi kuis interaktif yang menangani loop soal, umpan balik langsung, skor & streak, mode terbatas/endless, serta pemanggilan `onFinish` saat sesi selesai. Opsi lanjutan (semua opsional & backward compatible): `lives` (sistem nyawa), `hintCost` + `getHint` + `onHint` (petunjuk), `pointsFor` (override rumus poin), `onAnswer` (state tambahan khas game), dukungan **jawaban teks/pilihan ganda**, serta **Difficulty Controller adaptif** (`adaptiveDifficulty`, `allowedDifficulties`, `difficultyWindow`, ambang naik/turun, `onDifficultyChange`).

## 2.1. Vertical Slice: Engine Quiz pada Hitung Tanpa Batas

Engine quiz mengikuti kontrak di `docs/Games/03-Engine-Quiz.md` dan `14-Mode-Permainan.md` secara pragmatis:

- `createQuizGame(config)` menerima `bank`, `basePoints`, `questionLimit`, `feedbackDurationMs`, `isEndless`, serta hook `onQuestion`/`onFeedback`/`onScoreboard`/`onFinish`.
- Bank soal dipisah ke `hitung-tanpa-batas-config.js` sebagai _Question Provider_ berbentuk fungsi generator (`window.HitungTanpaBatasConfig`). Game hanya memuat konfigurasi ini sebelum skrip game.
- Mode terbatas (10 soal) berhenti otomatis saat limit tercapai; mode endless hanya berhenti saat `finish()` dipanggil (mis. tombol "Akhiri Permainan").
- Umpan balik langsung, bonus streak, dan ringkasan hasil dipertahankan identik dengan perilaku lama.
- `saveGameResult` kini ikut menyimpan preferensi pengaturan (`lastOperation`, `lastLevel`, `lastMode`) ke statistik per-game, sehingga pengaturan terakhir dapat dipulihkan pada sesi berikutnya. Data statistik inti tetap kompatibel.

## 2.2. Vertical Slice Lanjutan: Toko Matematika & Detektif Pola

Setelah `Hitung Tanpa Batas` tervalidasi, engine quiz diperluas agar cukup fleksibel untuk dua game berikut tanpa merusak perilaku yang sudah ada:

- **Engine diperluas (opsional)** untuk mendukung mekanik khusus:
  - `lives` — sistem nyawa; salah/skip menguranginya dan habis membuat sesi berakhir (hanya dipakai Detektif mode terbatas).
  - `getHint` / `onHint` / `useHint()` / `hintCost` — petunjuk yang mengurangi skor (Detektif).
  - `pointsFor({level, streak})` — override rumus poin (Detektif memakai `10 + min(streak-1,5)*2`; Toko memakai `basePoints` 20/35/50).
  - `onAnswer(outcome)` — hook untuk state khas game (Toko menambah koin & pelanggan dilayani; Detektif menampilkan umpan balik).
- **Bank soal dipisah**: `toko-matematika-config.js` (`window.TokoMatematikaConfig`) dan `detektif-pola-config.js` (`window.DetektifPolaConfig`). Tiap game memuat config-nya sebelum skrip game.
- **Mekanik yang dipertahankan identik:**
  - Toko: produk, register/cashier, koin, reputasi, reaksi pelanggan, dan format jawaban Rp/barang.
  - Detektif: deret pola angka, sistem nyawa (mode terbatas), tombol petunjuk, dan pemilihan pola sesuai jenjang SD/SMP.

## 2.3. Vertical Slice Lanjutan: Menara Aljabar & Petualangan Pecahan

Dua game terakhir selesai dimigrasikan, menuntaskan seluruh 5 game:

- **Menara Aljabar** — pola serupa Detektif (nyawa + petunjuk), dengan tambahan:
  - Progres per lantai dan pertarungan **Penjaga Menara** tiap lantai kelipatan 10 (`boss`).
  - `pointsFor` menerima `number` (nomor lantai) agar bonus boss dapat dihitung dari engine.
  - Khusus murid SMP (`isSmpStudent`).
- **Petualangan Pecahan** — satu-satunya game **pilihan ganda**: jawaban disimpan sebagai teks (pecahan `1/2` atau tanda `<`/`>`).
  - `submitAnswer(choice)` kini mengevaluasi jawaban non-numerik secara string (otomatis terdeteksi dari sifat `question.answer`).
  - Lives, petunjuk, poin custom, dan render visual pecahan tetap dipertahankan.
  - Khusus murid SD (`isSdStudent`).
- **Pengaman rekursi**: `nextItem` diberi batas usaha (200×) agar bank yang memiliki variasi terbatas tidak menyebabkan rekursi tak hingga.
- **Bank soal dipisah**: `menara-aljabar-config.js` (`window.MenaraAljabarConfig`) dan `petualangan-pecahan-config.js` (`window.PetualanganPecahanConfig`).

## 2.4. Kenaikan Kesulitan Adaptif (Difficulty Controller)

Sesuai `14-Mode-Permainan.md` §6.3, engine quiz kini menyediakan **Difficulty Controller** yang berjalan secara opsional (default mati):

- `adaptiveDifficulty` — aktifkan adaptasi tingkat kesulitan.
- `allowedDifficulties` — daftar level yang diizinkan (default diambil dari kunci `basePoints`).
- `difficultyWindow` — jumlah jawaban untuk jendela akurasi (default 5).
- `difficultyUpThreshold` / `difficultyDownThreshold` — akurasi untuk naik/turun (default 0.8 / 0.5).
- `onDifficultyChange(level, accuracy)` — hook untuk memberi tahu game saat level berubah.

Aturan yang diterapkan sesuai kontrak: naik maksimal satu tingkat setelah jendela penuh dengan akurasi ≥ 0.8, turun saat akurasi < 0.5, dan tidak melampaui `allowedDifficulties`. Level adaptif dikirim ke bank (Question Provider) melalui `ctx.level`, sehingga soal mengikuti kesulitan terkini. Skor memakai level soal sesungguhnya (`state.question.difficulty`).

Fitur ini diaktifkan pada **mode Endless** di dua game yang berbasis pilihan level manual: **Hitung Tanpa Batas** dan **Toko Matematika**. Game berbasis jenjang/progres (Detektif, Menara, Petualangan) tidak mengaktifkan adaptif karena kesulitannya sudah diatur jenjang/lantai/misi.

## 3. Peta Integrasi 5 Game

| File Game                   | Engine Key           | Peran / Deskripsi                                                              |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `hitung-tanpa-batas.js`     | `hitungTanpaBatas`   | Generated Drill aritmetika acak dengan pilihan tingkat kesulitan & mode.       |
| `toko-matematika.js`        | `tokoMatematika`     | Quiz kontekstual transaksi belanja, total harga, jumlah barang, dan kembalian. |
| `detektif-pola-bilangan.js` | `detektifPola`       | Kuis deret dan pola bilangan adaptif sesuai jenjang SD/SMP.                    |
| `menara-aljabar.js`         | `menaraAljabar`      | Pendakian menara kuis aljabar khusus murid SMP.                                |
| `petualangan-pecahan.js`    | `petualanganPecahan` | Kuis eksplorasi visual pecahan & pecahan senilai khusus murid SD.              |

## 4. Jaminan Kompatibilitas Data (`Backward Compatibility`)

Format penyimpanan pada `localStorage` dijamin tetap identik dengan skema awal:

```json
{
  "bestScore": 150,
  "bestStreak": 5,
  "totalAnswered": 42,
  "gamesPlayed": 6,
  "perGame": {
    "tokoMatematika": { "bestScore": 150, "bestStreak": 5, "gamesPlayed": 3, "totalAnswered": 30 },
    "hitungTanpaBatas": { "bestScore": 100, "bestStreak": 4, "gamesPlayed": 3, "totalAnswered": 12 }
  }
}
```

## 5. Pengujian & Validasi

- Sintaks seluruh file JS (`game-engine.js` dan 5 file JS game) tervalidasi bersih melalui `node --check`.
- Kelima berkas HTML (`hitung-tanpa-batas.html`, `toko-matematika.html`, `detektif-pola-bilangan.html`, `menara-aljabar.html`, `petualangan-pecahan.html`) kini memuat `game-engine.js` lalu `*-config.js` sebelum skrip game masing-masing.
- Terdapat pengujian otomatis pada `test-quiz-engine.js` (dijalankan dengan `node test-quiz-engine.js`) yang memverifikasi alur soal, scoring & bonus streak, mode endless tanpa auto-finish, skip, reset streak karena jawaban salah, sistem nyawa (berakhir saat habis & nonaktif di endless), pengurangan skor oleh petunjuk, override rumus poin, jawaban teks/pilihan ganda, penanda lantai boss pada Menara, validitas pilihan pada Petualangan, idempotensi `finish` (tidak ada progres ganda), konsistensi ringkasan, soal tidak berulang cepat di endless, dan filter jenjang SD/SMP.

## 5.1. Validasi MVP (Tahap 2 roadmap)

Hasil validasi yang dapat diverifikasi secara otomatis dan interaktif:

| Kriteria MVP                            | Status      | Keterangan                                                                                                                      |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Desktop                                 | ✅          | Semua halaman game dimuat tanpa error; engine quiz dapat dimainkan (verifikasi Petualangan Pecahan berjalan dari misi ke misi). |
| Akun SD tidak melihat konten SMP        | ✅          | Menara Aljabar menolak akses murid SD dengan pesan khusus & tombol dinonaktifkan; Petualangan Pecahan (SD) berjalan normal.     |
| Soal tidak berulang cepat di Endless    | ✅          | Test `endless-no-rapid-repeat` (11/11 soal unik).                                                                               |
| Sesi terputus tidak progres ganda       | ✅          | `finish()` idempoten; test `finish-is-idempotent` (panggilan ganda hanya menyimpan sekali).                                     |
| Jawaban angka tanpa keyboard tak sesuai | ✅ (teknis) | Keempat game input-angka memakai `inputmode="none"` + `readonly` + keypad on-screen.                                            |
| Ringkasan hasil konsisten               | ✅          | Test `summary-consistent` (correct + wrong = answered; skor cocok) + verifikasi interaktif skor/streak bernilai benar.          |
| Ponsel Android berlayar kecil           | ⏳ manual   | Perlu uji perangkat fisik; layout memakai `games.css` mobile-first.                                                             |

## 6. Langkah Lanjutan

- Menyempurnakan kontrak mode `limited_time` (berbasis waktu, sesuai `14-Mode-Permainan.md`) sebagai mode resmi berikutnya.
- Menyempurnakan kontrak `03-Engine-Quiz.md` (mis. Answer Evaluator, Session Manager terpisah) saat arsitektur modular penuh dibutuhkan.
- Melakukan uji manual ponsel Android berlayar kecil terhadap kelima game (satu-satunya kriteria MVP yang belum tervalidasi otomatis).
