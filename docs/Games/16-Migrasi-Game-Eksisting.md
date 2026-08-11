# Dokumentasi Migrasi 5 Game Eksisting ke Shared Game Engine

**Proyek:** Website Les Privat Kak Harris  
**Lokasi:** `docs/Games/16-Migrasi-Game-Eksisting.md`  
**Status:** Selesai Terintegrasi  
**Tanggal:** 11 Agustus 2026  

## 1. Ringkasan Migrasi

Seluruh 5 game matematika eksisting yang tersedia di repository telah berhasil diintegrasikan ke modul **Shared Game Engine** (`game-engine.js`). Integrasi ini menyatukan alur autentikasi murid, manajemen sesi permainan, sistem poin & streak, pengolahan timer, serta penyimpanan statistik lokal (`kakHarrisGameStats`) tanpa mengubah antarmuka visual maupun merusak data statistik pengguna yang sudah tersimpan.

## 2. Modul Inti: `game-engine.js`

Engine bersama ini terekspos dalam nama global `window.KakHarrisGameEngine` dan menyediakan API utama sebagai berikut:

- `initStudentAuth(allowedRoles)`: Melakukan otentikasi role murid (`firebasePortal.guard`), mengekstrak profil akun murid, dan membentuk `storageKey` lokal (`kakHarrisGameStats:<studentId>`).
- `loadStats(storageKey)`: Membaca data statistik dari `localStorage` dengan aman.
- `saveGameResult(storageKey, perGameKey, result)`: Memperbarui rekor tertinggi (`bestScore`), streak terbaik (`bestStreak`), total soal terjawab (`totalAnswered`), dan jumlah permainan (`gamesPlayed`) baik secara global maupun per-game.
- `calculatePoints(level, basePointsMap, streak)`: Menghitung skor adaptif beserta bonus streak.
- `createTimer(durationSeconds, onTick, onEnd)`: Pengelola interval timer permainan.

## 3. Peta Integrasi 5 Game

| File Game | Engine Key | Peran / Deskripsi |
| --- | --- | --- |
| `hitung-tanpa-batas.js` | `hitungTanpaBatas` | Generated Drill aritmetika acak dengan pilihan tingkat kesulitan & mode. |
| `toko-matematika.js` | `tokoMatematika` | Quiz kontekstual transaksi belanja, total harga, jumlah barang, dan kembalian. |
| `detektif-pola-bilangan.js` | `detektifPola` | Kuis deret dan pola bilangan adaptif sesuai jenjang SD/SMP. |
| `menara-aljabar.js` | `menaraAljabar` | Pendakian menara kuis aljabar khusus murid SMP. |
| `petualangan-pecahan.js` | `petualanganPecahan` | Kuis eksplorasi visual pecahan & pecahan senilai khusus murid SD. |

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
- Seluruh 5 berkas HTML (`hitung-tanpa-batas.html`, `toko-matematika.html`, `detektif-pola-bilangan.html`, `menara-aljabar.html`, `petualangan-pecahan.html`) telah memuat skrip `game-engine.js` sebelum berkas JS game spesifik.
