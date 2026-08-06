# Engine Puzzle

**Proyek:** Website Les Privat Kak Harris  
**Lokasi tujuan:** `docs/Games/07-Engine-Puzzle.md`  
**Status:** Rancangan awal  
**Fokus rilis:** Matematika SD–SMP

## 1. Tujuan

Engine Puzzle adalah mesin permainan untuk menyelesaikan tantangan melalui serangkaian perubahan keadaan papan. Murid tidak hanya memilih jawaban atau memindahkan satu item ke kategori, tetapi menyusun, menukar, atau menggeser bagian sampai seluruh papan memenuhi kondisi solusi.

Engine dirancang untuk:

- menyusun bilangan, bentuk, atau langkah ke urutan yang benar;
- menata kepingan pada slot atau sel yang saling berkaitan;
- menjalankan puzzle pola dan logika dengan keadaan yang dapat diperiksa;
- membedakan langkah sah, langkah tidak sah, dan solusi akhir;
- menyediakan undo, reset, dan petunjuk tanpa merusak integritas skor;
- memulihkan keadaan puzzle yang sama setelah refresh;
- mendukung sentuhan, mouse, dan keyboard;
- memakai Session Manager, Mode Controller, Scoring Service, Result Service, serta analitik bersama.

Engine ini merupakan engine lanjutan berprioritas P2. Implementasinya dilakukan setelah Engine Quiz, Matching, dan Drag & Drop stabil.

## 2. Ciri Utama Puzzle

Sebuah tantangan termasuk Puzzle jika memiliki ketiga ciri berikut:

1. **Keadaan papan:** posisi atau urutan semua kepingan pada suatu saat dapat direpresentasikan sebagai data.
2. **Aturan perubahan:** tidak setiap perpindahan selalu diizinkan; aksi sah bergantung pada keadaan papan.
3. **Kondisi solusi:** keberhasilan ditentukan dari keadaan papan secara keseluruhan, bukan hanya satu pasangan item–target.

Contoh sederhana:

```text
Keadaan awal : [12, 3, 8, 5]
Aksi         : pindahkan 3 ke posisi pertama
Keadaan baru : [3, 12, 8, 5]
Solusi       : [3, 5, 8, 12]
```

Animasi dan koordinat layar bukan keadaan permainan. State domain harus tetap dapat diperiksa tanpa merender UI.

## 3. Batas antara Puzzle dan Engine Lain

| Kebutuhan | Engine yang digunakan |
| --- | --- |
| Memilih satu jawaban benar | Quiz |
| Memasangkan item kiri dan kanan | Matching |
| Memindahkan item ke kategori atau label target | Drag & Drop |
| Menyusun urutan yang saling berkaitan | Puzzle |
| Menata kepingan melalui beberapa langkah | Puzzle |
| Menggabungkan misi, peta, dialog, dan beberapa mekanik | Adventure |

Perbedaan terpenting dengan Drag & Drop:

- Drag & Drop menilai pasangan `itemId`–`targetId` secara langsung.
- Puzzle menilai keadaan papan setelah satu atau beberapa langkah.
- Pada Drag & Drop, item yang benar biasanya langsung dikunci.
- Pada Puzzle, kepingan yang tampak berada di posisi benar belum tentu dikunci karena langkah berikutnya dapat mengubah papan.

Gerakan seret boleh digunakan sebagai cara input Puzzle, tetapi keberadaan gesture seret tidak otomatis menjadikan mekaniknya Drag & Drop.

## 4. Batas Tanggung Jawab

### Engine menangani

- pembuatan instance puzzle dari definisi dan seed;
- state papan, kepingan, slot, sel, dan posisi kosong;
- pemeriksaan apakah suatu aksi legal;
- penerapan aksi menjadi keadaan baru;
- undo dan reset sesuai konfigurasi;
- pemeriksaan kondisi selesai;
- penghitungan langkah dan efisiensi;
- penguncian input saat transisi atau penyelesaian;
- pemuatan puzzle berikutnya;
- ringkasan khusus Puzzle.

### Engine tidak menangani

- autentikasi dan hak akses murid;
- filter katalog berdasarkan jenjang;
- penulisan langsung ke Firestore;
- pemberian XP atau achievement permanen;
- rumus skor global;
- penentuan akhir sesi lintas mode;
- kurasi kebenaran materi;
- pencarian solusi bebas untuk puzzle yang tidak memiliki validator;
- simulasi fisika, tabrakan, atau bentuk bebas;
- navigasi peta dan alur cerita Adventure.

Pembagian ini mengikuti `02-Arsitektur-Game.md` dan `14-Mode-Permainan.md`.

## 5. Target Penggunaan

### Jenjang awal

- SD kelas 1–6.
- SMP kelas 7–9.

### Contoh materi

- mengurutkan bilangan dari kecil ke besar;
- mengurutkan pecahan, desimal, atau persen;
- melanjutkan pola bilangan;
- menyusun langkah operasi hitung;
- menyusun urutan penyelesaian persamaan sederhana;
- menata tahapan konversi satuan;
- menyusun sifat atau unsur bangun secara logis;
- puzzle koordinat pada grid sederhana;
- susunan bilangan berdasarkan beberapa petunjuk.

Struktur data dapat menerima kelas 10–12 pada masa depan. Konten SMA, input simbol kompleks, pembuktian, dan manipulasi grafik belum termasuk target awal.

## 6. Jenis Puzzle Resmi

MVP mendukung dua jenis puzzle:

| `puzzleType` | Mekanik | Contoh |
| --- | --- | --- |
| `ordered_sequence` | Menyusun kepingan pada urutan yang benar | Urutkan pecahan dari terkecil |
| `grid_rearrangement` | Memindahkan atau menukar kepingan pada grid tetap | Susun pola bilangan pada kotak |

### `ordered_sequence`

- Papan terdiri dari slot berurutan dan beberapa kepingan.
- Murid dapat memindahkan satu kepingan ke indeks lain atau menukar dua kepingan.
- Solusi dapat berupa satu urutan atau beberapa urutan ekuivalen.
- Urutan dinilai dari ID dan aturan solusi, bukan teks yang terlihat.

### `grid_rearrangement`

- Papan terdiri dari baris dan kolom tetap.
- Gerakan mengikuti `movementRule` yang ditentukan.
- MVP mendukung `swap_any` dan `slide_to_empty`.
- Solusi dapat berupa satu susunan atau sekumpulan state yang memenuhi aturan.

Jenis berikut ditunda sampai setelah MVP:

- jigsaw dengan bentuk kepingan tidak beraturan;
- rotasi kepingan;
- jalur atau maze;
- constraint grid kompleks seperti Sudoku penuh;
- puzzle konstruksi geometri;
- puzzle dengan simulasi fisika.

## 7. Istilah Inti

| Istilah | Arti |
| --- | --- |
| Definisi puzzle | Data konten tetap sebelum diacak |
| Instance puzzle | Tantangan konkret hasil definisi, versi, dan seed |
| State papan | Susunan seluruh kepingan pada saat tertentu |
| Kepingan (`piece`) | Unit yang dapat dipindahkan atau ditukar |
| Posisi (`position`) | Slot atau sel tempat kepingan berada |
| Langkah (`move`) | Aksi legal yang mengubah state papan |
| Aksi tidak valid | Aksi yang tidak boleh mengubah state atau skor |
| Solusi | State yang memenuhi seluruh syarat selesai |
| Efisiensi | Perbandingan jumlah langkah murid dengan acuan wajar |
| Undo | Mengembalikan state ke sebelum langkah terakhir |
| Reset | Mengembalikan puzzle ke state awal instance yang sama |

Memilih kepingan, membatalkan pilihan, atau mencoba target tidak legal bukan langkah. `moveCount` bertambah hanya setelah transformasi state berhasil diterapkan.

## 8. Kontrak Konfigurasi Engine

Properti khusus ditempatkan di dalam `engineConfig`:

```json
{
  "engineConfig": {
    "supportedPuzzleTypes": ["ordered_sequence", "grid_rearrangement"],
    "interactionStyle": "move_or_tap",
    "evaluationMode": "on_submit",
    "allowUndo": true,
    "undoLimit": 20,
    "allowReset": true,
    "allowHint": true,
    "maxHintsPerPuzzle": 2,
    "showMoveCount": true,
    "showCorrectPositionCount": false,
    "lockCorrectPieces": false,
    "shufflePolicy": {
      "minimumDistance": 3,
      "maximumAttempts": 50,
      "preventSolvedStart": true
    },
    "completionFeedbackDurationMs": 900,
    "content": {
      "allowedFormats": ["text", "math", "image"],
      "maxPieces": 12
    }
  }
}
```

### Aturan validasi

- `interactionStyle` MVP hanya menerima `move_or_tap`.
- `evaluationMode` menerima `on_submit` atau `on_complete`.
- `undoLimit` berada pada rentang 0–50.
- `maxHintsPerPuzzle` berada pada rentang 0–3.
- Jumlah kepingan MVP berada pada rentang 3–12.
- `minimumDistance` minimal 1 jika pengacakan diaktifkan.
- `completionFeedbackDurationMs` berada pada rentang 300–3000 milidetik.
- `lockCorrectPieces` bernilai `false` pada konfigurasi umum MVP.
- Semua format konten harus memiliki renderer yang tersedia.
- Jenis puzzle dan aturan geraknya harus didukung engineVersion terpilih.
- Konfigurasi tidak valid ditolak sebelum sesi dibuat.

Nilai `showCorrectPositionCount` tidak aktif secara default karena dapat membocorkan solusi sedikit demi sedikit pada puzzle yang seharusnya menguji penalaran keseluruhan.

## 9. Kontrak Definisi Puzzle

Question Provider memberikan definisi puzzle yang telah dikurasi:

```json
{
  "puzzleId": "urutkan-pecahan-01",
  "puzzleVersion": 1,
  "puzzleType": "ordered_sequence",
  "title": "Urutkan Pecahannya",
  "instruction": "Susun dari nilai terkecil ke terbesar.",
  "pieces": [
    {
      "pieceId": "piece-a",
      "content": { "format": "math", "value": "1/2" },
      "semanticValue": { "type": "rational", "numerator": 1, "denominator": 2 }
    },
    {
      "pieceId": "piece-b",
      "content": { "format": "math", "value": "3/4" },
      "semanticValue": { "type": "rational", "numerator": 3, "denominator": 4 }
    },
    {
      "pieceId": "piece-c",
      "content": { "format": "math", "value": "1/4" },
      "semanticValue": { "type": "rational", "numerator": 1, "denominator": 4 }
    }
  ],
  "board": {
    "rows": 1,
    "columns": 3,
    "movementRule": "move_to_index"
  },
  "solutionSpec": {
    "type": "ordered_piece_ids",
    "acceptedOrders": [["piece-c", "piece-a", "piece-b"]]
  },
  "difficulty": {
    "level": "easy",
    "referenceMoveCount": 2,
    "estimatedSeconds": 45
  },
  "hints": [
    { "hintId": "hint-1", "type": "concept", "text": "Samakan penyebut atau bandingkan nilainya." }
  ],
  "explanation": "1/4 < 1/2 < 3/4.",
  "metadata": {
    "educationLevel": "SD",
    "grades": [5, 6],
    "topicId": "pecahan",
    "subtopicId": "membandingkan-pecahan"
  }
}
```

### Aturan konten

- `puzzleId` stabil dan unik di bank konten.
- `puzzleVersion` naik jika isi, aturan gerak, atau solusi berubah.
- Semua `pieceId` unik di dalam puzzle.
- `solutionSpec` tidak diberikan mentah kepada komponen presentasi.
- `semanticValue` dipakai evaluator dan tidak boleh dianggap sebagai label visual.
- Jumlah posisi harus sesuai dengan kepingan dan aturan posisi kosong.
- Setidaknya satu solusi yang sah harus tersedia atau dapat dibuktikan validator.
- Petunjuk, penjelasan, jenjang, kelas, topik, dan kesulitan divalidasi sebelum publikasi.
- Konten gambar wajib memiliki teks alternatif.
- Puzzle yang ambigu tanpa semua solusi ekuivalen dicatat harus ditolak.

## 10. Pembuatan Instance dan Seed

Definisi puzzle tidak langsung menjadi state awal. Instance dibentuk dengan:

```js
createPuzzleInstance({
  puzzleId,
  puzzleVersion,
  sessionSeed,
  instanceNumber,
  shufflePolicy
})
```

Hasil minimum:

```js
{
  puzzleInstanceId: "urutkan-pecahan-01:v1:s81:i2",
  seed: "s81",
  initialState: ["piece-b", "piece-c", "piece-a"],
  solvable: true,
  initialDistance: 2,
  generatorVersion: 1
}
```

Aturan instance:

- seed dan versi yang sama harus menghasilkan state awal yang sama;
- state awal tidak boleh sudah selesai jika `preventSolvedStart: true`;
- hasil shuffle harus dapat diselesaikan menurut aturan gerak;
- generator mencoba ulang sampai `maximumAttempts`;
- kegagalan membentuk state valid menyebabkan provider meminta puzzle lain;
- refresh memulihkan instance yang sama, bukan melakukan shuffle ulang;
- ID instance tidak memuat kunci jawaban yang dapat dibaca pengguna.

Untuk `slide_to_empty`, validator wajib memeriksa keterjangkauan susunan berdasarkan aturan grid. Pengacakan acak murni yang dapat menghasilkan state mustahil tidak diizinkan.

## 11. Representasi State Papan

State `ordered_sequence`:

```js
{
  type: "ordered_sequence",
  positions: ["piece-b", "piece-c", "piece-a"]
}
```

State `grid_rearrangement`:

```js
{
  type: "grid_rearrangement",
  rows: 2,
  columns: 3,
  cells: [
    "piece-a", "piece-c", null,
    "piece-b", "piece-d", "piece-e"
  ],
  emptyCellIndex: 2
}
```

Aturan state:

- setiap kepingan muncul tepat satu kali, kecuali definisi eksplisit mengizinkan cadangan setelah MVP;
- `null` hanya boleh muncul jika aturan membutuhkan posisi kosong;
- indeks mengikuti urutan baris dari kiri ke kanan;
- state dapat diserialisasi menjadi JSON;
- state tidak menyimpan elemen DOM, koordinat piksel, atau objek gesture;
- setiap state memiliki fingerprint untuk deteksi duplikasi dan pemulihan.

## 12. State Internal Engine

```js
{
  phase: "loading_puzzle",
  puzzleNumber: 1,
  currentPuzzleId: null,
  currentPuzzleVersion: null,
  puzzleInstanceId: null,
  seed: null,
  initialBoardState: null,
  boardState: null,
  selectedPieceId: null,
  selectedPosition: null,
  inputLocked: false,
  moveCount: 0,
  invalidActionCount: 0,
  undoCount: 0,
  resetCount: 0,
  hintsUsedOnPuzzle: 0,
  moveHistory: [],
  puzzleStartedAt: null,
  completionPending: false,
  recentPuzzleIds: [],
  summary: {
    puzzlesCompleted: 0,
    totalMoves: 0,
    totalInvalidActions: 0,
    totalUndos: 0,
    totalResets: 0,
    totalHintsUsed: 0,
    firstTryCompletions: 0
  }
}
```

Nilai `phase` resmi:

- `loading_puzzle`;
- `ready`;
- `piece_selected`;
- `applying_move`;
- `checking_solution`;
- `showing_feedback`;
- `puzzle_complete`;
- `paused`;
- `finished`;
- `error`.

## 13. Alur Permainan

1. Session Manager membuat sesi dan memilih mode.
2. Provider mengambil definisi sesuai game, jenjang, kelas, topik, dan kesulitan.
3. Puzzle Validator memeriksa struktur, solusi, renderer, dan aturan gerak.
4. Instance Factory membentuk state awal deterministik yang dapat diselesaikan.
5. Engine menampilkan papan dalam status `ready`.
6. Murid memilih kepingan atau posisi tujuan.
7. Move Validator memeriksa apakah aksi legal pada state saat itu.
8. Aksi legal diterapkan menjadi state baru dan menambah `moveCount`.
9. Engine memeriksa kondisi solusi sesuai `evaluationMode`.
10. Murid dapat memakai undo, reset, atau hint jika diizinkan.
11. Jika solusi terpenuhi, puzzle dikunci dan feedback selesai ditampilkan.
12. Scoring Service menghitung skor berdasarkan penyelesaian dan efisiensi.
13. Mode Controller memutuskan apakah sesi selesai atau puzzle berikutnya dimuat.
14. Result Service menyimpan hasil final satu kali.

## 14. Aksi yang Diterima

```js
{ type: "SELECT_PIECE", pieceId, inputMethod: "tap" }
{ type: "SELECT_POSITION", position, inputMethod: "tap" }
{ type: "MOVE_PIECE", pieceId, from, to, inputMethod }
{ type: "SWAP_PIECES", firstPosition, secondPosition, inputMethod }
{ type: "SLIDE_PIECE", from, to, inputMethod }
{ type: "CANCEL_SELECTION" }
{ type: "SUBMIT_PUZZLE" }
{ type: "UNDO_MOVE" }
{ type: "RESET_PUZZLE" }
{ type: "REQUEST_HINT" }
{ type: "PAUSE_SESSION" }
{ type: "RESUME_SESSION" }
{ type: "FINISH_SESSION" }
```

### Aturan aksi

- Aksi hanya diproses pada fase yang mengizinkan.
- Satu aksi menghasilkan paling banyak satu transformasi state.
- Memilih dan membatalkan pilihan tidak menambah `moveCount`.
- Tujuan yang sama dengan posisi asal tidak dihitung sebagai langkah.
- Aksi ilegal tidak mengubah state, skor, streak, atau nyawa.
- Aksi duplikat dengan `actionId` yang sama diabaikan.
- Input dikunci singkat saat transformasi state diterapkan.
- `SUBMIT_PUZZLE` hanya tersedia pada mode evaluasi `on_submit`.
- Setelah `puzzle_complete`, aksi perubahan papan ditolak.

## 15. Move Validator dan State Reducer

Kontrak permintaan:

```js
{
  actionId: "action-12",
  puzzleInstanceId: "urutkan-pecahan-01:v1:s81:i2",
  puzzleType: "ordered_sequence",
  movementRule: "move_to_index",
  currentStateFingerprint: "state-fp-03",
  action: {
    type: "MOVE_PIECE",
    pieceId: "piece-c",
    from: 1,
    to: 0
  }
}
```

Hasil validasi:

```js
{
  actionId: "action-12",
  valid: true,
  reasonCode: "legal_move",
  normalizedAction: {
    type: "MOVE_PIECE",
    pieceId: "piece-c",
    from: 1,
    to: 0
  }
}
```

State Reducer menerima state dan `normalizedAction`, lalu menghasilkan state baru tanpa efek samping.

```js
nextState = reducePuzzleState(currentState, normalizedAction)
```

Aturan utama:

- Move Validator tidak mengubah state.
- State Reducer tidak membaca DOM, timer, jaringan, atau skor.
- Input state yang sama dan aksi yang sama harus menghasilkan state baru yang sama.
- State lama tidak dimutasi.
- Hasil transformasi wajib memuat semua kepingan tepat satu kali.
- Fingerprint state baru dibuat setelah transformasi lolos validasi.
- Kegagalan internal tidak boleh meninggalkan setengah perubahan.

## 16. Aturan Gerak per Jenis Puzzle

### `ordered_sequence`

Nilai `movementRule` MVP:

- `move_to_index`: kepingan dipindahkan ke indeks tujuan dan kepingan di antaranya bergeser;
- `swap_any`: dua posisi saling bertukar.

### `grid_rearrangement`

Nilai `movementRule` MVP:

- `swap_any`: dua sel berisi kepingan saling bertukar;
- `slide_to_empty`: hanya kepingan yang bersebelahan dengan sel kosong yang dapat bergeser.

Untuk `slide_to_empty`, hubungan bersebelahan dihitung dari baris dan kolom, bukan selisih indeks saja. Kepingan paling kanan pada satu baris tidak dianggap bersebelahan dengan kepingan paling kiri pada baris berikutnya.

Campuran beberapa aturan gerak dalam satu puzzle tidak didukung pada MVP.

## 17. Pemeriksaan Solusi

Kontrak pemeriksaan:

```js
{
  puzzleInstanceId: "urutkan-pecahan-01:v1:s81:i2",
  puzzleVersion: 1,
  stateFingerprint: "state-fp-04",
  boardState: {
    type: "ordered_sequence",
    positions: ["piece-c", "piece-a", "piece-b"]
  }
}
```

Hasil:

```js
{
  valid: true,
  solved: true,
  solutionCode: "accepted_order",
  correctPositionCount: 3,
  totalPositions: 3,
  explanation: "1/4 < 1/2 < 3/4."
}
```

### Aturan pemeriksaan

- Solusi diperiksa berdasarkan `solutionSpec`, bukan tampilan.
- Beberapa solusi ekuivalen dapat diterima jika dicatat eksplisit atau dinilai oleh rule evaluator yang tervalidasi.
- `valid: false` menunjukkan definisi, versi, atau state rusak; bukan kesalahan murid.
- Pada `on_submit`, state salah memberi feedback tetapi tetap dapat dilanjutkan.
- Pada `on_complete`, pemeriksaan berjalan setelah setiap langkah tetapi hanya status selesai yang diumumkan.
- `correctPositionCount` hanya ditampilkan jika konfigurasi mengizinkan.
- Hasil terlambat diabaikan jika fingerprint state sudah berubah.

## 18. Evaluasi, Kesalahan, dan Streak

Puzzle tidak menganggap setiap langkah yang menjauh dari solusi sebagai jawaban salah. Murid boleh bereksperimen selama langkahnya legal.

Definisi MVP:

- **Aksi ilegal:** tidak dihitung sebagai langkah dan tidak memutus streak.
- **Submit belum benar:** satu percobaan solusi yang salah; dapat memutus streak sesi.
- **Puzzle selesai:** satu unit jawaban benar untuk Mode Controller.
- **Puzzle dilewati:** `skipped`, hanya jika game mengizinkan fitur lewati.
- **Reset:** bukan jawaban salah, tetapi dicatat dan dapat menurunkan bonus efisiensi.
- **Undo:** bukan jawaban salah, tetapi dicatat dan dapat menurunkan bonus efisiensi.

Untuk `on_complete`, engine tidak memiliki submit salah. Efisiensi langkah, undo, reset, dan hint menjadi sinyal performa tambahan tanpa mengubah puzzle selesai menjadi salah.

## 19. Undo dan Reset

### Undo

- Undo mengembalikan tepat satu transformasi state yang sah.
- Seleksi dan aksi ilegal tidak masuk riwayat undo.
- Jumlah state tersimpan dibatasi `undoLimit`.
- Undo tidak tersedia setelah puzzle diselesaikan.
- Undo menambah `undoCount`, tetapi tidak mengurangi `moveCount` historis.
- State setelah undo tetap dihitung sebagai state aktif dan dapat dilanjutkan.
- Undo tidak mengembalikan hint yang sudah dipakai.

### Reset

- Reset memerlukan konfirmasi jika sudah ada beberapa langkah.
- Reset mengembalikan `initialBoardState` instance yang sama.
- Seed dan susunan awal tidak berubah.
- Reset menambah `resetCount`.
- `moveCount` historis tidak kembali ke nol untuk kepentingan hasil dan skor.
- Reset tidak mengembalikan hint atau waktu.

UI boleh menampilkan `currentPathMoveCount` terpisah dari `moveCount` historis agar murid memahami posisi saat ini tanpa menghapus rekam usaha.

## 20. Petunjuk dan Umpan Balik

Jenis petunjuk MVP:

| `hintType` | Perilaku |
| --- | --- |
| `concept` | Menampilkan konsep atau strategi umum |
| `next_relation` | Menjelaskan satu hubungan yang perlu diperhatikan |
| `highlight_piece` | Menyorot kepingan yang relevan tanpa memindahkannya |

Aturan petunjuk:

- hint berasal dari konten yang dikurasi, bukan membuka `solutionSpec` mentah;
- jumlah hint dibatasi per puzzle;
- hint tidak memindahkan kepingan otomatis pada MVP;
- hint yang sama tidak dihitung dua kali jika hanya dibuka ulang;
- penggunaan hint dicatat dan dapat mengurangi bonus, bukan skor dasar penyelesaian;
- warna bukan satu-satunya penanda highlight;
- petunjuk tidak boleh menampilkan urutan jawaban lengkap.

Umpan balik harus menjelaskan langkah belajar. Pesan seperti “belum tepat, bandingkan dua pecahan paling kecil dahulu” lebih berguna daripada hanya “salah”.

## 21. Skor dan Efisiensi

Scoring Service menerima kejadian penyelesaian, bukan membaca posisi UI.

Komponen skor yang diizinkan:

- skor dasar karena menyelesaikan puzzle;
- bonus tingkat kesulitan;
- bonus efisiensi langkah;
- bonus tanpa hint;
- bonus tanpa reset;
- bonus waktu hanya untuk puzzle yang memang layak dikerjakan cepat.

Contoh efisiensi jika `referenceMoveCount` tersedia:

```text
effectiveMoves = moveCount + undoCount + (resetCount × resetWeight)
efficiencyRatio = min(1, referenceMoveCount / max(referenceMoveCount, effectiveMoves))
```

Aturan skor:

- `referenceMoveCount` adalah acuan wajar atau hasil solver tervalidasi, bukan tebakan sembarang;
- puzzle tetap memberi skor dasar meskipun tidak efisien;
- aksi ilegal tidak mengurangi skor;
- hint, undo, dan reset hanya mengurangi bonus;
- kecepatan tidak boleh mengalahkan ketepatan;
- puzzle yang sama berulang terlalu cepat dapat menerima hadiah permanen lebih kecil;
- rumus skor memiliki nomor versi.

Jika acuan langkah tidak dapat dihitung secara adil, bonus efisiensi dinonaktifkan.

## 22. Integrasi Mode Permainan

### `limited_questions`

Untuk Puzzle, satu unit target adalah satu **puzzle selesai**. `questionLimit` dipetakan menjadi `puzzleLimit` oleh adapter engine. Puzzle yang baru dimuat tetapi belum selesai tidak menambah progres.

### `limited_time`

- Murid menyelesaikan sebanyak mungkin puzzle sebelum waktu habis.
- Saat timer nol, input dikunci.
- Transformasi state yang sudah diterima sebelum deadline boleh diselesaikan.
- Puzzle yang belum selesai tidak dihitung salah.
- Puzzle kompleks tidak boleh memakai durasi yang terlalu pendek.

### `endless`

- Puzzle baru dimuat sampai murid berhenti atau batas keamanan tercapai.
- Provider mencegah pengulangan terlalu cepat.
- Kesulitan dapat meningkat antar-puzzle, bukan di tengah puzzle aktif.
- Checkpoint dibuat setelah puzzle selesai dan pada interval langkah yang wajar.

### `limited_lives`

Ditunda sampai setelah MVP. Jika diaktifkan nanti, nyawa hanya boleh berkurang karena submit solusi yang salah pada `on_submit`, bukan karena setiap langkah eksplorasi, undo, atau aksi ilegal.

## 23. Tingkat Kesulitan

Kesulitan dapat berasal dari:

- jumlah kepingan;
- kompleksitas nilai atau hubungan matematika;
- jumlah solusi ekuivalen;
- jarak state awal dari solusi;
- aturan gerak yang lebih terbatas;
- banyaknya langkah penalaran;
- jumlah petunjuk yang tersedia;
- representasi campuran angka, pecahan, gambar, atau simbol;
- distraktor konseptual yang masuk akal.

Kesulitan tidak boleh dinaikkan dengan memperkecil kepingan, mempersempit area sentuh, menyembunyikan instruksi, atau membuat animasi lebih cepat.

Kesulitan adaptif berubah hanya ketika puzzle berikutnya dipilih. Engine tidak mengganti aturan atau susunan puzzle aktif karena performa murid sedang buruk.

## 24. UI Mobile dan Interaksi

MVP mendukung dua pola input setara:

1. menyeret kepingan ke posisi tujuan;
2. mengetuk kepingan lalu mengetuk posisi tujuan.

Aturan UI:

- area sentuh minimal sekitar 44 × 44 piksel CSS;
- kepingan terpilih memiliki indikator jelas;
- posisi tujuan yang legal dapat diberi affordance tanpa membocorkan solusi;
- gesture seret memakai Pointer Events;
- halaman tidak bergulir selama gesture aktif yang sah;
- mode ketuk tetap tersedia jika tujuan berada di luar jangkauan seret nyaman;
- nomor langkah, undo, reset, hint, dan submit mudah dibedakan;
- papan besar tidak diperkecil sampai teks tidak terbaca;
- jika ruang tidak cukup, puzzle dibagi atau memakai layout yang dapat digulir secara aman;
- perubahan orientasi tidak mengubah state.

Animasi hanya merepresentasikan transformasi yang sudah sah. State tidak menunggu animasi untuk menjadi benar.

## 25. Aksesibilitas

- Semua kepingan dan posisi dapat dijangkau dengan keyboard.
- `Enter` atau `Space` memilih dan mengonfirmasi.
- Tombol panah dapat memindahkan fokus atau menggeser kepingan pada puzzle yang sesuai.
- `Escape` membatalkan pilihan.
- Setiap kepingan memiliki nama aksesibel berisi kontennya.
- Posisi dibacakan dengan nomor baris/kolom atau urutan.
- Perubahan state penting diumumkan melalui live region yang tidak berisik.
- Fokus mengikuti kepingan secara konsisten setelah perpindahan.
- Status dipilih, tidak valid, selesai, dan hint tidak bergantung pada warna.
- Animasi menghormati `prefers-reduced-motion`.
- Audio hanya tambahan.

Untuk grid, urutan fokus harus mengikuti urutan visual. Pembaca layar tidak boleh menerima urutan yang berbeda dari state domain.

## 26. Pause, Checkpoint, dan Pemulihan

Checkpoint minimum:

```js
{
  engineType: "puzzle",
  engineVersion: 1,
  puzzleId: "urutkan-pecahan-01",
  puzzleVersion: 1,
  puzzleInstanceId: "urutkan-pecahan-01:v1:s81:i2",
  seed: "s81",
  generatorVersion: 1,
  initialBoardState: {
    type: "ordered_sequence",
    positions: ["piece-b", "piece-c", "piece-a"]
  },
  boardState: {
    type: "ordered_sequence",
    positions: ["piece-c", "piece-b", "piece-a"]
  },
  moveCount: 1,
  invalidActionCount: 0,
  undoCount: 0,
  resetCount: 0,
  hintsUsedOnPuzzle: 0,
  moveHistory: [],
  score: 0,
  streak: 0,
  modeState: {},
  summary: {},
  updatedAt: "server-timestamp"
}
```

### Aturan pemulihan

- Gesture dan seleksi aktif tidak dipulihkan.
- State papan, seed, instance, dan versi harus sama.
- Riwayat undo boleh dibatasi, tetapi state aktif tidak boleh berubah.
- Puzzle tidak diacak ulang setelah refresh.
- Timer mengikuti `14-Mode-Permainan.md`.
- Jika definisi atau engine tidak kompatibel, sesi dihentikan dengan `incompatible_version`.
- Checkpoint yang rusak tidak dipaksakan; sistem menawarkan mulai ulang tanpa menggandakan hadiah.
- Hasil puzzle yang sudah selesai tidak dapat dibuka lagi sebagai puzzle aktif.

## 27. Kontrak Hasil Khusus Puzzle

Ringkasan engine menjadi bagian dari hasil sesi umum:

```js
{
  engineSummary: {
    puzzlesCompleted: 4,
    puzzlesSkipped: 0,
    totalMoves: 27,
    totalInvalidActions: 2,
    totalUndos: 3,
    totalResets: 1,
    totalHintsUsed: 2,
    firstTryCompletions: 3,
    averageMovesPerPuzzle: 6.75,
    averageSecondsPerPuzzle: 58.4,
    puzzleTypeCounts: {
      ordered_sequence: 3,
      grid_rearrangement: 1
    },
    inputMethods: {
      drag: 14,
      tap: 13,
      keyboard: 0
    }
  }
}
```

### Aturan ringkasan

- `puzzlesCompleted` menghitung instance unik yang selesai.
- `totalMoves` tidak berkurang karena undo atau reset.
- `totalInvalidActions` digunakan untuk evaluasi UX, bukan menghukum kemampuan matematika.
- `firstTryCompletions` berarti selesai tanpa submit salah, reset, atau hint; undo dapat dicatat terpisah sesuai kebijakan versi.
- Distribusi metode input tidak memengaruhi skor.
- Hasil memakai `sessionId` yang sama untuk mencegah XP ganda.
- Ringkasan tidak menyimpan `solutionSpec` atau kunci jawaban mentah.

## 28. Analitik Minimum

| Event | Data penting |
| --- | --- |
| `puzzle_presented` | session, puzzle, instance, version, type, piece count |
| `puzzle_legal_move_applied` | action, move number, input method, state fingerprint |
| `puzzle_illegal_move_rejected` | action type, reason code, input method |
| `puzzle_undo_used` | move count, remaining undo capacity |
| `puzzle_reset_used` | move count before reset |
| `puzzle_hint_used` | hint type, hint number |
| `puzzle_completed` | moves, undo, reset, hints, duration, efficiency band |
| `puzzle_load_failed` | phase, error code, recoverable |

State papan lengkap tidak perlu dikirim pada setiap event analitik. Fingerprint dan statistik agregat cukup untuk MVP; state lengkap hanya berada pada checkpoint yang memang diperlukan.

## 29. Penanganan Error dan Kasus Batas

| Kondisi | Respons |
| --- | --- |
| Definisi tidak memiliki solusi sah | Tolak sebelum tampil |
| State awal sudah selesai | Acak ulang dengan seed turunan atau ganti puzzle |
| Shuffle menghasilkan state mustahil | Tolak instance dan coba sesuai batas |
| Kepingan hilang atau ganda | Hentikan puzzle sebagai data tidak valid |
| Aksi menuju posisi ilegal | Abaikan tanpa penalti |
| Aksi ganda | Proses `actionId` pertama saja |
| Solver atau evaluator terlambat | Abaikan jika fingerprint sudah berubah |
| Undo melebihi batas | Nonaktifkan tombol dan pertahankan state |
| Reset saat tidak ada perubahan | Abaikan tanpa menambah reset |
| Waktu habis saat animasi | Kunci input berdasarkan deadline logis |
| Gambar kepingan gagal dimuat | Gunakan fallback aman atau ganti puzzle |
| Jaringan terputus | Simpan checkpoint lokal dan antrekan hasil |
| Tidak ada puzzle berikutnya | Selesaikan dengan `no_content` |

Kasus khusus:

- Jika resize membuat kepingan berada di luar viewport, layout dirender ulang dari state domain.
- Jika gerakan legal secara data tetapi animasinya gagal, state baru tetap menjadi sumber kebenaran.
- Jika submit dan timer nol terjadi hampir bersamaan, prioritas kondisi selesai mengikuti `14-Mode-Permainan.md`.
- Jika dua solusi sebenarnya ekuivalen tetapi hanya satu terdaftar, konten ditandai bermasalah dan tidak boleh menyalahkan murid.
- Jika checkpoint memiliki fingerprint tidak cocok, jangan menerapkan sebagian state.

## 30. Struktur Implementasi yang Disarankan

```text
games/
  engines/
    puzzle/
      puzzle-engine.js
      puzzle-state.js
      puzzle-actions.js
      puzzle-validator.js
      puzzle-instance-factory.js
      move-validator.js
      puzzle-reducer.js
      solution-evaluator.js
      puzzle-renderer.js
      puzzle-summary.js
      types/
        ordered-sequence.js
        grid-rearrangement.js
      puzzle.test.js
```

Solver yang dipakai untuk validasi atau menghitung jarak harus dipisahkan dari komponen UI. Solusi lengkap tidak boleh dimasukkan ke state presentasi hanya untuk mempermudah render.

## 31. Contoh Konfigurasi Game

```json
{
  "schemaVersion": 1,
  "gameId": "susun-pecahan",
  "version": 1,
  "status": "draft",
  "title": "Susun Pecahan",
  "description": "Urutkan pecahan dari nilai terkecil ke terbesar.",
  "engineType": "puzzle",
  "education": {
    "levels": ["SD", "SMP"],
    "grades": [5, 6, 7],
    "curriculumTags": ["bilangan", "pecahan", "perbandingan"]
  },
  "modes": [
    { "type": "limited_questions", "questionLimit": 5 },
    { "type": "limited_time", "timeLimitSeconds": 300 },
    { "type": "endless" }
  ],
  "content": {
    "questionSetIds": ["puzzle-pecahan-v1"],
    "initialDifficulty": "easy",
    "allowedDifficulties": ["easy", "medium", "hard"]
  },
  "scoring": {
    "version": 1,
    "baseCorrect": 200,
    "wrongPenalty": 0,
    "streakEnabled": true,
    "speedBonusEnabled": false
  },
  "progress": {
    "xpEnabled": true,
    "achievementsEnabled": true,
    "checkpointEnabled": true
  },
  "engineConfig": {
    "supportedPuzzleTypes": ["ordered_sequence"],
    "interactionStyle": "move_or_tap",
    "evaluationMode": "on_submit",
    "allowUndo": true,
    "undoLimit": 20,
    "allowReset": true,
    "allowHint": true,
    "maxHintsPerPuzzle": 2,
    "showMoveCount": true,
    "showCorrectPositionCount": false,
    "lockCorrectPieces": false,
    "shufflePolicy": {
      "minimumDistance": 2,
      "maximumAttempts": 50,
      "preventSolvedStart": true
    }
  }
}
```

## 32. Pengujian Minimum

### Unit test

- validator menolak ID ganda, jumlah posisi salah, dan solusi kosong;
- instance dengan seed sama menghasilkan state awal sama;
- state awal tidak pernah selesai ketika dilarang;
- generator hanya menghasilkan state yang dapat diselesaikan;
- setiap aturan gerak menerima aksi legal dan menolak aksi ilegal;
- reducer tidak memutasi state lama;
- kepingan tidak hilang atau ganda setelah move, swap, slide, undo, dan reset;
- evaluator menerima seluruh solusi ekuivalen;
- aksi duplikat tidak menambah langkah;
- perhitungan efisiensi, hint, reset, dan undo benar;
- checkpoint dapat diserialisasi tanpa data UI.

### Integration test

- Provider, Instance Factory, engine, Mode Controller, Scoring Service, dan Result Service bekerja bersama;
- mode batas puzzle berhenti tepat pada target;
- mode waktu mengunci input saat deadline;
- Endless memuat puzzle baru tanpa pengulangan terlalu cepat;
- refresh memulihkan seed dan state yang sama;
- hasil final idempoten dan tidak memberi XP ganda;
- versi puzzle tidak kompatibel dihentikan dengan aman.

### UI dan perangkat

- drag dan ketuk menghasilkan transformasi logis yang sama;
- keyboard dapat menyelesaikan puzzle penuh;
- undo, reset, hint, dan submit tidak mudah tertukar;
- halaman tidak bergulir tak terkendali saat menyeret;
- grid terbaca pada lebar 320 piksel;
- orientasi potret dan lanskap mempertahankan state;
- reduced motion tidak menghilangkan informasi;
- uji minimal pada Android kelas menengah dan browser desktop modern.

### Fixture wajib

- satu `ordered_sequence` bilangan untuk SD;
- satu `ordered_sequence` pecahan untuk SD/SMP;
- satu `grid_rearrangement` dengan `swap_any`;
- satu `grid_rearrangement` dengan `slide_to_empty` yang terbukti solvable;
- satu puzzle dengan lebih dari satu solusi sah;
- satu checkpoint tengah permainan.

## 33. Batas MVP

MVP mencakup:

- `ordered_sequence`;
- `grid_rearrangement` sederhana;
- aturan `move_to_index`, `swap_any`, dan `slide_to_empty`;
- input drag, ketuk, dan keyboard;
- evaluasi `on_submit` dan `on_complete`;
- undo terbatas dan reset;
- petunjuk konseptual terbatas;
- state awal deterministik dan dapat diselesaikan;
- mode batas puzzle, batas waktu, dan Endless;
- checkpoint dan pemulihan;
- ringkasan serta analitik dasar;
- konten matematika SD–SMP.

MVP tidak mencakup:

- jigsaw bentuk bebas;
- rotasi dan perubahan ukuran kepingan;
- puzzle fisika;
- Sudoku atau solver constraint umum;
- editor visual puzzle;
- multiplayer;
- leaderboard global;
- solusi yang dihasilkan AI pada saat bermain;
- konten khusus SMA.

## 34. Kriteria Siap Implementasi

Engine dianggap siap diimplementasikan jika:

1. Kontrak definisi, instance, state, aksi, reducer, evaluator, dan hasil disepakati.
2. Batas Puzzle terhadap Drag & Drop, Matching, dan Adventure jelas.
3. Setiap jenis puzzle MVP memiliki aturan gerak yang tidak ambigu.
4. Validator dapat memastikan state awal valid dan dapat diselesaikan.
5. Solusi ekuivalen memiliki kebijakan yang jelas.
6. Undo dan reset tidak dapat menghapus rekam usaha.
7. Progres mode dihitung dari puzzle selesai, bukan jumlah langkah.
8. Checkpoint dapat memulihkan instance yang sama.
9. Seluruh fixture dan test minimum tersedia.

Engine dianggap siap dirilis jika semua kriteria di atas lolos pada perangkat target, tidak ada state mustahil atau hadiah ganda, dan murid dapat menyelesaikan puzzle tanpa bergantung pada drag.

## 35. Contoh Game yang Dapat Dibuat

- **Urutkan Bilangan:** susun bilangan bulat dari terkecil ke terbesar.
- **Tangga Pecahan:** urutkan pecahan, desimal, dan persen berdasarkan nilai.
- **Rantai Operasi:** susun langkah operasi agar menghasilkan nilai target.
- **Langkah Persamaan:** urutkan tahap penyelesaian persamaan sederhana.
- **Pola yang Hilang:** tata kepingan bilangan agar pola baris dan kolom terpenuhi.
- **Grid Koordinat:** geser kepingan menuju posisi berdasarkan pasangan koordinat.
- **Jalur Konversi:** susun tahapan perubahan satuan secara benar.

Game pertama untuk implementasi sebaiknya **Urutkan Bilangan** dengan `ordered_sequence`. Mekaniknya cukup sederhana untuk menguji state, move, undo, evaluasi, checkpoint, dan aksesibilitas sebelum masuk ke grid.

## 36. Keputusan yang Ditetapkan

1. ID teknis engine adalah `puzzle`.
2. Puzzle dinilai dari keadaan papan, bukan koordinat layar.
3. MVP mendukung `ordered_sequence` dan `grid_rearrangement` sederhana.
4. Gesture drag dan kontrol ketuk merupakan input setara.
5. Aksi ilegal tidak dihitung sebagai langkah atau jawaban salah.
6. Langkah eksplorasi legal tidak otomatis dianggap salah.
7. Puzzle selesai dihitung sebagai satu unit progres mode.
8. Undo dan reset tidak menghapus rekam usaha historis.
9. Hint hanya mengurangi bonus dan tidak memindahkan kepingan otomatis.
10. State awal wajib deterministik, tidak langsung selesai, dan dapat diselesaikan.
11. Solusi disimpan di evaluator, bukan komponen presentasi.
12. Kesulitan berasal dari konsep dan aturan, bukan hambatan kontrol.
13. Fokus rilis tetap SD–SMP; SMA hanya disiapkan pada struktur.

## 37. Langkah Berikutnya

Setelah dokumen ini, rancangan dilanjutkan ke `08-Engine-Adventure.md`. Engine Adventure akan menjadi lapisan orkestrasi yang menggabungkan misi, progres level, dialog singkat, dan aktivitas dari engine lain tanpa menyalin ulang logika Quiz, Matching, Drag & Drop, atau Puzzle.
