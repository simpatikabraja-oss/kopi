"use strict";

/* =========================================================
   Kopi Kalcer — script.js

   YANG GAMPANG DIUBAH ADA DI 3 BARIS DI BAWAH INI:
   - NOMOR_WA   : nomor WhatsApp penerima pesanan (format 62..., tanpa + dan spasi)
   - SISA_SHOT  : sisa shot espresso buat varian kopi
   - MENU       : daftar minuman + harga + nama file foto
   ========================================================= */

const NOMOR_WA = "6285711308141";
const SISA_SHOT = 10;

const MENU = {
  kopi: [
    {
      id: "americano-melongo",
      nama: "Americano Melongo",
      harga: 10000,
      foto: "img/americano-melongo.jpg",
      desc: "Hitam, tajam, langsung melek sampai jam pulang.",
      rating: 4.7,
      jumlahRating: 48,
      detail:
        "Espresso ditambah air panas, tanpa gula, tanpa embel-embel. Buat yang mager basa-basi dan pengin pahitnya kerasa jujur. Paling pas diminum anget pas baru duduk di kelas, biar ngantuknya ilang duluan sebelum pelajaran mulai.",
    },
    {
      id: "long-black-bikin-melek",
      nama: "Long Black Bikin Melek",
      harga: 12000,
      foto: "img/long-black-bikin-melek.jpg",
      desc: "Espresso yang dituang ke air panas. Pahitnya pas.",
      rating: 4.6,
      jumlahRating: 35,
      detail:
        "Beda tipis sama Americano: di sini espresso-nya yang dituang belakangan di atas air panas, jadi crema-nya lebih kejaga dan aromanya lebih nendang pas diseruput pertama. Pahitnya masih ramah buat yang baru mulai belajar minum kopi item.",
    },
    {
      id: "butterscotch",
      nama: "Butterscotch",
      harga: 15000,
      foto: "img/butterscotch.jpg",
      desc: "Manis gurih ala karamel mentega, dingin dan creamy.",
      rating: 4.9,
      jumlahRating: 52,
      detail:
        "Espresso ketemu susu creamy plus sirup butterscotch yang manis gurih kayak permen karamel mentega. Dingin, creamy, gampang abis. Pilihan aman kalau lagi pengin ngopi tapi belum siap sama pahit-pahit banget.",
    },
    {
      id: "surent",
      nama: "SUREN'T",
      harga: 15000,
      foto: "img/surent.jpg",
      desc: "Racikan khas Kopi Kalcer yang cuma ada di sini.",
      rating: 5.0,
      jumlahRating: 29,
      detail:
        "Racikan rahasia ala Kopi Kalcer, gak bakal ketemu di kedai manapun selain sini. Perpaduan rasanya dibikin coba-coba sampai ketemu takaran paling pas. Wajib dicoba minimal sekali biar ngerti kenapa namanya bisa jadi legend di kelas 11G.",
    },
    {
      id: "hazelnut-cenat-cenut",
      nama: "Hazelnut Cenat Cenut",
      harga: 15000,
      foto: "img/hazelnut-cenat-cenut.jpg",
      desc: "Wangi kacang hazelnut, lembut, gampang disukai.",
      rating: 4.8,
      jumlahRating: 41,
      detail:
        "Wangi kacang hazelnut langsung nempel begitu gelasnya dibuka. Rasanya lembut, manisnya pas, cocok buat yang suka kopi tapi gak mau rasa yang terlalu galak. Nama 'cenat cenut'-nya soal nagihnya, bukan soal bikin pusing.",
    },
    {
      id: "caramel-ora-ngomel",
      nama: "Caramel Ora Ngomel",
      harga: 15000,
      foto: "img/caramel-ora-ngomel.jpg",
      desc: "Karamel manis buat hari yang bikin pengin ngomel.",
      rating: 4.7,
      jumlahRating: 37,
      detail:
        "Karamel manis yang creamy, dipadu espresso biar gak eneg pas negukin sampai habis. Cocok diminum pas lagi kesel abis ditegur guru atau numpuk tugas — dijamin emosinya turun dikit-dikit.",
    },
  ],
  nonkopi: [
    {
      id: "coklat-anti-bete",
      nama: "Coklat Anti Bete",
      harga: 13000,
      foto: "img/coklat-anti-bete.jpg",
      desc: "Coklat kental dingin, aman buat yang anti kafein.",
      rating: 4.8,
      jumlahRating: 44,
      detail:
        "Coklat kental dingin, full susu, tanpa kafein sama sekali. Aman buat yang sensitif kafein atau lagi gak mau ngopi tapi tetap pengin sesuatu yang enak digenggam. Kentalnya pas, gak terlalu cair, gak bikin enek.",
    },
    {
      id: "red-velvet-bikin-awet",
      nama: "Red Velvet Bikin Awet",
      harga: 13000,
      foto: "img/red-velvet-bikin-awet.jpg",
      desc: "Manis lembut warna merah, favorit yang cepat habis.",
      rating: 4.9,
      jumlahRating: 56,
      detail:
        "Manis lembut warna merah muda yang estetik, sekilas kerasa vanilla di ujung tegukan. Ini yang paling sering ludes duluan tiap PO dibuka, jadi kalau naksir buruan checkout sebelum kehabisan.",
    },
    {
      id: "matcha-ceria",
      nama: "Matcha Ceria",
      harga: 13000,
      foto: "img/matcha-ceria.jpg",
      desc: "Matcha susu yang segar, pahit-manisnya seimbang.",
      rating: 4.6,
      jumlahRating: 30,
      detail:
        "Matcha asli dicampur susu segar, pahit-manisnya seimbang, gak terlalu 'jamu' kayak matcha abal-abal. Seger diminum siang-siang pas istirahat, cocok buat balikin mood yang lagi drop.",
    },
  ],
};

/* ========================= util ========================= */

const semuaMenu = [...MENU.kopi, ...MENU.nonkopi];
const cariMenu = (id) => semuaMenu.find((m) => m.id === id);
const idKopi = MENU.kopi.map((m) => m.id);

const rupiah = (angka) => "Rp" + angka.toLocaleString("id-ID");
const el = (sel) => document.querySelector(sel);

let keranjang = {}; // { idMenu: jumlah }
let itemAktif = null; // id menu yang lagi kebuka di modal detail
let timerToast;

/* ==================== rating (bintang) =================== */

function bintangHTML(rating) {
  const persen = Math.max(0, Math.min(100, (rating / 5) * 100));
  return `
    <span class="rating">
      <span class="rating-dasar">★★★★★</span>
      <span class="rating-isi" style="width:${persen}%">★★★★★</span>
    </span>
  `;
}

function ratingHTML(item) {
  return `
    <div class="kartu-rating" aria-label="Rating ${item.rating} dari 5, ${item.jumlahRating} penilaian">
      ${bintangHTML(item.rating)}
      <span class="rating-angka">${item.rating.toFixed(1)}</span>
      <span class="rating-jumlah">(${item.jumlahRating})</span>
    </div>
  `;
}

function toast(pesan) {
  const kotak = el("#toast");
  clearTimeout(timerToast);
  kotak.textContent = pesan;
  kotak.classList.add("tampil");
  timerToast = setTimeout(() => kotak.classList.remove("tampil"), 3200);
}

/* ===================== render menu ====================== */

function kartuHTML(item) {
  return `
    <article class="kartu" data-kartu="${item.id}">
      <div class="kartu-foto" data-aksi="detail" data-id="${item.id}"
           role="button" tabindex="0" aria-label="Lihat detail ${item.nama}">
        <img src="${item.foto}" alt="${item.nama}" loading="lazy"
             onerror="this.parentElement.classList.add('is-empty'); this.remove();">
        <span class="kartu-harga">${rupiah(item.harga)}</span>
      </div>

      <div class="kartu-isi">
        <h4>${item.nama}</h4>
        ${ratingHTML(item)}
        <p>${item.desc}</p>

        <button type="button" class="kartu-detail-link" data-aksi="detail" data-id="${item.id}">
          Lihat detail &amp; rating &rarr;
        </button>

        <div class="stepper">
          <button type="button" data-aksi="kurang" data-id="${item.id}"
                  aria-label="Kurangi ${item.nama}">−</button>
          <span class="stepper-jumlah" data-jumlah="${item.id}">0</span>
          <button type="button" data-aksi="tambah" data-id="${item.id}"
                  aria-label="Tambah ${item.nama}">+</button>
          <button type="button" class="stepper-tambah" data-aksi="tambah" data-id="${item.id}">
            Tambah
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderMenu() {
  el("#grid-kopi").innerHTML = MENU.kopi.map(kartuHTML).join("");
  el("#grid-nonkopi").innerHTML = MENU.nonkopi.map(kartuHTML).join("");
}

/* ==================== keranjang ========================= */

function totalShotKopi(kecuali) {
  return idKopi.reduce(
    (jml, id) => jml + (id === kecuali ? 0 : keranjang[id] || 0),
    0,
  );
}

function ubahJumlah(id, selisih) {
  const sekarang = keranjang[id] || 0;
  let baru = sekarang + selisih;

  if (baru < 0) baru = 0;
  if (baru > 20) baru = 20;

  if (selisih > 0 && idKopi.includes(id)) {
    const sisa = SISA_SHOT - totalShotKopi(id);
    if (baru > sisa) {
      baru = Math.max(sekarang, sisa);
      toast(
        `Varian kopi cuma sisa ${SISA_SHOT} shot espresso. Sisanya ambil menu non-kopi ya.`,
      );
    }
  }

  if (baru === 0) delete keranjang[id];
  else keranjang[id] = baru;

  perbarui();
}

function isiKeranjang() {
  return Object.entries(keranjang).map(([id, jumlah]) => {
    const item = cariMenu(id);
    return { ...item, jumlah, subtotal: item.harga * jumlah };
  });
}

function totalHarga() {
  return isiKeranjang().reduce((jml, i) => jml + i.subtotal, 0);
}

function totalItem() {
  return Object.values(keranjang).reduce((jml, n) => jml + n, 0);
}

/* ================== modal detail menu ==================== */

function bukaDetail(id) {
  const item = cariMenu(id);
  if (!item) return;

  itemAktif = id;

  const bungkusFoto = el(".detail-foto");
  const foto = el("#detail-foto");

  bungkusFoto.classList.remove("is-empty");
  foto.src = item.foto;
  foto.alt = item.nama;

  el("#detail-kategori").textContent = idKopi.includes(id)
    ? "Serial kopi"
    : "Anti kopi? bisa";
  el("#detail-nama").textContent = item.nama;
  el("#detail-harga").textContent = rupiah(item.harga);
  el("#detail-penjelasan").textContent = item.detail || item.desc;
  el("#detail-rating").innerHTML = ratingHTML(item);

  perbaruiJumlahDetail();

  const modal = el("#detail-modal");
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

function tutupDetail() {
  const modal = el("#detail-modal");
  if (modal.open) modal.close();
}

function perbaruiJumlahDetail() {
  if (!itemAktif) return;

  const jumlah = keranjang[itemAktif] || 0;
  el("#detail-jumlah").textContent = jumlah;
  el("#detail-kurang").disabled = jumlah === 0;
}

function tambahDariDetail() {
  if (!itemAktif) return;

  const item = cariMenu(itemAktif);
  const sebelum = keranjang[itemAktif] || 0;

  ubahJumlah(itemAktif, 1);

  // kalau jumlahnya gak nambah (misal stok kopi udah abis), biarin modal
  // tetap kebuka soalnya toast peringatan dari ubahJumlah() udah muncul
  if ((keranjang[itemAktif] || 0) > sebelum) {
    toast(`${item.nama} ditambahin ke pesanan ✅`);
    tutupDetail();
  }
}

/* ================== tampilan & struk ==================== */

function perbarui() {
  // angka di tiap kartu
  semuaMenu.forEach((item) => {
    const kotak = document.querySelector(`[data-jumlah="${item.id}"]`);
    if (!kotak) return;

    const jumlah = keranjang[item.id] || 0;
    kotak.textContent = jumlah;

    const kartu = document.querySelector(`[data-kartu="${item.id}"]`);
    kartu.classList.toggle("dipilih", jumlah > 0);

    kartu.querySelector('[data-aksi="kurang"]').disabled = jumlah === 0;
  });

  // struk
  const isi = isiKeranjang();
  const baris = el("#struk-lines");

  if (isi.length === 0) {
    baris.innerHTML =
      '<p class="struk-empty">Belum ada pesanan. Pilih minuman di menu atas dulu.</p>';
  } else {
    baris.innerHTML = isi
      .map(
        (i) => `
        <div class="struk-baris">
          <span>${i.nama}<br>${i.jumlah} x ${rupiah(i.harga)}</span>
          <b>${rupiah(i.subtotal)}</b>
        </div>`,
      )
      .join("");
  }

  el("#struk-total").textContent = rupiah(totalHarga());

  // bar mengambang + badge topbar
  const jumlahItem = totalItem();
  const cartbar = el("#cartbar");

  el("#cartbar-count").textContent = `${jumlahItem} item`;
  el("#cartbar-total").textContent = rupiah(totalHarga());

  cartbar.hidden = jumlahItem === 0;
  cartbar.classList.toggle("tampil", jumlahItem > 0);
  document.body.classList.toggle("ada-cartbar", jumlahItem > 0);

  const badge = el("#topbar-count");
  badge.textContent = jumlahItem;
  badge.hidden = jumlahItem === 0;

  perbaruiTombol();
  perbaruiJumlahDetail();
}

/* ==================== validasi ========================== */

function rapikanNomor(mentah) {
  let angka = String(mentah).replace(/\D/g, "");
  if (angka.startsWith("0")) angka = "62" + angka.slice(1);
  else if (angka.startsWith("8")) angka = "62" + angka;
  return angka;
}

function cekBiodata() {
  const masalah = {};

  const nama = el("#nama").value.trim();
  const kelas = el("#kelas").value.trim();
  const wa = el("#wa").value.trim();

  if (nama.length < 3) masalah.nama = "Tulis nama lengkapmu dulu ya.";

  if (kelas.length < 2) masalah.kelas = "Kelasnya diisi, contoh: 11G.";

  if (wa.length === 0) {
    masalah.wa = "Nomor WhatsApp wajib diisi.";
  } else if (!/^62\d{8,13}$/.test(rapikanNomor(wa))) {
    masalah.wa = "Nomornya belum valid. Contoh: 081234567890.";
  }

  return { masalah, valid: Object.keys(masalah).length === 0 };
}

function tampilkanError(masalah) {
  ["nama", "kelas", "wa"].forEach((nama) => {
    const kotak = el(`#${nama}`).closest(".field");
    const teks = el(`#error-${nama}`);

    if (masalah[nama]) {
      kotak.classList.add("salah");
      teks.textContent = masalah[nama];
    } else {
      kotak.classList.remove("salah");
      teks.textContent = "";
    }
  });
}

function perbaruiTombol() {
  const tombol = el("#btn-order");
  const hint = el("#order-hint");

  const adaPesanan = totalItem() > 0;
  const biodataOke = cekBiodata().valid;
  const siap = adaPesanan && biodataOke;

  tombol.classList.toggle("is-locked", !siap);
  hint.classList.toggle("siap", siap);

  if (siap) {
    hint.textContent = "Siap! Pesananmu bakal kebuka di WhatsApp Kopi Kalcer.";
  } else if (!adaPesanan && !biodataOke) {
    hint.textContent = "Lengkapi biodata dan pilih minimal 1 minuman dulu ya.";
  } else if (!adaPesanan) {
    hint.textContent = "Biodata aman. Tinggal pilih minumannya di menu atas.";
  } else {
    hint.textContent = "Pesanan aman. Tinggal lengkapi biodatanya.";
  }
}

/* =================== kirim ke WhatsApp ================== */

function susunPesan() {
  const nama = el("#nama").value.trim();
  const kelas = el("#kelas").value.trim();
  const wa = el("#wa").value.trim();
  const ambil = el("#ambil").value;
  const catatan = el("#catatan").value.trim();

  const isi = isiKeranjang();

  const daftar = isi
    .map(
      (i, urut) =>
        `${urut + 1}. ${i.nama} x${i.jumlah} = ${rupiah(i.subtotal)}`,
    )
    .join("\n");

  const teks = [
    "Halo Kopi Kalcer! Aku mau PO buat hari Kamis ya ☕",
    "",
    "== BIODATA ==",
    `Nama   : ${nama}`,
    `Kelas  : ${kelas}`,
    `No. WA : ${wa}`,
    `Ambil  : ${ambil}`,
    catatan ? `Catatan: ${catatan}` : "Catatan: -",
    "",
    "== PESANAN ==",
    daftar,
    "",
    `Total ${totalItem()} item = ${rupiah(totalHarga())}`,
    "",
    "Bayar cash pas ambil. Makasih, lekk! 🤎",
  ].join("\n");

  return teks;
}

function kirimPesanan() {
  const { masalah, valid } = cekBiodata();
  const adaPesanan = totalItem() > 0;

  // ---- di sini user dihalangi kalau belum lengkap ----
  if (!valid) {
    tampilkanError(masalah);
    toast("Isi biodatanya dulu ya sebelum pesan.");

    const pertama = ["nama", "kelas", "wa"].find((n) => masalah[n]);
    const input = el(`#${pertama}`);
    input.scrollIntoView({ block: "center", behavior: "smooth" });
    input.focus({ preventScroll: true });
    return;
  }

  if (!adaPesanan) {
    tampilkanError({});
    toast("Keranjangmu masih kosong. Pilih minumannya dulu.");
    el("#menu").scrollIntoView({ behavior: "smooth" });
    return;
  }

  tampilkanError({});

  const tautan =
    `https://wa.me/${NOMOR_WA}?text=` + encodeURIComponent(susunPesan());

  window.open(tautan, "_blank", "noopener");
  toast("Pesanan dibuka di WhatsApp. Tinggal tekan kirim ya.");
}

/* ======================= jalan ========================== */

function pasangEvent() {
  // tombol + / − / Tambah / lihat-detail di kartu menu
  el("#menu").addEventListener("click", (e) => {
    const tombol = e.target.closest("[data-aksi]");
    if (!tombol) return;

    const { aksi, id } = tombol.dataset;

    if (aksi === "detail") {
      bukaDetail(id);
      return;
    }

    ubahJumlah(id, aksi === "tambah" ? 1 : -1);
  });

  // kartu foto bisa dibuka pakai keyboard juga (Enter / Spasi)
  el("#menu").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;

    const target = e.target.closest('[data-aksi="detail"]');
    if (!target) return;

    e.preventDefault();
    bukaDetail(target.dataset.id);
  });

  // modal detail menu
  const modalDetail = el("#detail-modal");

  modalDetail.addEventListener("click", (e) => {
    if (e.target === modalDetail) tutupDetail();
  });

  modalDetail.addEventListener("close", () => {
    itemAktif = null;
  });

  el("#detail-kurang").addEventListener("click", () => {
    if (itemAktif) ubahJumlah(itemAktif, -1);
  });

  el("#detail-tambah").addEventListener("click", () => {
    if (itemAktif) ubahJumlah(itemAktif, 1);
  });

  el("#detail-tambah-cta").addEventListener("click", tambahDariDetail);

  // ngetik biodata -> kunci tombol kebuka sendiri
  ["nama", "kelas", "wa"].forEach((nama) => {
    const input = el(`#${nama}`);

    input.addEventListener("input", () => {
      const kotak = input.closest(".field");
      if (kotak.classList.contains("salah")) {
        const { masalah } = cekBiodata();
        if (!masalah[nama]) {
          kotak.classList.remove("salah");
          el(`#error-${nama}`).textContent = "";
        }
      }
      perbaruiTombol();
    });
  });

  el("#btn-order").addEventListener("click", kirimPesanan);

  el("#form-pesan").addEventListener("submit", (e) => {
    e.preventDefault();
    kirimPesanan();
  });

  el("#cartbar")
    .querySelector(".cartbar-go")
    .addEventListener("click", () => {
      setTimeout(() => el("#nama").focus({ preventScroll: true }), 600);
    });
}

function mulai() {
  renderMenu();
  pasangEvent();
  perbarui();

  el("#footer-wa").href = `https://wa.me/${NOMOR_WA}`;
  el("#hero-stock").innerHTML =
    `Varian kopi tinggal <strong>${SISA_SHOT} shot espresso</strong>. Siapa cepat dia dapat.`;
  el("#tahun").textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", mulai);
