"use strict";

/*
 * Kopi Kalcer storefront
 *
 * Pembayaran online TIDAK dihitung di browser. Browser hanya mengirim ID menu,
 * jumlah, dan data pelanggan ke API. Harga dan stok kemudian dihitung ulang di
 * server sebelum Midtrans membuat halaman pembayaran.
 */

const CONFIG = Object.freeze({
  whatsappNumber: "6285711308141",
  espressoStock: 10,
  paymentApiUrl: ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3000/api/create-payment"
    : "https://kopi-dusky-psi.vercel.app/api/create-payment",
  cartStorageKey: "kopi-kalcer-cart-v2",
  customerStorageKey: "kopi-kalcer-customer-v2",
  maxQuantityPerMenu: 20,
});

const MENU = Object.freeze({
  kopi: [
    {
      id: "americano-melongo",
      name: "Americano Melongo",
      price: 10000,
      image: "img/americano-melongo.jpg",
      description: "Hitam, tajam, langsung melek sampai jam pulang.",
      rating: 4.7,
      reviewCount: 48,
      detail:
        "Espresso dan air panas tanpa gula. Pahitnya jujur, aromanya langsung bangunin kepala sebelum pelajaran mulai.",
    },
    {
      id: "long-black-bikin-melek",
      name: "Long Black Bikin Melek",
      price: 12000,
      image: "img/long-black-bikin-melek.jpg",
      description: "Espresso yang dituang ke air panas. Pahitnya pas.",
      rating: 4.6,
      reviewCount: 35,
      detail:
        "Espresso dituangkan belakangan di atas air panas supaya crema dan aromanya tetap nendang. Pahit, tapi masih ramah buat yang baru mulai.",
    },
    {
      id: "butterscotch",
      name: "Butterscotch",
      price: 15000,
      image: "img/butterscotch.jpg",
      description: "Manis gurih ala karamel mentega, dingin dan creamy.",
      rating: 4.9,
      reviewCount: 52,
      detail:
        "Espresso, susu creamy, dan rasa butterscotch yang manis-gurih. Pilihan aman kalau mau ngopi tanpa rasa pahit yang terlalu galak.",
    },
    {
      id: "surent",
      name: "SUREN'T",
      price: 15000,
      image: "img/surent.jpg",
      description: "Racikan khas Kopi Kalcer yang cuma ada di sini.",
      rating: 5.0,
      reviewCount: 29,
      detail:
        "Racikan rahasia yang dibuat sampai ketemu takaran paling pas. Coba sekali biar paham kenapa minuman ini jadi legend di kelas 11G.",
    },
    {
      id: "hazelnut-cenat-cenut",
      name: "Hazelnut Cenat Cenut",
      price: 15000,
      image: "img/hazelnut-cenat-cenut.jpg",
      description: "Wangi kacang hazelnut, lembut, gampang disukai.",
      rating: 4.8,
      reviewCount: 41,
      detail:
        "Wangi kacang hazelnut yang langsung keluar begitu gelas dibuka. Rasanya lembut dan manisnya pas, cocok buat yang tidak mau rasa terlalu galak.",
    },
    {
      id: "caramel-ora-ngomel",
      name: "Caramel Ora Ngomel",
      price: 15000,
      image: "img/caramel-ora-ngomel.jpg",
      description: "Karamel manis buat hari yang bikin pengin ngomel.",
      rating: 4.7,
      reviewCount: 37,
      detail:
        "Karamel manis dan susu creamy dipadu espresso supaya tidak eneg. Cocok buat hari yang ramai dan tugas yang datangnya barengan.",
    },
  ],
  nonKopi: [
    {
      id: "coklat-anti-bete",
      name: "Coklat Anti Bete",
      price: 13000,
      image: "img/coklat-anti-bete.jpg",
      description: "Coklat kental dingin, aman buat yang anti kafein.",
      rating: 4.8,
      reviewCount: 44,
      detail:
        "Coklat kental, susu, dan tanpa kafein. Tetap enak buat menemani istirahat tanpa bikin kamu susah tidur nanti malam.",
    },
    {
      id: "red-velvet-bikin-awet",
      name: "Red Velvet Bikin Awet",
      price: 13000,
      image: "img/red-velvet-bikin-awet.jpg",
      description: "Manis lembut warna merah, favorit yang cepat habis.",
      rating: 4.9,
      reviewCount: 56,
      detail:
        "Rasa vanilla yang lembut dengan warna merah muda yang seru. Ini salah satu yang paling cepat habis setiap PO dibuka.",
    },
    {
      id: "matcha-ceria",
      name: "Matcha Ceria",
      price: 13000,
      image: "img/matcha-ceria.jpg",
      description: "Matcha susu yang segar, pahit-manisnya seimbang.",
      rating: 4.6,
      reviewCount: 30,
      detail:
        "Matcha dan susu dengan rasa pahit-manis yang seimbang. Segar buat diminum siang hari saat mood mulai turun.",
    },
  ],
});

const allMenu = Object.freeze([...MENU.kopi, ...MENU.nonKopi]);
const coffeeIds = new Set(MENU.kopi.map((item) => item.id));
const menuById = new Map(allMenu.map((item) => [item.id, item]));

function resetCheckoutForPageLoad() {
  localStorage.removeItem(CONFIG.cartStorageKey);
  localStorage.removeItem(CONFIG.customerStorageKey);
}

resetCheckoutForPageLoad();

const state = {
  cart: loadCart(),
  activeProductId: null,
  toastTimer: null,
  isSubmitting: false,
  checkoutReference: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (amount) => `Rp${Number(amount).toLocaleString("id-ID")}`;
const onlinePaymentEnabled = () =>
  Boolean(CONFIG.paymentApiUrl && /^https:\/\/|^\//.test(CONFIG.paymentApiUrl));

function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[char],
  );
}

function createOrderReference() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();
  return `KK-${stamp}-${random}`;
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadCart() {
  const stored = safeJson(localStorage.getItem(CONFIG.cartStorageKey), {});
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};

  return Object.fromEntries(
    Object.entries(stored)
      .filter(
        ([id, quantity]) =>
          menuById.has(id) && Number.isInteger(quantity) && quantity > 0,
      )
      .map(([id, quantity]) => [
        id,
        Math.min(quantity, CONFIG.maxQuantityPerMenu),
      ]),
  );
}

function saveCart() {
  localStorage.setItem(CONFIG.cartStorageKey, JSON.stringify(state.cart));
}

function loadCustomer() {
  const fallback = {
    name: "",
    className: "",
    phone: "",
    email: "",
    pickup: "Pas istirahat ke-2 di kelas 11G",
    note: "",
  };
  const saved = safeJson(
    localStorage.getItem(CONFIG.customerStorageKey),
    fallback,
  );
  return { ...fallback, ...(saved && typeof saved === "object" ? saved : {}) };
}

function saveCustomer() {
  const customer = {
    name: $("#nama").value.trim(),
    className: $("#kelas").value.trim(),
    phone: $("#wa").value.trim(),
    email: $("#customer-email").value.trim(),
    pickup: $("#ambil").value,
    note: $("#catatan").value.trim(),
  };
  localStorage.setItem(CONFIG.customerStorageKey, JSON.stringify(customer));
}

function restoreCustomer() {
  const customer = loadCustomer();
  $("#nama").value = customer.name;
  $("#kelas").value = customer.className;
  $("#wa").value = customer.phone;
  $("#customer-email").value = customer.email;
  $("#ambil").value = customer.pickup;
  $("#catatan").value = customer.note;
}

function cartItems() {
  return Object.entries(state.cart)
    .map(([id, quantity]) => {
      const item = menuById.get(id);
      return item
        ? { ...item, quantity, subtotal: item.price * quantity }
        : null;
    })
    .filter(Boolean);
}

function totalItems() {
  return Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
}
function totalPrice() {
  return cartItems().reduce((sum, item) => sum + item.subtotal, 0);
}
function coffeeQuantity(excludeId = null) {
  return Object.entries(state.cart).reduce(
    (sum, [id, quantity]) =>
      sum + (id !== excludeId && coffeeIds.has(id) ? quantity : 0),
    0,
  );
}
function remainingCoffeeShots() {
  return Math.max(0, CONFIG.espressoStock - coffeeQuantity());
}

function showToast(message) {
  const toast = $("#toast");
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(
    () => toast.classList.remove("is-visible"),
    3200,
  );
}

function starsHtml(rating) {
  const width = Math.max(0, Math.min(100, (rating / 5) * 100));
  return `<span class="rating" aria-label="Rating ${rating} dari 5"><span class="rating-base">★★★★★</span><span class="rating-fill" style="width:${width}%">★★★★★</span></span>`;
}

function productHtml(item, category) {
  const name = escapeHtml(item.name);
  const description = escapeHtml(item.description);
  return `
    <article class="product-card" data-product="${item.id}">
      <div class="product-photo" data-action="detail" data-id="${item.id}" role="button" tabindex="0" aria-label="Lihat detail ${name}">
        <img src="${item.image}" alt="${name}" loading="lazy" />
        <span class="product-price">${money(item.price)}</span>
      </div>
      <div class="product-body">
        <p class="product-category">${category}</p>
        <h4>${name}</h4>
        <div class="product-rating">${starsHtml(item.rating)}<strong>${item.rating.toFixed(1)}</strong><span>(${item.reviewCount})</span></div>
        <p class="product-description">${description}</p>
        <button class="product-detail" type="button" data-action="detail" data-id="${item.id}">Lihat detail <span aria-hidden="true">→</span></button>
        <div class="product-footer">
          <div class="quantity-control" aria-label="Jumlah ${name}">
            <button type="button" data-action="decrement" data-id="${item.id}" aria-label="Kurangi ${name}">−</button>
            <span data-quantity="${item.id}">0</span>
            <button type="button" data-action="increment" data-id="${item.id}" aria-label="Tambah ${name}">+</button>
          </div>
          <button class="product-add" type="button" data-action="increment" data-id="${item.id}">Tambah</button>
        </div>
      </div>
    </article>`;
}

function renderMenu() {
  $("#grid-kopi").innerHTML = MENU.kopi
    .map((item) => productHtml(item, "Espresso series"))
    .join("");
  $("#grid-nonkopi").innerHTML = MENU.nonKopi
    .map((item) => productHtml(item, "Non-coffee series"))
    .join("");

  $$(".product-photo img").forEach((image) => {
    image.addEventListener(
      "error",
      () => image.closest(".product-photo").classList.add("is-empty"),
      { once: true },
    );
  });
}

function setQuantity(id, proposedQuantity, { announce = false } = {}) {
  if (!menuById.has(id)) return;
  const previousQuantity = state.cart[id] || 0;
  let quantity = Math.max(
    0,
    Math.min(CONFIG.maxQuantityPerMenu, Number(proposedQuantity) || 0),
  );

  if (coffeeIds.has(id)) {
    const availableForThisItem = CONFIG.espressoStock - coffeeQuantity(id);
    if (quantity > availableForThisItem) {
      quantity = Math.max(0, availableForThisItem);
      if (proposedQuantity > previousQuantity)
        showToast(
          `Shot espresso tinggal ${CONFIG.espressoStock}. Coba menu non-kopi juga, ya.`,
        );
    }
  }

  if (quantity === 0) delete state.cart[id];
  else state.cart[id] = quantity;

  saveCart();
  renderOrderState();

  if (announce && quantity > previousQuantity)
    showToast(`${menuById.get(id).name} masuk ke keranjang.`);
}

function changeQuantity(id, change, options) {
  setQuantity(id, (state.cart[id] || 0) + change, options);
}

function renderReceipt() {
  const items = cartItems();
  const lines = $("#struk-lines");
  lines.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "receipt-empty";
    empty.textContent = "Keranjangmu masih kosong. Yuk pilih minuman dulu.";
    lines.append(empty);
  } else {
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "receipt-item";
      const left = document.createElement("div");
      const name = document.createElement("span");
      name.className = "receipt-item-name";
      name.textContent = item.name;
      const meta = document.createElement("span");
      meta.className = "receipt-item-meta";
      meta.textContent = `${item.quantity} × ${money(item.price)}`;
      const subtotal = document.createElement("strong");
      subtotal.textContent = money(item.subtotal);
      left.append(name, meta);
      row.append(left, subtotal);
      lines.append(row);
    });
  }

  $("#struk-subtotal").textContent = money(totalPrice());
  $("#struk-total").textContent = money(totalPrice());
}

function renderProductQuantities() {
  allMenu.forEach((item) => {
    const quantity = state.cart[item.id] || 0;
    const card = document.querySelector(`[data-product="${item.id}"]`);
    const count = document.querySelector(`[data-quantity="${item.id}"]`);
    if (!card || !count) return;
    count.textContent = quantity;
    card.classList.toggle("is-selected", quantity > 0);
    const decrementButton = card.querySelector('[data-action="decrement"]');
    decrementButton.disabled = quantity === 0;
  });
}

function renderCartBar() {
  const amount = totalItems();
  const cartBar = $("#cartbar");
  $("#cartbar-count").textContent =
    `${amount} ${amount === 1 ? "item" : "item"}`;
  $("#cartbar-total").textContent = money(totalPrice());
  cartBar.hidden = amount === 0;
  cartBar.classList.toggle("is-visible", amount > 0);
  document.body.classList.toggle("has-mobile-cart", amount > 0);

  const badge = $("#topbar-count");
  badge.hidden = amount === 0;
  badge.textContent = amount;
}

function renderStock() {
  const remaining = remainingCoffeeShots();
  $("#hero-stock").textContent = remaining;
  $("#coffee-stock-badge").textContent = `${remaining} shot espresso tersedia`;
}

function cleanPhone(rawValue) {
  let digits = String(rawValue || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith("8")) digits = `62${digits}`;
  return digits;
}

function customerData() {
  return {
    name: $("#nama").value.trim(),
    className: $("#kelas").value.trim(),
    phone: cleanPhone($("#wa").value),
    phoneDisplay: $("#wa").value.trim(),
    email: $("#customer-email").value.trim(),
    pickup: $("#ambil").value,
    note: $("#catatan").value.trim(),
  };
}

function validateCustomer() {
  const customer = customerData();
  const errors = {};
  if (customer.name.length < 3) errors.nama = "Tulis nama lengkapmu dulu, ya.";
  if (customer.className.length < 2) errors.kelas = "Isi kelas, misalnya 11G.";
  if (!customer.phone) errors.wa = "Nomor WhatsApp wajib diisi.";
  else if (!/^62\d{8,13}$/.test(customer.phone))
    errors.wa = "Nomornya belum valid. Contoh: 081234567890.";
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
    errors["customer-email"] = "Format email belum benar.";
  return { customer, errors, valid: Object.keys(errors).length === 0 };
}

function renderFieldErrors(errors = {}) {
  ["nama", "kelas", "wa", "customer-email"].forEach((id) => {
    const field = $(`#${id}`).closest(".field");
    const error = $(`#error-${id}`);
    field.classList.toggle("is-invalid", Boolean(errors[id]));
    error.textContent = errors[id] || "";
  });
}

function renderCheckoutAvailability() {
  const hasCart = totalItems() > 0;
  const { valid } = validateCustomer();
  const ready = hasCart && valid;
  const button = $("#btn-order");
  const hint = $("#order-hint");
  button.classList.toggle("is-locked", !ready);
  button.setAttribute("aria-disabled", String(!ready));

  if (ready) {
    hint.textContent = "Datamu sudah lengkap. Lanjut pilih cara bayarnya.";
    hint.classList.add("is-ready");
  } else if (!hasCart && !valid) {
    hint.textContent = "Pilih minimal satu minuman dan isi datamu dulu.";
    hint.classList.remove("is-ready");
  } else if (!hasCart) {
    hint.textContent = "Datamu sudah aman. Tinggal pilih minumannya.";
    hint.classList.remove("is-ready");
  } else {
    hint.textContent = "Pesanan aman. Lengkapi data yang bertanda wajib, ya.";
    hint.classList.remove("is-ready");
  }
}

function renderOrderState() {
  renderProductQuantities();
  renderReceipt();
  renderCartBar();
  renderStock();
  renderCheckoutAvailability();
  renderDetailQuantity();
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (dialog.open && typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function openProductDetail(id) {
  const item = menuById.get(id);
  if (!item) return;
  state.activeProductId = id;
  const image = $("#detail-foto");
  image.src = item.image;
  image.alt = item.name;
  $("#detail-kategori").textContent = coffeeIds.has(id)
    ? "Espresso series"
    : "Non-coffee series";
  $("#detail-nama").textContent = item.name;
  $("#detail-harga").textContent = money(item.price);
  $("#detail-penjelasan").textContent = item.detail;
  $("#detail-rating").innerHTML =
    `<div class="product-rating">${starsHtml(item.rating)}<strong>${item.rating.toFixed(1)}</strong><span>(${item.reviewCount} ulasan)</span></div>`;
  renderDetailQuantity();
  openDialog($("#detail-modal"));
}

function renderDetailQuantity() {
  if (!state.activeProductId) return;
  const quantity = state.cart[state.activeProductId] || 0;
  $("#detail-jumlah").textContent = quantity;
  $("#detail-kurang").disabled = quantity === 0;
}

function handleMenuClick(event) {
  const control = event.target.closest("[data-action]");
  if (!control) return;
  const { action, id } = control.dataset;
  if (action === "detail") return openProductDetail(id);
  if (action === "increment") return changeQuantity(id, 1, { announce: true });
  if (action === "decrement") return changeQuantity(id, -1);
}

function handleMenuKeyboard(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const target = event.target.closest('[data-action="detail"]');
  if (!target) return;
  event.preventDefault();
  openProductDetail(target.dataset.id);
}

function updateNotesCounter() {
  $("#notes-count").textContent = $("#catatan").value.length;
}

function focusFirstInvalid(errors) {
  const id = ["nama", "kelas", "wa", "customer-email"].find(
    (field) => errors[field],
  );
  if (!id) return;
  const input = $(`#${id}`);
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => input.focus({ preventScroll: true }), 300);
}

function makeWhatsappMessage({ orderReference, paymentLabel }) {
  const customer = customerData();
  const itemLines = cartItems()
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} ×${item.quantity} — ${money(item.subtotal)}`,
    )
    .join("\n");
  return [
    "Halo Kopi Kalcer! Aku mau konfirmasi PO ☕",
    "",
    `Kode pesanan: ${orderReference}`,
    `Metode bayar: ${paymentLabel}`,
    "",
    "== BIODATA ==",
    `Nama: ${customer.name}`,
    `Kelas: ${customer.className}`,
    `No. WA: ${customer.phoneDisplay}`,
    `Ambil: ${customer.pickup}`,
    `Catatan: ${customer.note || "-"}`,
    "",
    "== PESANAN ==",
    itemLines,
    "",
    `Total ${totalItems()} item: ${money(totalPrice())}`,
    "",
    paymentLabel === "Bayar cash saat ambil"
      ? "Aku akan bayar cash saat ambil. Makasih!"
      : "Pembayaran online sudah/akan diselesaikan lewat gateway. Makasih!",
  ].join("\n");
}

function openPaymentDialog() {
  const validation = validateCustomer();
  if (!totalItems()) {
    showToast("Keranjangmu masih kosong. Pilih minumannya dulu.");
    $("#menu").scrollIntoView({ behavior: "smooth" });
    return;
  }
  if (!validation.valid) {
    renderFieldErrors(validation.errors);
    showToast("Lengkapi data yang wajib diisi dulu, ya.");
    focusFirstInvalid(validation.errors);
    return;
  }
  renderFieldErrors({});
  saveCustomer();
  state.checkoutReference = createOrderReference();
  renderPaymentSummary();
  setPaymentMethod("cash");
  openDialog($("#payment-modal"));
}

function renderPaymentSummary() {
  const paymentLines = $("#payment-lines");
  paymentLines.replaceChildren();
  cartItems().forEach((item) => {
    const line = document.createElement("div");
    line.className = "payment-line";
    const label = document.createElement("span");
    label.textContent = `${item.quantity}× ${item.name}`;
    const value = document.createElement("strong");
    value.textContent = money(item.subtotal);
    line.append(label, value);
    paymentLines.append(line);
  });
  $("#payment-total").textContent = money(totalPrice());
  $("#payment-order-label").textContent = state.checkoutReference || "—";
}

function selectedPaymentMethod() {
  return $("input[name=payment-method]:checked").value;
}

function setPaymentMethod(method) {
  if (method === "midtrans" && !onlinePaymentEnabled()) method = "cash";
  const inputs = $$('input[name="payment-method"]');
  inputs.forEach((input) => {
    const selected = input.value === method;
    input.checked = selected;
    input.closest(".payment-method").classList.toggle("is-selected", selected);
  });
  const online = method === "midtrans";
  $("#payment-notice").innerHTML = online
    ? '<span aria-hidden="true">⌁</span><p>Kamu akan diarahkan ke halaman pembayaran resmi untuk memilih QRIS, e-wallet, atau virtual account. Jangan pernah membagikan PIN atau OTP.</p>'
    : '<span aria-hidden="true">⌁</span><p>Cash dibayar saat mengambil pesanan. Kami akan menyiapkan pesan konfirmasi WhatsApp untukmu.</p>';
  $("#payment-submit-text").textContent = online
    ? "Lanjut ke pembayaran aman"
    : "Buat pesanan cash";
}

function showCashSuccess(orderReference) {
  const message = makeWhatsappMessage({
    orderReference,
    paymentLabel: "Bayar cash saat ambil",
  });
  const link = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  $("#success-message").textContent =
    `Kode pesanan ${orderReference} sudah dibuat. Buka WhatsApp untuk mengirim konfirmasi ke Kopi Kalcer.`;
  $("#success-wa").href = link;
  closeDialog($("#payment-modal"));
  openDialog($("#success-modal"));
}

function serverPayload() {
  const { customer } = validateCustomer();
  return {
    orderId: state.checkoutReference || createOrderReference(),
    items: cartItems().map(({ id, quantity }) => ({ id, quantity })),
    customer: {
      name: customer.name,
      className: customer.className,
      phone: customer.phone,
      email: customer.email,
      pickup: customer.pickup,
      note: customer.note,
    },
  };
}

async function startOnlinePayment() {
  if (!onlinePaymentEnabled()) {
    showToast("Pembayaran online belum diaktifkan oleh toko.");
    return;
  }
  const submit = $("#payment-submit");
  state.isSubmitting = true;
  submit.disabled = true;
  $("#payment-submit-text").textContent = "Menyiapkan pembayaran…";

  try {
    const response = await fetch(CONFIG.paymentApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(serverPayload()),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.redirectUrl) {
      throw new Error(
        data.message || "Gateway pembayaran belum bisa dihubungi.",
      );
    }

    sessionStorage.setItem(
      "kopi-kalcer-pending-order",
      JSON.stringify({ orderId: data.orderId, createdAt: Date.now() }),
    );
    window.location.assign(data.redirectUrl);
  } catch (error) {
    console.error("Payment start failed", error);
    showToast(
      error.message ||
        "Belum bisa membuat pembayaran online. Coba lagi atau pilih cash.",
    );
    state.isSubmitting = false;
    submit.disabled = false;
    $("#payment-submit-text").textContent = "Lanjut ke pembayaran aman";
  }
}

async function submitPaymentChoice() {
  if (state.isSubmitting) return;
  const method = selectedPaymentMethod();
  if (method === "cash") {
    showCashSuccess(state.checkoutReference || createOrderReference());
    return;
  }
  await startOnlinePayment();
}

function bindDialogs() {
  [$("#detail-modal"), $("#payment-modal"), $("#success-modal")].forEach(
    (dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    },
  );
  $("#detail-modal").addEventListener("close", () => {
    state.activeProductId = null;
  });
  $("#detail-tambah").addEventListener(
    "click",
    () =>
      state.activeProductId &&
      changeQuantity(state.activeProductId, 1, { announce: true }),
  );
  $("#detail-kurang").addEventListener(
    "click",
    () => state.activeProductId && changeQuantity(state.activeProductId, -1),
  );
  $("#detail-tambah-cta").addEventListener("click", () => {
    if (!state.activeProductId) return;
    changeQuantity(state.activeProductId, 1, { announce: true });
    closeDialog($("#detail-modal"));
  });
}

function bindEvents() {
  $("#menu").addEventListener("click", handleMenuClick);
  $("#menu").addEventListener("keydown", handleMenuKeyboard);

  ["nama", "kelas", "wa", "customer-email", "ambil", "catatan"].forEach(
    (id) => {
      const field = $(`#${id}`);
      field.addEventListener("input", () => {
        saveCustomer();
        if (id === "catatan") updateNotesCounter();
        const { errors } = validateCustomer();
        if (field.closest(".field").classList.contains("is-invalid"))
          renderFieldErrors(errors);
        renderCheckoutAvailability();
      });
      field.addEventListener("change", () => {
        saveCustomer();
        renderCheckoutAvailability();
      });
    },
  );

  $("#form-pesan").addEventListener("submit", (event) => {
    event.preventDefault();
    openPaymentDialog();
  });
  $("#btn-order").addEventListener("click", openPaymentDialog);
  $$("input[name=payment-method]").forEach((input) =>
    input.addEventListener("change", () => setPaymentMethod(input.value)),
  );
  $("#payment-submit").addEventListener("click", submitPaymentChoice);
  window.addEventListener(
    "scroll",
    () => $(".topbar").classList.toggle("is-scrolled", window.scrollY > 10),
    { passive: true },
  );
}

function configurePaymentAvailability() {
  const onlineInput = $('input[value="midtrans"]');
  const onlineLabel = onlineInput.closest(".payment-method");
  if (onlinePaymentEnabled()) return;
  onlineInput.disabled = true;
  onlineLabel.classList.add("is-unavailable");
  onlineLabel.querySelector(".method-copy strong").textContent =
    "Bayar online — segera aktif";
  onlineLabel.querySelector(".method-copy small").textContent =
    "Aktif setelah gateway pembayaran toko disambungkan";
  $(".payment-preview").innerHTML =
    '<span aria-hidden="true">⌁</span> Pembayaran cash tersedia · pembayaran online sedang disiapkan';
}

function showPaymentReturnMessage() {
  const query = new URLSearchParams(window.location.search);
  const paymentState = query.get("payment");
  if (!paymentState) return;
  const message = {
    finish:
      "Pembayaran sedang diverifikasi. Pesanan hanya dianggap lunas setelah webhook gateway mengonfirmasi.",
    unfinish:
      "Pembayaran belum selesai. Kamu bisa membuka kembali link pembayaran jika masih ingin melanjutkan.",
    error:
      "Pembayaran tidak berhasil diproses. Coba lagi atau pilih pembayaran cash.",
  }[paymentState];
  if (message) showToast(message);
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.hash,
  );
}

function renderDateLabel() {
  const date = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());
  $("#receipt-date").textContent = `PO ${date.toUpperCase()}`;
}

function initialize() {
  renderMenu();
  restoreCustomer();
  updateNotesCounter();
  bindDialogs();
  bindEvents();
  configurePaymentAvailability();
  renderOrderState();
  renderDateLabel();
  showPaymentReturnMessage();
  $("#footer-wa").href = `https://wa.me/${CONFIG.whatsappNumber}`;
  $("#tahun").textContent = new Date().getFullYear();
}

initialize();
