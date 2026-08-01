# Aktivasi Upload Bukti Pembayaran

Folder tujuan sudah dikonfigurasi ke folder Drive privat berikut:

- Nama: `bukti_transfer`
- ID: `1Y6cZPRZ0uQI7c5lhChl5kyMS3ywpMUPH`

## 1. Membuat Web App Google Apps Script

1. Buka https://script.google.com/ menggunakan akun pemilik folder Drive.
   Akun tersebut juga harus menjadi pemilik atau anggota proyek Firebase `les-privat-kak-harris`, karena Apps Script akan mencatat metadata ke Cloud Firestore.
2. Klik **Proyek baru** dan beri nama `Upload Bukti Les Privat Kak Harris`.
3. Ganti isi `Code.gs` dengan isi file `apps-script/Code.gs` dari proyek website ini.
4. Buka **Setelan project**, aktifkan **Tampilkan file manifes appsscript.json di editor**.
5. Ganti isi `appsscript.json` dengan isi file `apps-script/appsscript.json`.
6. Klik **Deploy** → **Deployment baru**.
7. Pilih jenis **Aplikasi web**.
8. Atur **Jalankan sebagai: Saya**.
9. Atur **Siapa yang memiliki akses: Siapa saja**. Endpoint memang dapat dihubungi publik, tetapi setiap upload tetap wajib membawa Firebase ID Token yang valid dan diverifikasi oleh kode.
10. Klik **Deploy**, izinkan akses Drive, Cloud Firestore, dan koneksi eksternal, lalu salin URL yang berakhiran `/exec`.

## 2. Menghubungkan Website

1. Buka `payment-upload-config.js`.
2. Ganti `ISI_URL_WEB_APP_APPS_SCRIPT` dengan URL `/exec` dari langkah sebelumnya.
3. Deploy website dan Firestore Rules terbaru.

Perintah Firestore Rules bila Firebase CLI sudah terpasang dan login:

```bash
firebase deploy --only firestore:rules
```

## 3. Tes Wajib

1. Login sebagai orang tua dan unggah JPG/PNG/WebP/PDF maksimal 5 MB.
2. Pastikan file muncul di folder `bukti_transfer` dan folder tetap **Dibatasi**.
3. Login sebagai admin, buka menu Keuangan, lalu konfirmasi bukti.
4. Pastikan transaksi baru muncul di riwayat pembayaran orang tua.
5. Coba unggah sebagai murid atau tanpa login; permintaan harus ditolak.
