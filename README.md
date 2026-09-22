# Kopi Kalcer — web PO

Struktur filenya dipisah, gak digabung jadi satu:

```
kopi-kalcer/
├── index.html          <- isi halaman
├── css/style.css       <- semua tampilan & warna
├── js/script.js        <- menu, harga, keranjang, validasi, link WhatsApp
└── img/                <- foto menu (sekarang masih bingkai kosong)
```

Buka webnya: klik dua kali `index.html`.

---

## 1. Ganti foto menu

Foto yang ada sekarang cuma bingkai sementara. Cara gantinya:

1. Siapkan foto, bentuknya **kotak (1:1)** biar pas.
2. Ganti nama fotonya persis kayak nama file di bawah.
3. Timpa file lama di folder `img/`.

| File yang diganti                | Buat menu               |
| -------------------------------- | ----------------------- |
| `img/americano-melongo.jpg`      | Americano Melongo       |
| `img/long-black-bikin-melek.jpg` | Long Black Bikin Melek  |
| `img/butterscotch.jpg`           | Butterscotch            |
| `img/surent.jpg`                 | SUREN'T                 |
| `img/hazelnut-cenat-cenut.jpg`   | Hazelnut Cenat Cenut    |
| `img/caramel-ora-ngomel.jpg`     | Caramel Ora Ngomel      |
| `img/coklat-anti-bete.jpg`       | Coklat Anti Bete        |
| `img/red-velvet-bikin-awet.jpg`  | Red Velvet Bikin Awet   |
| `img/matcha-ceria.jpg`           | Matcha Ceria            |
| `img/hero.jpg`                   | Foto besar di paling atas |
| `img/suasana.jpg`                | Cadangan, belum dipakai |

Nama filenya harus sama persis (huruf kecil semua, pakai tanda `-`).
Kalau fotonya belum ada, bingkainya otomatis nulis "Foto menyusul" —
jadi webnya tetap rapi, gak muncul gambar rusak.

---

## 2. Ganti nomor WhatsApp

Buka `js/script.js`, baris paling atas:

```js
const NOMOR_WA = "6285711308141";
```

Formatnya harus `62...`, tanpa tanda `+`, tanpa spasi, tanpa `-`.

---

## 3. Ganti sisa stok espresso

Masih di `js/script.js`:

```js
const SISA_SHOT = 10;
```

Angka ini yang bikin total pesanan varian kopi gak bisa lewat dari stok.
Kalau minggu depan stoknya beda, tinggal ganti angkanya.

---

## 4. Tambah / ubah menu & harga

Masih di `js/script.js`, bagian `const MENU`. Satu menu bentuknya gini:

```js
{
  id: "matcha-ceria",          // dipakai sistem, jangan pakai spasi
  nama: "Matcha Ceria",        // yang tampil di web
  harga: 13000,                // angka aja, tanpa titik
  foto: "img/matcha-ceria.jpg",
  desc: "Matcha susu yang segar, pahit-manisnya seimbang.",
},
```

Mau nambah menu baru? Copy satu blok itu, tempel di bawahnya, ganti isinya,
terus taruh fotonya di `img/` sesuai nama yang kamu tulis.

Menu kopi masuk ke `MENU.kopi`, yang non-kopi ke `MENU.nonkopi`.

---

## 5. Alur pesanan

1. Pembeli pilih minuman pakai tombol **Tambah / + / −**.
2. Pesanan langsung muncul di struk sebelah kanan.
3. Pembeli isi biodata: nama, kelas, nomor WhatsApp.
4. Tombol **Pesan lewat WhatsApp** masih terkunci (ada gembok) selama
   biodata belum lengkap atau keranjang masih kosong.
5. Kalau dipencet pas belum lengkap, kolom yang kurang jadi merah dan
   muncul peringatan — pesanan gak akan terkirim.
6. Begitu lengkap, tombolnya kebuka. Dipencet → WhatsApp kebuka dengan
   teks pesanan yang udah jadi, pembeli tinggal tekan kirim.

Contoh teks yang masuk ke WhatsApp kamu:

```
Halo Kopi Kalcer! Aku mau PO buat hari Kamis ya

== BIODATA ==
Nama   : Rangga Saputra
Kelas  : 11G
No. WA : 081234567890
Ambil  : Pas istirahat ke-2 di kelas 11G
Catatan: es dikit aja

== PESANAN ==
1. Americano Melongo x2 = Rp20.000
2. Matcha Ceria x1 = Rp13.000

Total 3 item = Rp33.000

Bayar cash pas ambil. Makasih, lekk!
```

---

## Catatan

- Butuh internet buat buka WhatsApp dan muat font.
- Nomor tujuan harus nomor yang aktif WhatsApp-nya.
- Pesanan **belum otomatis tercatat** di mana-mana. Web ini cuma bantu
  nyusun pesanan rapi; yang jadi catatan resmi tetap chat WhatsApp kamu.
- Isi keranjang tersimpan di browser pembeli, jadi gak hilang kalau
  halamannya ke-refresh.
