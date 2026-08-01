# Checklist Regresi

Gunakan checklist yang relevan setiap kali fitur berubah. Untuk perubahan pada
`firebase-api.js` atau `firestore.rules`, jalankan minimal bagian autentikasi, otorisasi,
dan modul yang disentuh.

## Pemeriksaan statis

- [ ] `git diff --check` tidak menghasilkan error.
- [ ] Semua file JavaScript yang berubah lolos `node --check <file>`.
- [ ] Tidak ada credential privat, service-account JSON, password, atau ID token dalam
      diff.
- [ ] Origin eksternal baru sudah dibatasi dan CSP `netlify.toml` diperbarui bila perlu.
- [ ] Perubahan field/status ditelusuri di HTML, JavaScript, Apps Script, dan Rules.

## Tampilan umum

- [ ] Halaman yang berubah diuji pada desktop dan lebar ponsel sekitar 360–400 px.
- [ ] Tidak ada overflow horizontal, modal terpotong, atau tombol tertutup.
- [ ] Loading, sukses, kosong, dan error mempunyai pesan yang masuk akal.
- [ ] Console browser tidak menampilkan error baru.

## Autentikasi dan otorisasi

- [ ] Login admin menuju `dashboard.html`.
- [ ] Login orang tua menuju `ortu-dashboard.html`.
- [ ] Login murid menuju `murid-dashboard.html`.
- [ ] Akun nonaktif ditolak.
- [ ] Pengguna yang membuka URL dashboard role lain dialihkan/ditolak.
- [ ] Orang tua tidak dapat membaca murid di luar `muridIds`, termasuk lewat DevTools.
- [ ] Murid tidak dapat membaca data keuangan atau bukti pembayaran.
- [ ] Publik hanya dapat membaca `jadwalPublik`, bukan `jadwal`.

## Murid dan akun

- [ ] Pendaftaran baru menghasilkan ID setelah counter terakhir, bukan memakai ulang ID
      nonaktif.
- [ ] Aktivasi akun membuat/menghubungkan akun orang tua dan murid yang benar.
- [ ] Satu akun orang tua dapat memilih beberapa anak bila terhubung.
- [ ] Penonaktifan mempertahankan data historis dan memutus akses akun murid.
- [ ] Aktivasi kembali memulihkan hubungan akun tanpa membuat ID baru.

## Absensi, materi, dan keuangan

- [ ] Absensi `Hadir` menaikkan `sesiTerpakai` tepat satu kali.
- [ ] `Izin` dan `Sakit` tidak menaikkan sesi.
- [ ] Materi hanya muncul untuk murid yang dituju; multi-link video/kuis tetap berfungsi.
- [ ] URL materi non-HTTPS atau domain di luar allowlist ditolak.
- [ ] Transaksi keuangan admin muncul pada orang tua yang benar.

## Bukti pembayaran

- [ ] JPG, PNG, WebP, dan PDF valid maksimal 5 MB dapat dikirim.
- [ ] Format lain, file lebih dari 5 MB, nominal invalid, atau keterangan kosong ditolak.
- [ ] Orang tua tidak dapat mengunggah bukti untuk murid lain.
- [ ] Bukti baru muncul sebagai `Menunggu konfirmasi` di portal dan admin.
- [ ] Keputusan `Diterima` membuat tepat satu transaksi keuangan.
- [ ] Keputusan `Ditolak` mewajibkan alasan dan tidak membuat transaksi.
- [ ] Bukti yang sudah diproses tidak bisa diproses ulang.
- [ ] Tautan bukti yang ditampilkan admin membuka file yang benar.

## Pengajuan jadwal

- [ ] Durasi form terkunci sesuai paket murid (60/90 menit).
- [ ] Paket biasa maksimal 1 jadwal; paket 8 maksimal 2; paket 12 maksimal 3.
- [ ] Tombol “Tambah Jadwal Baru” hanya muncul bila masih ada kuota.
- [ ] Beberapa jadwal dapat dikirim sekali, setiap baris pada hari berbeda.
- [ ] Slot di luar jam operasional dan waktu yang bukan kelipatan 15 menit ditolak.
- [ ] Slot bentrok atau tanpa jeda 15 menit ditolak.
- [ ] Slot yang baru diajukan orang tua lain ikut ditolak.
- [ ] Pengajuan menahan slot dan kuota selama 24 jam.
- [ ] Admin melihat setiap jadwal sebagai baris terpisah.
- [ ] Persetujuan membuat `jadwal`, `jadwalPublik`, slot, dan kuota yang konsisten.
- [ ] Penolakan melepaskan slot dan kuota.
- [ ] Jadwal publik berubah realtime tanpa memuat ulang halaman.
- [ ] Hapus jadwal aktif hanya membatalkan target tersebut dan membuka slot kembali.
- [ ] Hapus riwayat hanya menghapus `Ditolak`/`Dibatalkan`; `Pending`, `Disetujui`, dan
      jadwal aktif tetap ada.

## Game belajar

- [ ] Katalog tidak menampilkan semua kartu sesaat sebelum data jenjang terbaca.
- [ ] SD melihat Hitung, Toko, Detektif, dan Pecahan; tidak melihat Menara Aljabar.
- [ ] SMP melihat Hitung, Toko, Detektif, dan Menara; tidak melihat Pecahan.
- [ ] Membuka URL game jenjang lain secara langsung tetap ditolak.
- [ ] Mode terbatas berhenti pada 10 soal/kasus/lantai/misi atau kondisi nyawa game.
- [ ] Mode endless berjalan sampai pengguna memilih berhenti.
- [ ] Keypad internal berfungsi di ponsel tanpa memunculkan keyboard sistem yang tidak
      dibutuhkan.
- [ ] Statistik tersimpan pada key murid yang benar dan tampil kembali di katalog.

## Smoke test produksi

- [ ] Landing page, login, dashboard admin, portal orang tua, portal murid, dan katalog
      game dapat dibuka dari URL produksi.
- [ ] Header keamanan Netlify tidak memblokir Firebase, Google Apps Script, font, atau
      video YouTube yang memang dipakai.
- [ ] Uji satu read dan satu write aman untuk masing-masing role yang terdampak.
- [ ] Perubahan Firestore Rules dan Apps Script sudah dideploy terpisah bila file terkait
      berubah.
