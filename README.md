# Kopi Kalcer — Professional PO Storefront

Situs ini sudah punya dua jalur checkout:

- **Cash saat ambil:** membuat pesan konfirmasi yang rapi ke WhatsApp.
- **Bayar online:** membuat transaksi **Midtrans Snap** dari server, lalu pelanggan memilih QRIS, e-wallet, virtual account, atau metode yang tersedia pada akun merchant.

## Penting sebelum publikasi

GitHub Pages hanya bisa menjalankan HTML, CSS, dan JavaScript. Ia **tidak boleh** menyimpan Midtrans Server Key dan tidak bisa menerima webhook pembayaran. Karena itu folder `api/` harus dideploy sebagai backend terpisah (contoh: Vercel), sedangkan situs tetap bisa dipasang di GitHub Pages.

Jangan pernah menaruh `MIDTRANS_SERVER_KEY`, Supabase Service Role Key, PIN, atau OTP di `index.html`, `js/script.js`, atau repository GitHub.

## Yang bisa diubah paling sering

Di `js/script.js`:

```js
const CONFIG = Object.freeze({
  whatsappNumber: "6285711308141", // nomor admin, format 62...
  espressoStock: 10, // stok tampilan untuk satu sesi PO
  paymentApiUrl: "", // kosong sampai backend siap
});
```

Untuk situs GitHub Pages, ganti `paymentApiUrl` setelah backend Vercel dibuat, misalnya:

```js
paymentApiUrl: "https://kopi-kalcer-payment.vercel.app/api/create-payment",
```

Menu yang ada di `js/script.js` juga **harus sama** dengan `CATALOG` di `api/create-payment.js`. Server sengaja menghitung ulang harga dari katalog server agar pelanggan tidak dapat mengubah nominal lewat browser.

## Mengaktifkan pembayaran online dengan aman

1. **Buat akun Midtrans Sandbox** dan ambil Sandbox Server Key. Mulai dengan sandbox—jangan langsung memakai transaksi asli.
2. **Buat project Supabase.** Buka SQL Editor, lalu jalankan isi [`database/schema.sql`](database/schema.sql).
3. **Deploy folder proyek ini ke Vercel.** Endpoint yang akan tersedia adalah:
   - `https://NAMA-PROJECT.vercel.app/api/create-payment`
   - `https://NAMA-PROJECT.vercel.app/api/midtrans-webhook`
4. Di Vercel → Settings → Environment Variables, isi seluruh variabel dalam [`.env.example`](.env.example). `APP_URL` harus URL situs GitHub Pages Anda tanpa garis miring terakhir; `ALLOWED_ORIGIN` adalah origin-nya, contoh `https://simpatikabraja-oss.github.io`.
5. Di Midtrans dashboard, atur **Payment Notification URL** ke `https://NAMA-PROJECT.vercel.app/api/midtrans-webhook`.
6. Ubah `paymentApiUrl` di `js/script.js` ke URL Vercel pada langkah 3, lalu publish situs ke GitHub Pages.
7. Lakukan beberapa pembayaran **sandbox**. Pastikan transaksi terlihat di Midtrans dan baris pesanan di Supabase berubah menjadi `PAID` setelah webhook masuk.
8. Setelah semua benar, masukkan **Production Server Key** baru dan set `MIDTRANS_IS_PRODUCTION=true` di Vercel. Jangan gunakan Server Key sandbox untuk produksi.

## Alur pembayaran

```text
Pelanggan → pilih menu → isi data → pilih “Bayar online”
          → browser kirim ID menu + jumlah ke API
          → API hitung ulang harga & simpan pesanan PENDING
          → API meminta token Snap dengan Server Key rahasia
          → pelanggan membayar di halaman Midtrans
          → Midtrans mengirim webhook terverifikasi
          → API mengubah status pesanan menjadi PAID / FAILED
```

Status `PAID` berasal dari webhook Midtrans, **bukan** dari tombol “sudah bayar” pelanggan. Hal ini penting agar pesanan palsu tidak dianggap lunas.

## Refresh halaman

Saat halaman dimuat ulang, keranjang dan data pelanggan di browser dikosongkan agar sesi belanja dimulai dari awal. Refresh tidak membatalkan pesanan yang sudah tercatat di backend atau transaksi yang sudah dibuat di gateway pembayaran.

## Pemeriksaan cepat

Jalankan setelah Node.js tersedia:

```bash
npm run check
```

Untuk mengecek tampilan statis, buka `index.html` atau jalankan web server lokal sederhana. Pembayaran online baru aktif bila backend dan variabel environment sudah dipasang.

## Catatan stok

`espressoStock` saat ini membatasi keranjang pada browser. Untuk stok yang benar-benar real-time saat banyak pembeli memesan bersamaan, stok perlu dipindahkan ke database dan dikunci secara atomik di backend. Jangan mengandalkan angka di browser untuk mengendalikan stok produksi.
