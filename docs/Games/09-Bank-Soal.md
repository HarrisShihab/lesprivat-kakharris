# Bank Soal dan Konten Game

**Proyek:** Website Les Privat Kak Harris  
**Lokasi tujuan:** `docs/Games/09-Bank-Soal.md`  
**Status:** Rancangan awal  
**Fokus rilis:** Matematika SD–SMP

## 1. Tujuan

Dokumen ini menetapkan standar penyimpanan, kurasi, validasi, pemilihan, dan pemeliharaan konten yang digunakan oleh seluruh engine game. Istilah **bank soal** dalam dokumen ini tidak hanya berarti kumpulan pertanyaan Quiz, tetapi repositori konten belajar yang dapat memuat:

- pertanyaan Quiz;
- set pasangan Matching;
- papan klasifikasi atau pelabelan Drag & Drop;
- definisi Puzzle;
- referensi generator latihan;
- definisi perjalanan Adventure;
- penjelasan, petunjuk, dan aset pendukung.

Standar bersama diperlukan agar konten dapat ditambah tanpa mengubah kode engine, satu materi dapat dipakai oleh beberapa mekanik, dan hasil sesi lama tetap dapat ditelusuri meskipun konten berkembang.

## 2. Sasaran Desain

Bank soal harus memenuhi sasaran berikut:

1. Konten dan engine tersimpan terpisah.
2. Setiap konten memiliki identitas serta versi yang stabil.
3. Konten tidak dapat diterbitkan sebelum lolos validasi.
4. Pemilihan konten mempertimbangkan jenjang, kelas, topik, kesulitan, dan riwayat sesi.
5. Urutan pemilihan dapat direproduksi menggunakan seed sesi.
6. Kunci jawaban tidak dijadikan bagian dari logika UI.
7. Satu topik dapat diolah menjadi beberapa bentuk permainan.
8. Perubahan konten tidak merusak sesi aktif atau hasil historis.
9. Penambahan SMA pada masa depan tidak memerlukan perubahan bentuk data dasar.
10. Sistem tetap realistis untuk website responsif dengan Firebase/Firestore.

## 3. Prinsip Utama

### 3.1 Engine tidak memiliki soal

Engine hanya mengetahui kontrak item yang didukungnya. Prompt, opsi, jawaban, ilustrasi, penjelasan, dan metadata materi berasal dari lapisan konten melalui Question Provider.

Soal tidak boleh ditanam langsung dalam komponen UI atau file engine, kecuali fixture khusus pengujian.

### 3.2 Konten yang diterbitkan bersifat tetap

Versi konten berstatus `published` tidak diedit di tempat. Koreksi terhadap prompt, solusi, hubungan jawaban, atau metadata pembelajaran dibuat sebagai versi baru.

Aturan ini menjaga agar:

- checkpoint dapat dipulihkan dengan konten yang sama;
- hasil sesi lama tetap dapat dijelaskan;
- analitik tidak mencampur dua bentuk soal yang berbeda;
- kesalahan konten dapat ditelusuri dan ditarik dengan aman.

### 3.3 Identitas berbeda dari versi

ID menjawab pertanyaan “konten apa ini?”, sedangkan versi menjawab “bentuk ke berapa yang digunakan?”. ID tidak berubah selama identitas pembelajarannya tetap sama.

### 3.4 Metadata adalah bagian dari kualitas

Jenjang, kelas, topik, subtopik, kesulitan, dan estimasi waktu bukan hiasan administratif. Metadata menentukan apakah sebuah konten layak diberikan kepada murid tertentu.

### 3.5 Pengacakan harus adil dan dapat dipulihkan

Question Provider menggunakan RNG berbasis seed sesi. Pemulihan checkpoint tidak boleh menghasilkan konten atau urutan opsi yang berbeda.

## 4. Batas Tanggung Jawab

### Bank soal menangani

- identitas dan versi konten;
- bentuk data konten;
- metadata pendidikan;
- status kurasi dan publikasi;
- aturan validasi konten;
- hubungan konten dengan jawaban atau solusi;
- referensi aset;
- manifest bank dan keanggotaan konten;
- penarikan versi bermasalah;
- data sumber untuk pemilihan konten.

### Bank soal tidak menangani

- state sesi aktif;
- timer dan kondisi akhir mode;
- perhitungan skor, XP, atau achievement;
- komponen tampilan;
- autentikasi murid;
- penyimpanan hasil final;
- adaptasi tingkat kesulitan selama sesi;
- keputusan penilaian langsung dari input murid.

Question Provider, Answer Evaluator, Session Manager, dan engine menggunakan bank soal, tetapi tidak menjadi bagian dari bank itu sendiri.

## 5. Jenis Konten Resmi

Nilai `contentKind` awal adalah:

| `contentKind` | Unit konten | Engine utama | ID unit |
| --- | --- | --- | --- |
| `quiz_question` | satu pertanyaan | Quiz | `questionId` |
| `matching_set` | satu set pasangan | Matching | `setId` |
| `drag_drop_board` | satu papan penempatan | Drag & Drop | `boardId` |
| `puzzle_definition` | satu puzzle | Puzzle | `puzzleId` |
| `generator_profile` | referensi generator dan batas parameter | Generated Drill | `profileId` |
| `adventure_definition` | satu perjalanan atau chapter | Adventure | `adventureId` |

`generator_profile` tidak menyimpan daftar soal hasil generasi. Ia menyimpan generator yang disetujui, versi generator, bobot, dan batas parameternya. Setiap tantangan yang dihasilkan tetap memiliki `instanceId`, seed, fingerprint, serta versi generator sesuai `04-Engine-Endless.md`.

## 6. Model Entitas Logis

Bank soal menggunakan entitas logis berikut:

| Entitas | Fungsi |
| --- | --- |
| Bank | Mengelompokkan konten untuk tujuan atau cakupan tertentu |
| Bank Version | Snapshot keanggotaan dan aturan satu versi bank |
| Content Record | Identitas, versi, metadata, dan payload satu unit konten |
| Answer Spec | Aturan jawaban yang dipakai evaluator |
| Asset Record | Metadata gambar atau media pendukung |
| Taxonomy Record | Daftar topik, subtopik, dan hubungan kurikulum |
| Review Record | Hasil pemeriksaan dan keputusan publikasi |
| Generator Profile | Konfigurasi generator terkontrol |

Bentuk koleksi Firestore, indeks, dan security rules akan ditetapkan pada `11-Database.md`. Dokumen ini menetapkan kontrak logisnya terlebih dahulu.

## 7. Kontrak Manifest Bank

Satu bank mewakili kelompok konten yang dapat digunakan oleh satu atau beberapa game.

```json
{
  "schemaVersion": 1,
  "bankId": "bilangan-bulat-smp",
  "bankVersion": 3,
  "status": "published",
  "title": "Bank Bilangan Bulat SMP",
  "description": "Konten operasi dan penerapan bilangan bulat untuk SMP.",
  "education": {
    "levels": ["SMP"],
    "grades": [7],
    "curriculum": "kurikulum-merdeka",
    "topicIds": ["bilangan-bulat"]
  },
  "supportedEngines": ["quiz", "generated_drill", "matching"],
  "contentKinds": ["quiz_question", "matching_set", "generator_profile"],
  "itemRefs": [
    {
      "contentKind": "quiz_question",
      "contentId": "bb7-add-001",
      "contentVersion": 1,
      "enabled": true
    }
  ],
  "selectionDefaults": {
    "allowedDifficulties": ["easy", "medium", "hard"],
    "avoidRecentItems": true,
    "minimumRepeatGap": 5
  },
  "publishedAt": "2026-08-05T00:00:00Z"
}
```

### Aturan manifest

- `bankId` stabil dan unik.
- `bankVersion` berupa bilangan bulat positif.
- Setiap `itemRef` menunjuk versi konten secara eksplisit.
- Satu versi bank tidak memakai referensi “versi terbaru” yang dapat berubah diam-diam.
- Semua referensi wajib tersedia dan kompatibel sebelum bank diterbitkan.
- Konten `archived` tidak boleh dimasukkan ke versi bank baru.
- Bank tidak menyimpan seluruh payload item dalam satu manifest.
- Daftar yang sangat besar dibagi atau dipaginasi pada implementasi database.

## 8. Envelope Konten Bersama

Semua jenis konten dibungkus dengan metadata bersama berikut:

```json
{
  "schemaVersion": 1,
  "contentKind": "quiz_question",
  "contentId": "bb7-add-001",
  "contentVersion": 1,
  "status": "published",
  "engineCompatibility": [
    { "engineType": "quiz", "minimumEngineVersion": 1 }
  ],
  "payload": {},
  "education": {
    "educationLevel": "SMP",
    "grades": [7],
    "curriculum": "kurikulum-merdeka",
    "topicId": "bilangan-bulat",
    "subtopicId": "penjumlahan",
    "curriculumTags": ["bilangan", "operasi-hitung"]
  },
  "difficulty": {
    "authored": "easy",
    "calibrated": null,
    "effective": "easy"
  },
  "estimatedSeconds": 30,
  "language": "id-ID",
  "assetRefs": [],
  "quality": {
    "reviewStatus": "approved",
    "reviewedBy": "admin",
    "reviewedAt": "2026-08-05T00:00:00Z"
  },
  "createdAt": "2026-08-05T00:00:00Z",
  "publishedAt": "2026-08-05T00:00:00Z"
}
```

`payload` mengikuti kontrak jenis konten pada dokumen engine masing-masing. Envelope tidak menggantikan `questionId`, `setId`, `boardId`, `puzzleId`, atau `adventureId`; ID khusus tersebut harus sama dengan `contentId`.

## 9. Aturan ID

Semua ID permanen menggunakan aturan berikut:

- huruf kecil ASCII, angka, dan tanda hubung;
- tidak menggunakan spasi;
- tidak bergantung pada judul yang dapat diedit;
- tidak memuat nama murid atau data pribadi;
- tidak digunakan ulang setelah konten diarsipkan;
- panjang praktis dan mudah ditelusuri;
- unik pada cakupan jenis kontennya.

Pola yang disarankan:

```text
<topik>-<kelas>-<subtopik>-<nomor>
```

Contoh:

```text
bb-k7-penjumlahan-001
pecahan-k5-senilai-set-001
bangun-datar-k4-klasifikasi-board-001
```

Nomor bukan indikator kesulitan atau urutan wajib. Kesulitan dan urutan disimpan sebagai metadata.

## 10. Aturan Versi

### `schemaVersion`

Naik ketika bentuk kontrak data berubah, misalnya properti wajib baru atau struktur payload yang tidak kompatibel.

### `contentVersion`

Naik ketika salah satu bagian berikut berubah:

- prompt atau instruksi yang dilihat murid;
- opsi jawaban;
- jawaban atau solusi;
- makna matematis;
- gambar yang memengaruhi jawaban;
- petunjuk atau penjelasan yang mengubah interpretasi;
- metadata kelas, topik, atau kesulitan secara material.

### `bankVersion`

Naik ketika:

- konten ditambah atau dikeluarkan;
- versi referensi konten berubah;
- aturan pemilihan default berubah;
- dukungan engine atau cakupan pendidikan berubah.

### Perubahan tanpa versi baru

Hanya metadata operasional yang tidak memengaruhi penyajian, evaluasi, pemilihan, atau interpretasi hasil yang dapat diperbarui tanpa membuat versi konten baru. Contohnya catatan internal reviewer yang tidak dikirim ke runtime.

Jika ragu, buat versi baru.

## 11. Status dan Alur Publikasi

Status resmi adalah:

```text
draft -> in_review -> approved -> published -> archived
```

Status tambahan `rejected` dapat digunakan dari tahap `in_review`.

### `draft`

Konten masih dapat diedit dan hanya terlihat oleh pembuat atau admin.

### `in_review`

Konten dibekukan sementara untuk pemeriksaan. Perubahan mengembalikan status menjadi `draft`.

### `approved`

Konten telah lolos pemeriksaan, tetapi belum masuk bank aktif.

### `published`

Konten tersedia untuk versi bank yang menerbitkannya dan tidak boleh diedit di tempat.

### `archived`

Konten tidak dipilih untuk sesi baru. Data tetap disimpan selama masih dirujuk hasil atau checkpoint historis.

### `rejected`

Konten gagal pemeriksaan dan harus memiliki alasan yang dapat ditindaklanjuti.

Publikasi bank dan publikasi konten adalah dua keputusan berbeda. Konten yang `published` belum otomatis digunakan oleh game sampai masuk ke manifest bank yang dipakai game tersebut.

## 12. Metadata Pendidikan

Metadata pendidikan minimum:

```json
{
  "educationLevel": "SMP",
  "grades": [7],
  "curriculum": "kurikulum-merdeka",
  "topicId": "bilangan-bulat",
  "subtopicId": "operasi-campuran",
  "curriculumTags": ["bilangan", "operasi-hitung"],
  "learningObjectiveIds": []
}
```

### Aturan metadata

- `educationLevel` menerima `SD`, `SMP`, atau `SMA` pada skema.
- Konten rilis awal hanya diterbitkan untuk SD dan SMP.
- `grades` menerima kelas 1–12, tetapi harus sesuai dengan `educationLevel`.
- Satu konten boleh relevan untuk beberapa kelas yang berdekatan.
- `topicId` dan `subtopicId` berasal dari Taxonomy Registry.
- Tag bebas tidak menggantikan topik utama.
- `learningObjectiveIds` bersifat opsional pada MVP dan dapat dipakai saat pemetaan tujuan pembelajaran sudah siap.

## 13. Taxonomy Registry

Taxonomy Registry mencegah variasi nama seperti `bilangan_bulat`, `bilangan-bulat`, dan `Bilangan Bulat` dianggap sebagai tiga topik berbeda.

Satu record topik minimum:

```json
{
  "topicId": "bilangan-bulat",
  "title": "Bilangan Bulat",
  "parentTopicId": "bilangan",
  "educationLevels": ["SMP"],
  "grades": [7],
  "status": "active",
  "aliases": ["operasi bilangan bulat"]
}
```

Aturan:

- ID taksonomi tidak diedit setelah digunakan;
- perubahan nama tampilan tidak mengubah ID;
- topik lama dapat diberi status `deprecated` dan diarahkan ke pengganti;
- siklus hubungan parent–child ditolak;
- filter runtime menggunakan ID, bukan label tampilan.

Pemetaan lengkap materi akan merujuk pada peta materi Kurikulum Merdeka proyek, tetapi bank soal hanya menyimpan ID yang diperlukan runtime.

## 14. Tingkat Kesulitan

Nilai resmi tetap:

```text
easy | medium | hard
```

Setiap konten menyimpan tiga nilai:

| Field | Arti |
| --- | --- |
| `authored` | Penilaian awal pembuat konten |
| `calibrated` | Hasil analitik setelah data cukup |
| `effective` | Nilai yang dipakai Question Provider |

Pada awal rilis, `calibrated` dapat bernilai `null` dan `effective` mengikuti `authored`. Kalibrasi tidak mengubah konten secara diam-diam; perubahan kesulitan efektif dicatat sebagai revisi metadata yang dapat ditelusuri.

### Pedoman awal

- `easy`: satu konsep langsung, angka sederhana, langkah sedikit, distraktor jelas;
- `medium`: memerlukan dua atau lebih langkah, representasi berbeda, atau pilihan strategi;
- `hard`: menggabungkan konsep, membutuhkan penalaran, atau memiliki distraktor berdasarkan miskonsepsi umum.

Kesulitan tidak boleh ditentukan hanya dari besar angka.

## 15. Format Konten Presentasi

Format awal yang didukung:

```text
text | math | image
```

Contoh:

```json
{
  "format": "math",
  "value": "\\frac{3}{4}",
  "notation": "latex",
  "fallbackText": "tiga per empat"
}
```

Aturan:

- HTML bebas tidak diterima;
- konten `math` harus lolos renderer dan sanitizer yang disetujui;
- gambar wajib memiliki `assetRef` dan teks alternatif;
- teks tidak mengandalkan warna saja untuk menyampaikan makna;
- satuan dan simbol harus konsisten;
- konten tetap dapat dipahami pada layar HP;
- renderer yang tidak tersedia membuat konten gagal validasi kompatibilitas.

## 16. Kontrak Pertanyaan Quiz

Payload `quiz_question` mengikuti `03-Engine-Quiz.md`:

```json
{
  "questionId": "bb7-add-001",
  "questionVersion": 1,
  "questionType": "single_choice",
  "prompt": {
    "format": "text",
    "content": "Hasil dari -8 + 13 adalah ..."
  },
  "options": [
    { "optionId": "a", "content": "-21" },
    { "optionId": "b", "content": "-5" },
    { "optionId": "c", "content": "5" },
    { "optionId": "d", "content": "21" }
  ],
  "answerSpecRef": "answer-ref-bb7-add-001-v1",
  "explanation": {
    "format": "text",
    "content": "Bergerak 13 langkah ke kanan dari -8 menghasilkan 5."
  }
}
```

Aturan khusus tipe pertanyaan tetap mengikuti dokumen Engine Quiz. Bank soal tidak membuat tipe baru tanpa dukungan Engine Registry dan Answer Evaluator.

## 17. Kontrak Answer Spec

Answer Spec disimpan sebagai data evaluasi yang terhubung ke versi konten.

### Pilihan tunggal

```json
{
  "answerSpecId": "answer-ref-bb7-add-001-v1",
  "answerSpecVersion": 1,
  "type": "single_choice",
  "correctOptionIds": ["c"]
}
```

### Benar–salah

```json
{
  "answerSpecId": "answer-ref-pernyataan-001-v1",
  "answerSpecVersion": 1,
  "type": "boolean",
  "correctValue": true
}
```

### Jawaban angka

```json
{
  "answerSpecId": "answer-ref-desimal-001-v1",
  "answerSpecVersion": 1,
  "type": "numeric",
  "acceptedValues": [2.5],
  "absoluteTolerance": 0,
  "unit": null
}
```

### Aturan Answer Spec

- Answer Spec menunjuk satu versi konten tertentu.
- `correctOptionIds` menggunakan ID, bukan posisi opsi.
- Toleransi angka harus eksplisit dan tidak dibuat otomatis oleh UI.
- Bentuk ekuivalen yang diterima dicatat secara eksplisit atau dinormalisasi evaluator.
- Unit, tanda negatif, desimal, dan pecahan mengikuti kebijakan input engine.
- Perubahan Answer Spec selalu membuat versi konten baru.
- Answer Spec tidak dikirim sebagai bagian dari projection presentasi jika evaluator dapat menjalankannya secara terpisah.

Pada MVP berbasis browser, jawaban mungkin masih dapat ditemukan dalam bundle atau respons jaringan. Pemisahan ini adalah batas arsitektur dan kemudahan migrasi, bukan klaim bahwa kunci jawaban sudah sepenuhnya rahasia.

## 18. Konten Matching

`matching_set` mengikuti kontrak pada `05-Engine-Matching.md`.

Aturan tambahan bank:

- hubungan pasangan tersimpan sebagai aturan evaluasi, bukan hasil perbandingan teks;
- item visual yang sama tetapi memiliki makna berbeda ditolak;
- satu set tidak boleh membentuk lebih dari satu pasangan sah yang tidak dicatat;
- pasangan dapat diberi tag konsep agar variasi papan tidak mengulang pola yang sama;
- pemotongan set menjadi papan lebih kecil tidak boleh menciptakan ambiguitas.

Satu pasangan dapat dikonversi menjadi pertanyaan Quiz hanya melalui proses authoring yang menghasilkan Content Record baru. Engine tidak mengubah `matching_set` menjadi Quiz secara otomatis saat runtime.

## 19. Konten Drag & Drop

`drag_drop_board` mengikuti kontrak pada `06-Engine-DragDrop.md`.

Aturan tambahan bank:

- setiap item memiliki minimal satu target yang sah;
- kapasitas target cukup untuk seluruh item yang benar;
- relasi item–target dinilai melalui Answer Spec atau rule evaluator;
- koordinat dan posisi visual tidak menjadi kunci jawaban;
- target kosong hanya diizinkan jika ditandai secara eksplisit pada versi engine yang mendukungnya;
- papan harus tetap dapat digunakan melalui alternatif ketuk.

## 20. Konten Puzzle

`puzzle_definition` mengikuti kontrak pada `07-Engine-Puzzle.md`.

Aturan tambahan bank:

- state awal terbukti dapat diselesaikan;
- semua solusi ekuivalen dicatat atau dikenali validator;
- `solutionSpec` dan `semanticValue` tidak masuk projection UI mentah;
- seed atau prosedur shuffle dapat direproduksi;
- jumlah kepingan dan aturan gerak kompatibel dengan engine version;
- hint tidak membocorkan seluruh solusi pada pemakaian pertama.

## 21. Generator Profile

Generator Profile menghubungkan game dengan Generator Registry tanpa menyimpan kode generator sebagai data konten.

```json
{
  "profileId": "bb7-penjumlahan-profile-01",
  "profileVersion": 1,
  "generatorId": "integer-addition",
  "generatorVersion": 1,
  "status": "published",
  "weight": 3,
  "allowedDifficulties": ["easy", "medium", "hard"],
  "constraints": {
    "minimumOperand": -20,
    "maximumOperand": 20,
    "allowZeroResult": true
  },
  "metadata": {
    "educationLevel": "SMP",
    "grades": [7],
    "topicId": "bilangan-bulat",
    "subtopicId": "penjumlahan"
  }
}
```

Aturan:

- `generatorId` dan `generatorVersion` wajib ada pada registry;
- constraint harus merupakan subset dari kemampuan generator;
- generator diuji dengan banyak seed sebelum profile diterbitkan;
- hasil generator harus melewati runtime validation;
- perubahan kode generator menaikkan `generatorVersion`;
- profile lama tetap dapat direproduksi selama masih dirujuk hasil historis.

## 22. Konten Adventure

`adventure_definition` mengikuti `08-Engine-Adventure.md`.

Adventure hanya menyimpan referensi ke aktivitas anak:

```json
{
  "gameRef": {
    "gameId": "quiz-bilangan-bulat",
    "version": 1
  }
}
```

Kunci jawaban dan payload penuh bank soal engine anak tidak disalin ke definisi Adventure. Saat node dimulai, Activity Adapter memuat game serta bank yang dipin oleh `gameRef`.

## 23. Asset Record

Aset visual disimpan melalui referensi, bukan data biner di dalam Content Record.

```json
{
  "assetId": "img-bangun-datar-persegi-01",
  "assetVersion": 1,
  "type": "image",
  "mimeType": "image/webp",
  "storageRef": "games/assets/bangun-datar/persegi-01.webp",
  "width": 800,
  "height": 600,
  "altText": "Persegi dengan empat sisi sama panjang.",
  "license": {
    "type": "owned",
    "source": null
  },
  "status": "published"
}
```

Aturan:

- aset wajib memiliki hak penggunaan yang jelas;
- gambar informatif wajib memiliki `altText`;
- perubahan gambar yang memengaruhi soal menaikkan versi konten dan aset;
- file hilang atau format tidak didukung membuat validasi publikasi gagal;
- aset dioptimalkan untuk jaringan seluler;
- URL sementara tidak disimpan sebagai identitas permanen.

## 24. Projection Presentasi dan Evaluasi

Question Provider membentuk dua projection dari Content Record penuh.

### Presentation Projection

Berisi data yang diperlukan engine dan UI:

- ID dan versi konten;
- prompt, opsi, item, target, atau kepingan yang ditampilkan;
- instruksi;
- metadata minimum;
- `answerSpecRef` atau token evaluasi;
- penjelasan yang baru ditampilkan sesuai aturan feedback.

### Evaluation Projection

Berisi data yang diperlukan Answer Evaluator:

- Answer Spec atau Solution Spec;
- normalisasi input;
- toleransi;
- hubungan item–target;
- solusi ekuivalen;
- versi evaluator yang diperlukan.

UI tidak boleh menentukan kebenaran dari indeks array, koordinat, warna, label CSS, atau teks yang terlihat.

## 25. Kontrak Question Provider

Question Provider menerima permintaan logis berikut:

```js
{
  gameId,
  gameVersion,
  engineType,
  bankRefs,
  educationLevel,
  grade,
  topicIds,
  subtopicIds,
  allowedDifficulties,
  contentKinds,
  requestedCount,
  sessionSeed,
  sessionCursor,
  excludeContentRefs,
  recentConceptFingerprints,
  rendererCapabilities
}
```

Provider mengembalikan:

```js
{
  bankSnapshot,
  items,
  nextCursor,
  selectionTrace,
  exhausted: false
}
```

`selectionTrace` hanya berisi informasi operasional yang aman, seperti filter dan fallback yang dipakai. Data evaluasi tidak dimasukkan.

## 26. Pipeline Pemilihan Konten

Urutan resmi:

1. Resolusi versi game dan manifest bank.
2. Ambil hanya konten berstatus `published` pada snapshot tersebut.
3. Filter kompatibilitas engine dan renderer.
4. Filter jenjang dan kelas.
5. Filter topik dan subtopik.
6. Filter kesulitan yang diizinkan.
7. Keluarkan item yang sedang ditarik atau rusak.
8. Kurangi pengulangan berdasarkan ID dan fingerprint konsep.
9. Terapkan bobot distribusi.
10. Pilih menggunakan RNG sesi.
11. Bentuk projection presentasi.
12. Validasi ulang sebelum diberikan ke engine.

Hard filter seperti jenjang, kompatibilitas, dan status tidak boleh dilonggarkan oleh fallback. Filter preferensi seperti anti-pengulangan dapat dilonggarkan secara bertahap jika pool hampir habis.

## 27. Pengacakan

Pengacakan berlaku pada:

- urutan konten;
- urutan opsi Quiz;
- urutan sisi Matching;
- urutan item Drag & Drop;
- state awal Puzzle yang memang mendukung shuffle;
- pemilihan generator berbobot.

Aturan:

- semua pengacakan menggunakan seed atau urutan final yang dapat disimpan;
- opsi dinilai berdasarkan `optionId`, bukan posisi;
- pengacakan tidak boleh menghasilkan state tidak valid;
- urutan baru tidak boleh mengubah Content Record sumber;
- refresh menggunakan state yang sama dari checkpoint.

## 28. Pencegahan Pengulangan

Provider mempertimbangkan:

- `contentId` dan `contentVersion` yang baru digunakan;
- `conceptFingerprint`;
- pola operand pada soal generatif;
- pasangan atau item yang baru tampil;
- soal yang salah dan dijadwalkan ulang;
- batas mode yang masih tersisa.

Contoh fingerprint konsep:

```text
bilangan-bulat|penjumlahan|negatif-positif|hasil-positif
```

Dua soal dengan angka berbeda tetapi pola yang sama dapat dianggap pengulangan konsep. Fingerprint tidak menggantikan ID; keduanya dipakai untuk tujuan berbeda.

## 29. Distribusi Konten

Satu konfigurasi game dapat menentukan target distribusi:

```json
{
  "distribution": {
    "difficulty": {
      "easy": 0.4,
      "medium": 0.4,
      "hard": 0.2
    },
    "subtopics": {
      "penjumlahan": 0.3,
      "pengurangan": 0.3,
      "perkalian": 0.2,
      "operasi-campuran": 0.2
    }
  }
}
```

Aturan:

- bobot bernilai nonnegatif;
- total dinormalisasi oleh validator;
- hard filter tetap lebih tinggi prioritasnya daripada target distribusi;
- sesi pendek memakai pembulatan deterministik;
- kekurangan pool dicatat, bukan disamarkan;
- adaptasi kesulitan dapat mengubah pool yang aktif, tetapi tidak mengubah metadata konten.

## 30. Strategi Fallback

Jika konten tidak cukup, provider mencoba secara berurutan:

1. mengizinkan pengulangan setelah jarak minimum yang lebih kecil;
2. menggunakan item lama yang belum tampil pada sesi aktif;
3. memakai subtopik saudara yang sudah diizinkan konfigurasi game;
4. memakai kesulitan terdekat yang sudah diizinkan;
5. meminta Generator Profile kompatibel bila game mendukungnya;
6. mengakhiri dengan `no_content` jika target tetap tidak aman dipenuhi.

Provider tidak boleh:

- memberi konten SMA kepada akun SMP;
- memberi materi di luar daftar topik game;
- memuat konten `draft`;
- mengurangi syarat kompatibilitas engine;
- membuat jawaban sendiri saat Answer Spec hilang.

## 31. Snapshot dan Sesi Aktif

Saat sesi dimulai, sistem memin versi yang diperlukan:

```json
{
  "gameId": "quiz-bilangan-bulat",
  "gameVersion": 1,
  "bankId": "bilangan-bulat-smp",
  "bankVersion": 3,
  "contentSchemaVersion": 1,
  "providerVersion": 1,
  "sessionSeed": "seed-8f2a"
}
```

Aturan:

- sesi aktif tetap memakai snapshot awal;
- publikasi bank baru hanya berlaku untuk sesi baru;
- checkpoint menyimpan ID dan versi item aktif;
- hasil final menyimpan referensi versi konten yang benar-benar digunakan;
- versi lama tidak dihapus selama masih dibutuhkan pemulihan atau audit;
- jika versi lama tidak dapat dimuat, sesi gagal secara eksplisit dan tidak mengganti soal diam-diam.

## 32. Retry Soal Salah

Soal yang dijawab salah dapat dijadwalkan ulang sesuai engineConfig.

Aturan:

- retry tidak langsung tampil pada putaran berikutnya kecuali mode khusus mengharuskan;
- ID dan versi konten tetap sama;
- urutan opsi boleh diacak ulang hanya jika kebijakan sesi mengizinkan dan state menyimpannya;
- retry dicatat terpisah dari paparan pertama;
- jawaban benar saat retry tidak menghapus catatan salah pertama;
- sistem dapat menampilkan konten berbeda dengan konsep sama sebelum retry.

## 33. Kurasi Konten

Setiap konten minimal melewati tiga lapis pemeriksaan:

### Pemeriksaan otomatis

- schema valid;
- ID dan versi unik;
- field wajib tersedia;
- Answer Spec dapat dievaluasi;
- referensi aset dan taksonomi ditemukan;
- renderer mendukung format;
- tidak ada referensi putus;
- tidak ada state mustahil yang terdeteksi validator.

### Pemeriksaan matematika

- jawaban benar;
- langkah penjelasan benar;
- notasi dan satuan konsisten;
- tidak ada solusi sah yang terlewat;
- tingkat kesulitan masuk akal;
- soal tidak ambigu.

### Pemeriksaan pembelajaran dan tampilan

- bahasa sesuai usia;
- instruksi singkat dan jelas;
- distraktor berasal dari miskonsepsi masuk akal, bukan jebakan bahasa;
- konten terbaca di HP;
- gambar memiliki teks alternatif;
- feedback membantu murid memahami kesalahan.

## 34. Checklist per Jenis Konten

### Quiz

- tepat satu jawaban untuk `single_choice`;
- opsi tidak duplikat;
- jawaban tidak bergantung pada posisi;
- format angka dapat dinormalisasi;
- penjelasan sesuai kunci.

### Matching

- semua pasangan unik;
- tidak ada hubungan silang yang sah tetapi tidak dicatat;
- kedua sisi terbaca pada HP;
- jumlah pasangan memenuhi batas engine.

### Drag & Drop

- setiap item memiliki target sah;
- kapasitas mencukupi;
- papan tetap dapat diselesaikan;
- alternatif ketuk bekerja.

### Puzzle

- state awal tidak sudah selesai;
- solusi tersedia;
- aturan gerak konsisten;
- undo atau reset tidak merusak state.

### Generated Drill

- hasil valid untuk banyak seed;
- tidak menghasilkan pembagian nol atau bentuk terlarang;
- fingerprint stabil;
- constraint sesuai kelas dan kesulitan.

### Adventure

- semua referensi game anak valid;
- minimal satu ending dapat dicapai;
- tidak menyalin Answer Spec anak;
- konten narasi tidak memuat HTML bebas.

## 35. Penanganan Konten Bermasalah

Jika kesalahan ditemukan setelah publikasi:

1. Tandai versi sebagai `suspended` pada daftar operasional pemilihan.
2. Hentikan pemberian versi tersebut untuk sesi baru.
3. Pertahankan record agar hasil lama tetap dapat ditelusuri.
4. Buat versi koreksi baru.
5. Jalankan validasi dan review ulang.
6. Terbitkan bankVersion baru yang menunjuk versi koreksi.
7. Tandai hasil terdampak jika diperlukan untuk analisis.

`suspended` adalah status operasional darurat, bukan pengganti alur versi. Sesi aktif yang belum menampilkan item tersebut harus melewatinya. Jika item sudah aktif, kebijakan sesi menentukan apakah item dibatalkan tanpa penalti atau sesi dihentikan dengan alasan yang jelas.

## 36. Impor dan Authoring

MVP dapat menggunakan file JSON tervalidasi sebagai sumber authoring sebelum dashboard pengelolaan konten tersedia.

Alur yang disarankan:

```text
Tulis draft -> Validasi lokal -> Review matematika -> Review tampilan
-> Setujui -> Publikasikan konten -> Publikasikan manifest bank
```

Aturan impor:

- impor memiliki mode dry run;
- error satu item tidak boleh membuat item tersebut terbit;
- hasil impor mencatat jumlah berhasil, gagal, dan dilewati;
- operasi ulang dengan ID serta versi sama harus idempoten;
- konflik versi ditolak, bukan ditimpa;
- data produksi tidak diedit melalui skrip ad hoc tanpa log perubahan.

## 37. Struktur File Authoring yang Disarankan

```text
games/
└── content/
    ├── schemas/
    │   ├── bank.schema.json
    │   ├── quiz-question.schema.json
    │   ├── matching-set.schema.json
    │   ├── drag-drop-board.schema.json
    │   ├── puzzle.schema.json
    │   └── generator-profile.schema.json
    ├── taxonomy/
    │   └── mathematics-topics.json
    ├── banks/
    │   ├── sd/
    │   └── smp/
    ├── answers/
    ├── assets/
    ├── validators/
    └── fixtures/
```

Folder `answers/` adalah pemisahan struktur authoring. Ia tidak berarti file tersebut otomatis aman jika seluruh folder dipublikasikan ke browser.

## 38. Validasi Schema dan Semantik

Validasi dibagi menjadi:

### Schema validation

Memeriksa tipe data, properti wajib, enum, rentang, dan bentuk referensi.

### Referential validation

Memeriksa bahwa Answer Spec, aset, taksonomi, bank, game, dan engine version ditemukan.

### Semantic validation

Memeriksa kebenaran hubungan dan keadaan, misalnya:

- hanya satu opsi benar pada pilihan tunggal;
- nilai angka dapat dibandingkan evaluator;
- semua item Drag & Drop memiliki target;
- Puzzle dapat diselesaikan;
- graf Adventure mencapai ending;
- generator tidak menghasilkan keadaan terlarang.

### Presentation validation

Memeriksa panjang, renderer, alt text, ukuran papan, dan keterbacaan mobile.

Semua lapisan wajib lolos sebelum status `published`.

## 39. Error Resmi

Kode awal:

| Kode | Arti |
| --- | --- |
| `CONTENT_SCHEMA_INVALID` | Bentuk konten tidak sah |
| `CONTENT_REFERENCE_MISSING` | Referensi tidak ditemukan |
| `CONTENT_ENGINE_INCOMPATIBLE` | Engine tidak mendukung konten |
| `CONTENT_RENDERER_UNAVAILABLE` | Format tidak dapat ditampilkan |
| `CONTENT_ANSWER_SPEC_INVALID` | Aturan jawaban tidak dapat dievaluasi |
| `CONTENT_AMBIGUOUS` | Lebih dari satu interpretasi tidak tertangani |
| `CONTENT_SUSPENDED` | Konten ditarik dari pemilihan |
| `CONTENT_EXHAUSTED` | Pool aman tidak cukup |
| `CONTENT_VERSION_CONFLICT` | Versi yang sama memiliki data berbeda |
| `CONTENT_SNAPSHOT_UNAVAILABLE` | Snapshot sesi tidak dapat dimuat |

Error internal tidak ditampilkan mentah kepada murid. UI memberi pesan sederhana dan menawarkan pemulihan atau keluar tanpa penalti jika kesalahan berasal dari konten.

## 40. Keamanan dan Integritas

- Murid hanya dapat membaca projection konten yang diperlukan sesi.
- Data authoring dan review hanya dapat diubah oleh role yang diizinkan.
- ID murid tidak disimpan di Content Record.
- Answer Spec tidak dipercaya hanya karena disembunyikan oleh UI.
- Hasil evaluasi yang bernilai hadiah harus mengikuti batas integritas pada arsitektur.
- Input teks dan matematika disanitasi.
- HTML bebas dan kode eksekusi ditolak.
- Operasi publikasi serta penarikan konten dicatat.
- Versi yang sudah dipakai hasil tidak boleh dihapus sembarangan.

Security rules dan lokasi evaluasi akan dirinci dalam `11-Database.md`.

## 41. Performa dan Pemuatan

Prinsip awal:

- katalog game hanya memuat metadata ringkas;
- bank tidak diunduh seluruhnya saat daftar game dibuka;
- provider memuat batch kecil sesuai kebutuhan sesi;
- aset diprefetch hanya untuk item yang segera digunakan;
- Answer Spec tidak dibundel ke daftar katalog;
- query memakai field terindeks yang ditetapkan pada desain database;
- item yang sudah divalidasi dapat dicache berdasarkan ID dan versi;
- cache tidak mengganti snapshot versi secara diam-diam.

## 42. Analitik Kualitas Konten

Bank soal menyediakan identitas yang diperlukan analitik, sedangkan event detail ditetapkan pada `15-Analitik.md`.

Metrik minimum per versi konten:

- jumlah paparan;
- jumlah jawaban atau penyelesaian;
- akurasi percobaan pertama;
- akurasi setelah retry;
- median waktu respons;
- rasio skip atau abandon;
- penggunaan hint;
- distribusi opsi yang dipilih;
- laporan konten bermasalah;
- perbedaan performa antar kelas yang relevan.

Data digunakan untuk menemukan soal terlalu mudah, terlalu sulit, ambigu, atau memiliki distraktor tidak berfungsi. Analitik tidak mengubah jawaban atau versi konten otomatis.

## 43. Pengujian Minimum

### Unit test

- validator setiap `contentKind`;
- aturan ID dan versi;
- normalisasi Answer Spec;
- filter jenjang dan kelas;
- distribusi berbobot;
- anti-pengulangan;
- fallback;
- projection presentasi tidak memuat field evaluasi mentah.

### Contract test

- setiap payload diterima engine yang dituju;
- renderer mendukung seluruh format terbit;
- evaluator menerima setiap Answer Spec;
- manifest hanya menunjuk referensi sah;
- checkpoint dapat memuat versi item yang sama.

### Content test

- fixture valid untuk setiap tipe;
- fixture invalid untuk setiap error utama;
- soal angka dengan negatif, nol, desimal, dan batas panjang;
- set Matching ambigu;
- papan Drag & Drop dengan kapasitas kurang;
- Puzzle tanpa solusi;
- generator dengan seed batas;
- Adventure dengan referensi anak putus.

### Integration test

- sesi baru memakai bankVersion terbaru yang diizinkan;
- sesi aktif tetap memakai snapshot lama setelah publikasi;
- konten suspended tidak dipilih lagi;
- hasil menyimpan ID dan versi yang tepat;
- retry tidak menghilangkan percobaan awal;
- kehabisan pool menghasilkan `no_content` yang aman.

## 44. Batas MVP

MVP bank soal mencakup:

- konten SD–SMP;
- `quiz_question` sebagai prioritas implementasi pertama;
- `single_choice`, `true_false`, dan `numeric_input`;
- manifest bank berversi;
- metadata jenjang, kelas, topik, subtopik, dan kesulitan;
- status `draft`, `in_review`, `approved`, `published`, dan `archived`;
- validasi otomatis melalui schema dan validator semantik dasar;
- pemilihan deterministik dan anti-pengulangan;
- pemisahan Presentation Projection dan Evaluation Projection;
- impor JSON tervalidasi;
- pelaporan error konten minimum.

Belum termasuk MVP:

- dashboard authoring visual penuh;
- kolaborasi review real-time;
- soal esai bebas;
- penilaian jawaban berbasis AI;
- audio atau video interaktif;
- lokalisasi banyak bahasa;
- kalibrasi otomatis penuh;
- konten SMA yang diterbitkan;
- marketplace bank soal;
- editor rumus visual khusus.

Kontrak Matching, Drag & Drop, Puzzle, Generator Profile, dan Adventure tetap didefinisikan agar implementasi tahap berikutnya tidak mengubah fondasi.

## 45. Kriteria Siap Implementasi

Bank soal dianggap siap diimplementasikan jika:

1. Jenis konten dan envelope bersama telah disepakati.
2. Aturan ID, versi, status, dan snapshot tidak ambigu.
3. Metadata pendidikan memakai Taxonomy Registry.
4. Kontrak Answer Spec mendukung tipe Quiz MVP.
5. Question Provider memiliki pipeline filter, pemilihan, dan fallback yang jelas.
6. Published version tidak diedit di tempat.
7. Sesi aktif dapat memin versi bank dan konten.
8. Konten bermasalah dapat ditarik tanpa menghapus sejarah.
9. Validator memiliki fixture valid dan invalid.
10. Engine tidak membaca bank atau kunci jawaban langsung dari UI.
11. Struktur siap menerima kelas 10–12 tanpa menerbitkan konten SMA sekarang.

## 46. Keputusan yang Ditetapkan

1. Bank soal menjadi repositori konten lintas engine.
2. Unit konten berbeda menurut mekanik, tetapi memakai metadata dan lifecycle bersama.
3. Versi `published` bersifat immutable.
4. Manifest bank selalu memin versi konten eksplisit.
5. Status publikasi konten tidak otomatis memasukkannya ke game.
6. Question Provider menjadi satu-satunya jalur runtime dari bank ke engine.
7. Presentation Projection dipisahkan dari Evaluation Projection.
8. Pemisahan Answer Spec pada MVP bukan jaminan kerahasiaan bila evaluasi masih di browser.
9. Pemilihan memakai seed sesi, hard filter, distribusi, dan anti-pengulangan.
10. Jenjang dan kompatibilitas tidak boleh dilonggarkan oleh fallback.
11. Kesulitan authored dan calibrated disimpan terpisah.
12. Konten yang salah ditarik, diperbaiki sebagai versi baru, dan tidak dihapus dari sejarah.
13. Authoring awal memakai JSON tervalidasi; dashboard visual dapat dibuat setelah sistem stabil.
14. SMA disiapkan pada skema, tetapi konten rilis tetap SD–SMP.

## 47. Langkah Berikutnya

Setelah standar bank soal selesai, dokumentasi dilanjutkan ke `10-UI-UX.md`. Dokumen tersebut harus menetapkan struktur layar, komponen bersama, responsivitas mobile, feedback, aksesibilitas, loading, error state, serta konsistensi interaksi seluruh engine tanpa mencampurkan logika penilaian ke lapisan tampilan.
