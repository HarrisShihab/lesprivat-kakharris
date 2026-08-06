# Engine Drag & Drop

**Proyek:** Website Les Privat Kak Harris  
**Lokasi tujuan:** `docs/Games/06-Engine-DragDrop.md`  
**Status:** Rancangan awal  
**Fokus rilis:** Matematika SD–SMP

## 1. Tujuan

Engine Drag & Drop adalah mesin permainan untuk memindahkan item sumber ke zona target yang sesuai. Engine ini dipakai ketika makna pembelajaran lebih mudah dipahami melalui pengelompokan, penempatan, atau pelabelan visual daripada melalui pilihan jawaban biasa.

Engine dirancang untuk:

- mengelompokkan objek berdasarkan sifat atau kategori;
- menempatkan label pada bagian gambar atau diagram;
- memasangkan representasi dengan daerah tujuan;
- memberi umpan balik langsung setelah penempatan;
- mendukung kontrol seret serta alternatif ketuk;
- bekerja stabil pada layar sentuh dan koneksi tidak sempurna;
- memakai Session Manager, Mode Controller, Scoring Service, Evaluator, dan Result Service bersama.

Engine ini bukan alat bebas untuk membuat semua interaksi visual. Penyusunan urutan kompleks, kepingan bentuk, atau papan dengan aturan spasial khusus menjadi tanggung jawab Engine Puzzle.

## 2. Bentuk Interaksi Resmi

MVP mendukung dua cara interaksi yang menghasilkan aksi logis yang sama:

1. **Seret dan lepas:** murid menyeret item sumber lalu melepasnya di zona target.
2. **Ketuk dua langkah:** murid mengetuk item sumber, lalu mengetuk zona target.

Keduanya menghasilkan aksi berikut:

```js
{
  type: "PLACE_ITEM",
  itemId: "item-pecahan-1",
  targetId: "target-senilai-setengah",
  inputMethod: "drag"
}
```

Nilai `inputMethod` resmi MVP adalah `drag`, `tap`, atau `keyboard`. Evaluasi tidak boleh bergantung pada cara input.

### Mengapa alternatif ketuk wajib

- gerakan seret sulit dilakukan pada HP kecil;
- halaman dapat ikut bergulir ketika gesture tidak ditangani dengan benar;
- sebagian murid memiliki kendala motorik;
- keyboard dan teknologi bantu tidak dapat mengandalkan gesture;
- ketuk dua langkah lebih akurat untuk target kecil.

Mode ketuk bukan fitur tambahan. Ia merupakan kontrol setara untuk mekanik yang sama.

## 3. Batas Tanggung Jawab

### Engine menangani

- state item sumber dan zona target;
- urutan acak item jika diizinkan;
- pemilihan item melalui ketuk atau keyboard;
- gesture seret dan indikator target aktif;
- pengiriman kandidat penempatan ke Placement Evaluator;
- penguncian input selama evaluasi dan feedback;
- pengembalian item setelah penempatan salah;
- penguncian item yang telah ditempatkan benar;
- pergantian papan;
- ringkasan khusus Drag & Drop.

### Engine tidak menangani

- autentikasi dan hak akses murid;
- filter katalog berdasarkan jenjang;
- penulisan langsung ke Firestore;
- perhitungan XP atau achievement permanen;
- penentuan akhir sesi;
- kurasi hubungan item dan target;
- penilaian berdasarkan posisi piksel mentah;
- penyusunan urutan yang memiliki banyak langkah saling bergantung;
- simulasi fisika atau gerakan bebas di kanvas.

Pembagian ini mengikuti `02-Arsitektur-Game.md` dan `14-Mode-Permainan.md`.

## 4. Target Penggunaan

### Jenjang awal

- SD kelas 1–6.
- SMP kelas 7–9.

### Contoh materi

- kelompok bilangan ganjil dan genap;
- kelompok bilangan prima dan komposit;
- jenis sudut;
- bangun datar berdasarkan sifatnya;
- pecahan senilai;
- satuan panjang, massa, waktu, atau luas;
- suku sejenis dan tidak sejenis;
- unsur bentuk aljabar;
- klasifikasi data dan jenis diagram;
- label sisi, sudut, jari-jari, diameter, atau titik pada gambar.

Struktur dapat menerima kelas 10–12 pada masa depan. Konten SMA dan interaksi grafik kompleks belum termasuk target awal.

## 5. Mekanik yang Termasuk dan Tidak Termasuk

### Termasuk MVP

- banyak item menuju satu target kategori;
- satu item menuju satu target yang benar;
- target berbentuk kartu atau area pada gambar;
- validasi langsung saat item dilepas;
- item salah kembali ke tempat asal;
- item benar terkunci di target;
- papan terdiri dari 3–10 item sumber;
- konten teks, matematika sederhana, dan gambar.

### Tidak termasuk MVP

- satu item harus ditempatkan di beberapa target sekaligus;
- satu target memerlukan urutan item tertentu;
- penempatan berdasarkan koordinat presisi tanpa zona;
- rotasi, mengubah ukuran, atau menumpuk kepingan;
- bentuk bebas yang harus pas secara geometris;
- beberapa jawaban parsial dengan skor pecahan;
- mode dua pemain secara langsung;
- editor visual papan untuk admin.

Jika tujuan utama adalah mengurutkan langkah, menyusun kepingan, atau membangun bentuk, gunakan Engine Puzzle.

## 6. Istilah Inti

| Istilah | Arti |
| --- | --- |
| Papan (`board`) | Satu set item sumber dan zona target yang tampil bersamaan |
| Item sumber (`source item`) | Objek yang dapat dipindahkan |
| Zona target (`drop zone`) | Area tujuan penempatan item |
| Kandidat penempatan | Pasangan item dan target yang akan dinilai |
| Percobaan (`attempt`) | Kandidat penempatan yang telah dievaluasi |
| Item selesai (`resolved item`) | Item yang sudah ditempatkan benar dan dikunci |
| Kapasitas target | Jumlah item yang dapat diterima target |
| Slot | Tempat visual item benar di dalam target |
| Posisi asal | Tempat item sebelum penempatan sah |

Mengambil item lalu membatalkan gesture di luar target bukan percobaan. Percobaan baru dihitung setelah item dikirim ke suatu target yang sah.

## 7. Kontrak Konfigurasi Engine

Properti khusus ditempatkan di dalam `engineConfig`:

```json
{
  "engineConfig": {
    "interactionStyle": "drag_or_tap",
    "evaluationMode": "immediate",
    "wrongPlacementBehavior": "return_to_source",
    "correctPlacementBehavior": "lock_in_target",
    "shuffleItems": true,
    "itemsPerBoard": 6,
    "showTargetCapacity": true,
    "allowRepositionResolvedItem": false,
    "allowHint": false,
    "hintAfterWrongAttempts": 3,
    "wrongFeedbackDurationMs": 700,
    "correctFeedbackDurationMs": 500,
    "content": {
      "allowedFormats": ["text", "math", "image"],
      "maxTextLength": 100
    },
    "repeatPolicy": {
      "minimumBoardGap": 2,
      "recentItemLimit": 30
    }
  }
}
```

### Aturan validasi

- `interactionStyle` MVP hanya menerima `drag_or_tap`.
- `evaluationMode` MVP hanya menerima `immediate`.
- `wrongPlacementBehavior` MVP hanya menerima `return_to_source`.
- `correctPlacementBehavior` MVP hanya menerima `lock_in_target`.
- `itemsPerBoard` berada pada rentang 3–10.
- Durasi feedback berada pada rentang 300–3000 milidetik.
- `hintAfterWrongAttempts` minimal 2 jika petunjuk diaktifkan.
- Setiap format konten harus memiliki renderer yang tersedia.
- Jumlah item tidak boleh melampaui jumlah kapasitas seluruh target.
- Setiap item harus memiliki setidaknya satu target benar.
- Konfigurasi tidak valid ditolak sebelum sesi dibuat.

Sepuluh item adalah batas awal, bukan target desain. Untuk HP kecil, 4–6 item per papan lebih aman.

## 8. Kontrak Papan

Question Provider memberikan papan yang telah lolos validasi:

```json
{
  "boardId": "jenis-bilangan-01",
  "boardVersion": 1,
  "title": "Kelompokkan Bilangannya",
  "instruction": "Pindahkan setiap bilangan ke kelompok yang tepat.",
  "layout": "targets_top_sources_bottom",
  "targets": [
    {
      "targetId": "target-genap",
      "content": { "format": "text", "value": "Bilangan Genap" },
      "capacity": 3,
      "acceptedAnswerRefs": ["answer-genap"]
    },
    {
      "targetId": "target-ganjil",
      "content": { "format": "text", "value": "Bilangan Ganjil" },
      "capacity": 3,
      "acceptedAnswerRefs": ["answer-ganjil"]
    }
  ],
  "items": [
    {
      "itemId": "item-2",
      "content": { "format": "math", "value": "2" },
      "answerSpecRef": "answer-genap",
      "explanation": "2 habis dibagi 2."
    },
    {
      "itemId": "item-5",
      "content": { "format": "math", "value": "5" },
      "answerSpecRef": "answer-ganjil",
      "explanation": "5 tidak habis dibagi 2."
    }
  ],
  "metadata": {
    "educationLevel": "SD",
    "grades": [3, 4],
    "topicId": "bilangan",
    "subtopicId": "ganjil-genap",
    "difficulty": "easy",
    "estimatedSeconds": 60
  }
}
```

### Aturan konten

- `boardId` stabil dan unik di bank konten.
- `boardVersion` naik jika isi, aturan jawaban, atau makna papan berubah.
- Semua `itemId` dan `targetId` unik di dalam papan.
- `answerSpecRef` tidak ditampilkan sebagai kunci jawaban di UI.
- Hubungan benar ditentukan evaluator, bukan urutan array atau posisi layar.
- Kapasitas target berupa bilangan bulat positif.
- Total kapasitas target minimal sama dengan jumlah item.
- Target tanpa item yang mungkin benar ditolak, kecuali papan memang mengizinkan target kosong dan menandainya secara eksplisit pada versi setelah MVP.
- Konten ambigu atau duplikat visual yang tidak disengaja tidak boleh diterbitkan.
- Metadata jenjang, kelas, topik, dan kesulitan wajib tersedia.

## 9. Model Hubungan Item dan Target

MVP mengizinkan dua pola:

1. **Satu-ke-satu:** satu target menerima satu item tertentu.
2. **Banyak-ke-satu:** satu target kategori menerima beberapa item berbeda.

Satu item sebaiknya memiliki tepat satu target benar pada papan yang sama. Beberapa target ekuivalen hanya boleh digunakan jika benar-benar diperlukan dan evaluator menyatakan semua target sah secara eksplisit.

Engine tidak membandingkan `answerSpecRef` dan `acceptedAnswerRefs` secara langsung di komponen tampilan. Hubungan itu diperiksa oleh Placement Evaluator agar implementasi UI tidak menyimpan logika jawaban.

## 10. Layout Papan

Nilai layout MVP:

| Nilai | Penggunaan |
| --- | --- |
| `targets_top_sources_bottom` | Target di atas, item sumber di bawah; default mobile |
| `targets_left_sources_right` | Dua kolom pada layar lebar |
| `image_overlay` | Zona target berada di atas gambar atau diagram |

Aturan layout:

- layout boleh berubah responsif tanpa mengubah ID atau hubungan jawaban;
- zona target harus tetap terlihat saat item dipilih melalui ketuk;
- area gulir tidak boleh tertutup item yang sedang diseret;
- `image_overlay` memakai zona relatif terhadap ukuran gambar, bukan koordinat layar absolut;
- target tidak boleh saling tumpang tindih pada MVP;
- target yang berada di luar viewport harus dapat dicapai tanpa kehilangan item terpilih.

## 11. State Internal Engine

```js
{
  phase: "loading_board",
  boardNumber: 1,
  currentBoardId: null,
  currentBoardVersion: null,
  sourceOrder: [],
  selectedItemId: null,
  draggingItemId: null,
  activeTargetId: null,
  inputLocked: false,
  itemPlacements: {},
  resolvedItemIds: [],
  attemptsOnBoard: 0,
  wrongAttemptsOnBoard: 0,
  boardStartedAt: null,
  pendingEvaluation: null,
  recentBoardIds: [],
  recentItemIds: [],
  summary: {
    boardsCompleted: 0,
    itemsResolved: 0,
    totalAttempts: 0,
    wrongAttempts: 0,
    hintsUsed: 0,
    inputMethods: {
      drag: 0,
      tap: 0,
      keyboard: 0
    }
  }
}
```

Nilai `phase` resmi:

- `loading_board`;
- `ready`;
- `dragging`;
- `item_selected`;
- `evaluating`;
- `showing_feedback`;
- `board_complete`;
- `paused`;
- `finished`;
- `error`.

State domain tidak menyimpan objek DOM, pointer event, elemen HTML, atau koordinat layar sementara.

## 12. Alur Permainan

1. Session Manager membuat sesi dan memilih mode.
2. Provider mengambil papan sesuai game, kelas, topik, dan kesulitan.
3. Engine memvalidasi versi, target, item, kapasitas, dan renderer.
4. Item sumber diacak menggunakan RNG sesi jika diizinkan.
5. Papan ditampilkan dalam status `ready`.
6. Murid menyeret atau memilih satu item.
7. Murid melepaskan item atau memilih target.
8. Engine membentuk kandidat penempatan dan mengunci input terkait.
9. Placement Evaluator menilai kandidat.
10. Penempatan benar dikunci; penempatan salah dikembalikan.
11. Engine memperbarui skor, streak, progres, dan ringkasan.
12. Jika seluruh item selesai, papan ditandai lengkap.
13. Mode Controller memutuskan apakah sesi selesai atau papan berikutnya dimuat.
14. Hasil final dikirim satu kali melalui Result Service.

## 13. Aksi yang Diterima

```js
{ type: "START_DRAG", itemId, pointerId }
{ type: "ENTER_TARGET", targetId }
{ type: "LEAVE_TARGET", targetId }
{ type: "DROP_ITEM", itemId, targetId, inputMethod: "drag" }
{ type: "SELECT_ITEM", itemId, inputMethod: "tap" }
{ type: "SELECT_TARGET", targetId, inputMethod: "tap" }
{ type: "CANCEL_SELECTION" }
{ type: "PLACE_ITEM", itemId, targetId, inputMethod }
{ type: "REQUEST_HINT" }
{ type: "PAUSE_SESSION" }
{ type: "RESUME_SESSION" }
{ type: "FINISH_SESSION" }
```

### Aturan aksi

- Item yang sudah selesai tidak dapat dipilih lagi pada MVP.
- Satu item tidak dapat memiliki dua gesture aktif.
- `pointerId` hanya membantu kontrol gesture dan tidak disimpan permanen.
- `DROP_ITEM` di luar target membatalkan gesture tanpa mencatat percobaan.
- `SELECT_TARGET` tanpa item terpilih tidak mencatat percobaan.
- Memilih item lain melalui ketuk mengganti pilihan aktif.
- `PLACE_ITEM` hanya diproses saat fase mengizinkan dan input tidak terkunci.
- Aksi ganda dengan kandidat yang sama harus diabaikan.

## 14. Placement Evaluator

Kontrak permintaan:

```js
{
  sessionId: "session-123",
  boardId: "jenis-bilangan-01",
  boardVersion: 1,
  attemptId: "attempt-7",
  itemId: "item-2",
  targetId: "target-genap"
}
```

Kontrak hasil:

```js
{
  attemptId: "attempt-7",
  valid: true,
  correct: true,
  normalizedAnswer: {
    itemId: "item-2",
    targetId: "target-genap"
  },
  feedbackCode: "correct_placement",
  explanation: "2 termasuk bilangan genap."
}
```

### Aturan evaluasi

- `valid: false` berarti data item, target, versi, atau state tidak sah.
- Kandidat tidak valid tidak dihitung sebagai jawaban salah.
- Kandidat sah dan salah menambah `totalAttempts` serta `wrongAttempts`.
- Kandidat sah dan benar menambah `totalAttempts` serta `itemsResolved`.
- `attemptId` hanya boleh dinilai satu kali.
- Target yang sudah penuh menolak kandidat sebagai tidak valid, bukan jawaban konsep yang salah.
- Hasil evaluator yang terlambat harus diabaikan jika sesi atau papan sudah berubah.

## 15. Perilaku Penempatan

### Penempatan benar

1. item bergerak atau muncul pada slot target;
2. item diberi status selesai;
3. target memperbarui kapasitas terisi;
4. item tidak lagi tersedia di area sumber;
5. feedback singkat ditampilkan;
6. fokus berpindah ke item berikutnya atau status papan.

### Penempatan salah

1. target menampilkan tanda salah yang tidak berlebihan;
2. item kembali ke posisi asal secara singkat;
3. item tetap dapat dipilih kembali;
4. streak terputus sesuai Scoring Service;
5. penjelasan atau petunjuk dapat ditampilkan;
6. fokus kembali ke item yang sama atau area sumber.

Animasi tidak boleh menjadi sumber kebenaran. Jika animasi gagal, state logis tetap harus benar.

## 16. Kapasitas dan Slot Target

- `capacity` menentukan jumlah item benar yang dapat dikunci di target.
- Target menampilkan jumlah slot hanya jika `showTargetCapacity: true`.
- Slot visual tidak harus mewakili urutan jawaban.
- Target dianggap penuh berdasarkan state domain, bukan jumlah elemen DOM.
- Item salah tidak pernah memakai kapasitas target.
- Kapasitas yang tidak cocok dengan data papan menyebabkan papan ditolak sebelum tampil.
- Target kategori dengan banyak item harus mengatur ulang tampilan agar item tetap terbaca.

Pada layar kecil, item benar boleh diringkas menjadi chip, ikon, atau daftar kompak setelah masuk ke target, selama maknanya tidak berubah.

## 17. Skor, Streak, dan Akurasi

Satu percobaan sah adalah satu item yang diajukan ke satu target.

```text
accuracy = itemsResolved / totalAttempts × 100%
```

Aturan awal:

- penempatan benar pada percobaan pertama mendapat skor dasar penuh;
- percobaan salah tidak memberi skor negatif pada MVP;
- penempatan benar setelah kesalahan tetap menyelesaikan item;
- bonus percobaan pertama dapat diberikan tetapi harus dibatasi;
- bonus kecepatan hanya aktif pada materi yang sesuai;
- hint dapat mengurangi bonus item, bukan menghapus seluruh skor;
- input `drag`, `tap`, dan `keyboard` memiliki nilai skor yang sama;
- rumus skor memiliki nomor versi.

Progres papan berbeda dari akurasi. Papan dapat selesai 100% walaupun murid beberapa kali salah.

## 18. Integrasi Mode Permainan

### `limited_questions`

Untuk engine ini, satu unit target mode adalah satu **item selesai**. `questionLimit` dipetakan ke `resolvedItemLimit` pada adapter engine. Papan terakhir boleh memuat item sebanyak sisa target agar sesi tidak melebihi batas.

### `limited_time`

- Murid menyelesaikan sebanyak mungkin item sebelum waktu habis.
- Saat timer nol, gesture aktif dibatalkan dan input dikunci.
- Kandidat yang sudah dikirim sebelum waktu habis boleh diselesaikan hanya jika Mode Controller mencatatnya sebagai pending yang sah.
- Item belum selesai tidak dihitung sebagai salah.

### `endless`

- Papan baru terus dimuat sampai murid berhenti atau batas keamanan tercapai.
- Provider menerapkan anti-pengulangan papan dan item.
- Checkpoint dibuat setelah beberapa item atau setiap papan selesai.

### `limited_lives`

Didukung setelah MVP dasar. Setiap penempatan salah yang sah dapat mengurangi satu nyawa. Gesture batal dan kandidat tidak valid tidak mengurangi nyawa.

## 19. Tingkat Kesulitan

Kesulitan dapat dinaikkan melalui kombinasi berikut:

- jumlah item per papan;
- jumlah target;
- kemiripan antartarget;
- variasi representasi teks, gambar, atau simbol;
- kebutuhan memahami lebih dari satu sifat;
- panjang teks atau kompleksitas diagram;
- penggunaan distraktor yang masuk akal;
- batas waktu yang tetap wajar.

Kesulitan tidak boleh dinaikkan hanya dengan memperkecil target atau membuat gesture lebih sulit. Kesulitan harus berasal dari konsep matematika, bukan dari hambatan UI.

## 20. Petunjuk dan Umpan Balik

### Petunjuk yang diizinkan

- menyorot satu target yang mungkin benar;
- mengurangi jumlah target kandidat;
- menampilkan definisi atau sifat yang relevan;
- memberi contoh lain tanpa membocorkan item aktif;
- membacakan ulang instruksi.

### Aturan petunjuk

- petunjuk tidak aktif secara default pada MVP;
- petunjuk dapat muncul setelah jumlah kesalahan tertentu;
- penggunaan hint dicatat satu kali per item;
- highlight target tidak boleh mengubah jawaban otomatis;
- hint harus membantu memahami konsep, bukan sekadar menunjukkan warna tujuan.

Umpan balik benar dan salah harus menggunakan ikon serta teks, bukan warna saja.

## 21. UI Mobile dan Gesture

- Gunakan Pointer Events, bukan HTML5 Drag and Drop API sebagai satu-satunya mekanisme.
- Item memiliki area sentuh minimal sekitar 44 × 44 piksel CSS.
- Target menerima item ketika titik pelepasan berada di area target yang jelas.
- Halaman tidak bergulir selama gesture seret yang sah, tetapi gulir normal tetap tersedia di luar item.
- Item terpilih memiliki indikator visual yang kuat.
- Target kompatibel disorot saat item diseret atau dipilih.
- Target tidak kompatibel tidak perlu dibocorkan sebelum evaluasi.
- Bayangan item yang diseret tidak boleh menutupi label target sepenuhnya.
- Jika target berada di luar layar, mode ketuk harus tetap dapat digunakan.
- Orientasi layar tidak boleh menghapus state papan.

Auto-scroll saat menyeret belum wajib pada MVP. Jika papan memerlukan banyak gulir, desain papan harus diperkecil atau dibagi.

## 22. Aksesibilitas

- Semua item dan target dapat dijangkau dengan keyboard.
- `Enter` atau `Space` memilih item dan mengonfirmasi target.
- `Escape` membatalkan pilihan aktif.
- Setiap item memiliki nama aksesibel yang menjelaskan konten.
- Setiap target memiliki nama, kapasitas, dan status terisi yang dapat dibaca.
- Perubahan benar, salah, dan progres diumumkan melalui live region yang tidak berisik.
- Fokus tidak hilang setelah item berpindah.
- Kontras indikator pilihan dan fokus memenuhi standar yang layak.
- Animasi menghormati preferensi `prefers-reduced-motion`.
- Audio hanya tambahan dan tidak membawa informasi unik.

Implementasi tidak boleh memakai atribut ARIA yang menyatakan drag sebagai satu-satunya cara interaksi. Alternatif ketuk/keyboard harus dijelaskan melalui instruksi singkat.

## 23. Pause, Checkpoint, dan Pemulihan

Checkpoint minimum:

```js
{
  engineType: "drag_drop",
  engineVersion: 1,
  boardId: "jenis-bilangan-01",
  boardVersion: 1,
  sourceOrder: ["item-5", "item-2"],
  resolvedItemIds: ["item-2"],
  itemPlacements: {
    "item-2": "target-genap"
  },
  attemptsOnBoard: 2,
  wrongAttemptsOnBoard: 1,
  selectedItemId: null,
  score: 100,
  streak: 1,
  modeState: {},
  summary: {},
  updatedAt: "server-timestamp"
}
```

### Aturan pemulihan

- Gesture aktif tidak dipulihkan.
- Item yang sedang diseret kembali ke posisi asal setelah refresh.
- Penempatan benar yang sudah tercatat dipulihkan dan tetap terkunci.
- Kandidat pending dipulihkan hanya jika protokol evaluasi idempoten tersedia; jika tidak, kandidat dibatalkan tanpa penalti.
- Urutan item dan versi papan harus sama.
- Jika versi konten berubah, sesi lama dihentikan dengan alasan kompatibilitas dan tidak dipaksakan memakai papan baru.
- Timer mengikuti aturan pada `14-Mode-Permainan.md`.

## 24. Kontrak Hasil Khusus Drag & Drop

Ringkasan engine menjadi bagian dari hasil sesi umum:

```js
{
  engineSummary: {
    boardsCompleted: 3,
    itemsResolved: 18,
    totalAttempts: 22,
    wrongAttempts: 4,
    firstTryCorrect: 15,
    hintsUsed: 1,
    inputMethods: {
      drag: 12,
      tap: 6,
      keyboard: 0
    },
    averageSecondsPerResolvedItem: 5.8,
    targetErrorCounts: {
      "target-genap": 1,
      "target-ganjil": 3
    }
  }
}
```

### Aturan ringkasan

- `itemsResolved` tidak boleh melebihi jumlah item unik yang selesai.
- `wrongAttempts = totalAttempts - correctAttempts` hanya jika tidak ada status sah lain.
- Distribusi metode input digunakan untuk evaluasi UX, bukan menilai kemampuan murid.
- `targetErrorCounts` tidak boleh menyalin isi sensitif atau kunci jawaban mentah.
- Hasil final menggunakan `sessionId` yang sama untuk mencegah hadiah ganda.

## 25. Analitik Minimum

Event minimum:

| Event | Data penting |
| --- | --- |
| `dragdrop_board_presented` | session, board, version, item count, target count |
| `dragdrop_placement_evaluated` | item, target, result, input method, response-time bucket |
| `dragdrop_item_completed` | item, target, attempt bucket |
| `dragdrop_board_completed` | duration bucket, attempts, wrong attempts |
| `dragdrop_board_load_failed` | phase, error code, recoverable |

Analitik tidak perlu merekam koordinat pointer secara terus-menerus. Data gerakan mentah menambah beban dan tidak diperlukan untuk MVP.

## 26. Penanganan Error dan Kasus Batas

| Kondisi | Respons |
| --- | --- |
| Papan tidak memiliki target valid | Tolak papan dan minta pengganti |
| Kapasitas tidak cukup | Tolak papan sebelum tampil |
| Renderer konten tidak tersedia | Gunakan fallback yang aman atau ganti papan |
| Item dilepas di luar target | Kembalikan tanpa penalti |
| Target penuh menerima item | Tolak sebagai aksi tidak valid |
| Klik atau drop ganda | Proses `attemptId` pertama saja |
| Evaluator terlambat | Abaikan jika papan sudah berubah |
| Orientasi layar berubah saat drag | Batalkan gesture, pertahankan state domain |
| Gambar latar gagal dimuat | Jangan mulai papan `image_overlay` |
| Jaringan terputus | Simpan lokal dan tawarkan pemulihan |
| Tidak ada papan berikutnya | Akhiri dengan `no_content` |

Kasus khusus lain:

- Jika dua target bertumpuk karena bug layout, penempatan dibatalkan tanpa penalti.
- Jika satu sentuhan menghasilkan scroll dan drop sekaligus, hanya aksi dengan target valid yang boleh diproses.
- Jika item terpilih menjadi tidak terlihat setelah resize, pilihan dibatalkan dan fokus dikembalikan.
- Jika konten matematika gagal dirender, teks alternatif harus tersedia atau papan ditolak.

## 27. Struktur Implementasi yang Disarankan

```text
games/
  engines/
    drag-drop/
      drag-drop-engine.js
      drag-drop-state.js
      drag-drop-actions.js
      placement-evaluator.js
      board-validator.js
      drag-controller.js
      tap-controller.js
      drag-drop-renderer.js
      drag-drop-summary.js
      drag-drop.test.js
```

Kontrol pointer dipisahkan dari state domain. Perubahan library gesture tidak boleh memaksa perubahan kontrak evaluator, hasil, atau konten.

## 28. Contoh Konfigurasi Game

```json
{
  "schemaVersion": 1,
  "gameId": "kelompokkan-bilangan",
  "version": 1,
  "status": "draft",
  "title": "Kelompokkan Bilangan",
  "description": "Kelompokkan item matematika ke target yang tepat.",
  "engineType": "drag_drop",
  "engineVersion": 1,
  "education": {
    "levels": ["SD", "SMP"],
    "grades": [3, 4, 7],
    "curriculumTags": ["bilangan"]
  },
  "modes": [
    { "type": "limited_questions", "questionLimit": 10 },
    { "type": "limited_time", "timeLimitSeconds": 120 },
    { "type": "endless" }
  ],
  "content": {
    "questionSetIds": ["drag-drop-bilangan-v1"]
  },
  "engineConfig": {
    "interactionStyle": "drag_or_tap",
    "evaluationMode": "immediate",
    "wrongPlacementBehavior": "return_to_source",
    "correctPlacementBehavior": "lock_in_target",
    "itemsPerBoard": 5,
    "shuffleItems": true,
    "showTargetCapacity": true,
    "allowHint": false
  },
  "contentSource": {
    "type": "bank",
    "collection": "game_drag_drop_boards",
    "filters": {
      "status": "published",
      "topicId": "bilangan"
    }
  }
}
```

## 29. Pengujian Minimum

### Unit test

- validator menolak item, target, kapasitas, dan versi yang tidak sah;
- evaluator menerima target benar dan menolak target salah;
- `attemptId` yang sama tidak dinilai dua kali;
- drop di luar target tidak dihitung sebagai percobaan;
- target penuh menolak item tambahan;
- item benar hanya menambah progres satu kali;
- akurasi dan first-try count dihitung benar;
- checkpoint dapat diserialisasi tanpa data UI sementara.

### Integration test

- Provider, engine, Mode Controller, Scoring Service, dan Result Service bekerja bersama;
- mode batas item berhenti tepat pada target;
- mode waktu mengunci input ketika timer nol;
- refresh memulihkan papan dan penempatan yang sama;
- hasil final idempoten dan tidak memberi XP ganda;
- papan tidak kompatibel diganti atau dihentikan dengan aman.

### UI dan perangkat

- seret bekerja pada mouse dan layar sentuh;
- alternatif ketuk menghasilkan hasil yang sama;
- keyboard dapat menyelesaikan seluruh papan;
- halaman tidak scroll tak terkendali saat menyeret;
- orientasi potret dan lanskap tetap stabil;
- target dan item terbaca pada lebar 320 piksel;
- reduced motion tidak menghilangkan feedback penting;
- uji minimal pada Android kelas menengah dan browser desktop modern.

## 30. Batas MVP

MVP mencakup:

- pola satu-ke-satu dan banyak-ke-satu;
- kontrol seret, ketuk, dan keyboard;
- validasi langsung;
- item salah kembali ke sumber;
- item benar terkunci;
- layout kartu dan overlay gambar sederhana;
- konten teks, matematika sederhana, dan gambar;
- mode batas item, batas waktu, dan Endless;
- checkpoint per papan atau interval item;
- analitik dan ringkasan dasar;
- desain mobile-first dan aksesibilitas dasar.

MVP tidak mencakup:

- urutan kompleks;
- geometri bebas atau puzzle fisik;
- editor visual;
- multiplayer;
- leaderboard global;
- audio wajib;
- target tumpang tindih;
- penilaian parsial;
- konten khusus SMA.

## 31. Kriteria Siap Implementasi

Engine dianggap siap diimplementasikan jika:

- kontrak konfigurasi, papan, evaluator, state, dan hasil disepakati;
- batas antara Drag & Drop dan Puzzle jelas;
- satu papan klasifikasi SD dan satu papan pelabelan SMP tersedia sebagai fixture;
- kontrol seret dan alternatif ketuk memiliki perilaku logis yang sama;
- mapping progres mode ke item selesai disepakati;
- kebijakan kapasitas dan penempatan salah tidak ambigu;
- checkpoint tidak menyimpan state DOM atau gesture;
- daftar test MVP dapat dijalankan otomatis dan manual.

Engine dianggap siap dirilis jika seluruh kriteria di atas lolos pada perangkat target, tidak ada duplikasi skor/progres, serta murid dapat menyelesaikan papan tanpa bergantung pada gesture seret.

## 32. Contoh Game yang Dapat Dibuat

- **Kelompok Ganjil–Genap:** memindahkan bilangan ke dua kategori.
- **Pecahan Senilai:** mengelompokkan beberapa representasi pecahan.
- **Kenali Jenis Sudut:** menempatkan contoh ke kategori lancip, siku-siku, atau tumpul.
- **Bedah Lingkaran:** menaruh label jari-jari, diameter, busur, dan tali busur pada diagram.
- **Kelompok Suku Aljabar:** memindahkan suku ke kelompok sejenis.
- **Konversi Satuan:** menempatkan nilai ke hasil konversi yang tepat.

Game pertama untuk implementasi sebaiknya **Kelompok Ganjil–Genap** karena data, target, dan evaluasinya sederhana. Papan `image_overlay` baru diuji setelah layout kartu stabil.

## 33. Keputusan yang Ditetapkan

1. ID teknis engine adalah `drag_drop`.
2. Seret dan ketuk merupakan kontrol setara.
3. MVP memakai evaluasi langsung per penempatan.
4. Item salah kembali ke sumber tanpa mengurangi progres.
5. Item benar dikunci dan tidak dapat dipindahkan ulang.
6. Hubungan jawaban dinilai evaluator, bukan posisi visual.
7. Progres mode dihitung dari item yang selesai, bukan jumlah gesture.
8. Kesulitan berasal dari konsep, bukan target yang diperkecil.
9. Pointer Events dipakai untuk interaksi lintas perangkat.
10. Engine tidak menangani urutan kompleks atau puzzle spasial.
11. Fokus rilis tetap SD–SMP; SMA hanya disiapkan pada struktur.

## 34. Langkah Berikutnya

Setelah dokumen ini, rancangan dilanjutkan ke `07-Engine-Puzzle.md`. Engine Puzzle akan menetapkan mekanik penyusunan urutan, pengaturan kepingan, pemeriksaan state papan, dan bentuk tantangan yang tidak dapat diwakili oleh penempatan kategori sederhana.
