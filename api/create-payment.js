import { randomUUID } from "node:crypto";

/**
 * Vercel serverless function: create a Midtrans Snap transaction.
 *
 * Required environment variables:
 * - MIDTRANS_SERVER_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - APP_URL                       (the public GitHub Pages URL)
 * - ALLOWED_ORIGIN                (same as APP_URL, no trailing slash)
 * - MIDTRANS_IS_PRODUCTION        ("true" only after sandbox testing)
 */

const CATALOG = Object.freeze({
  "americano-melongo": {
    name: "Americano Melongo",
    price: 10000,
    coffee: true,
  },
  "long-black-bikin-melek": {
    name: "Long Black Bikin Melek",
    price: 12000,
    coffee: true,
  },
  butterscotch: { name: "Butterscotch", price: 15000, coffee: true },
  surent: { name: "SUREN'T", price: 15000, coffee: true },
  "hazelnut-cenat-cenut": {
    name: "Hazelnut Cenat Cenut",
    price: 15000,
    coffee: true,
  },
  "caramel-ora-ngomel": {
    name: "Caramel Ora Ngomel",
    price: 15000,
    coffee: true,
  },
  "coklat-anti-bete": { name: "Coklat Anti Bete", price: 13000, coffee: false },
  "red-velvet-bikin-awet": {
    name: "Red Velvet Bikin Awet",
    price: 13000,
    coffee: false,
  },
  "matcha-ceria": { name: "Matcha Ceria", price: 13000, coffee: false },
  "matcha-latte": { name: "Matcha Latte", price: 15000, coffee: false },
});

const ESPRESSO_STOCK = 10;
const MAX_QUANTITY_PER_ITEM = 20;

function setCors(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    "https://simpatikabraja-oss.github.io",
    ...(allowedOrigin ? [allowedOrigin] : []),
  ]);
  if (origin && allowedOrigins.has(origin))
    res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  res.status(status).json(body);
}

function makeOrderId() {
  const now = new Date();
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const random = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `KK-${date}-${random}`;
}

function normalizePhone(value) {
  let phone = String(value || "").replace(/\D/g, "");
  if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
  if (phone.startsWith("8")) phone = `62${phone}`;
  return phone;
}

function cleanText(value, limit) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, limit);
}

function validatePayload(body) {
  const customer = body?.customer || {};
  const name = cleanText(customer.name, 80);
  const className = cleanText(customer.className, 30);
  const phone = normalizePhone(customer.phone);
  const email = cleanText(customer.email, 120).toLowerCase();
  const pickup = cleanText(customer.pickup, 120);
  const note = cleanText(customer.note, 240);
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  if (name.length < 3) throw new Error("Nama pelanggan tidak valid.");
  if (className.length < 2) throw new Error("Kelas pelanggan tidak valid.");
  if (!/^62\d{8,13}$/.test(phone))
    throw new Error("Nomor WhatsApp tidak valid.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Email tidak valid.");
  if (!pickup) throw new Error("Waktu pengambilan wajib diisi.");
  if (!rawItems.length || rawItems.length > Object.keys(CATALOG).length)
    throw new Error("Keranjang tidak valid.");

  const seen = new Set();
  const items = rawItems.map((rawItem) => {
    const id = String(rawItem?.id || "");
    const quantity = Number(rawItem?.quantity);
    const catalogItem = CATALOG[id];
    if (
      !catalogItem ||
      seen.has(id) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY_PER_ITEM
    ) {
      throw new Error("Salah satu menu atau jumlah pesanan tidak valid.");
    }
    seen.add(id);
    return {
      id,
      name: catalogItem.name,
      price: catalogItem.price,
      quantity,
      coffee: catalogItem.coffee,
    };
  });

  const coffeeQuantity = items.reduce(
    (sum, item) => sum + (item.coffee ? item.quantity : 0),
    0,
  );
  if (coffeeQuantity > ESPRESSO_STOCK)
    throw new Error("Stok shot espresso untuk pesanan ini tidak mencukupi.");

  const amount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return {
    customer: { name, className, phone, email, pickup, note },
    items,
    amount,
  };
}

async function supabaseRequest(path, options) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!response.ok)
    throw new Error("Penyimpanan pesanan sedang tidak tersedia.");
  return response;
}

async function saveOrder(order) {
  await supabaseRequest("orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

async function updateOrder(orderId, patch) {
  await supabaseRequest(`orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
}

async function createSnapTransaction({ orderId, validated }) {
  const credentials = Buffer.from(
    `${process.env.MIDTRANS_SERVER_KEY}:`,
  ).toString("base64");
  const production = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const endpoint = production
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
  const appUrl = String(process.env.APP_URL || "").replace(/\/$/, "");
  const payload = {
    transaction_details: { order_id: orderId, gross_amount: validated.amount },
    item_details: validated.items.map((item) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name,
    })),
    customer_details: {
      first_name: validated.customer.name,
      phone: validated.customer.phone,
      ...(validated.customer.email ? { email: validated.customer.email } : {}),
    },
    callbacks: appUrl
      ? {
          finish: `${appUrl}/?payment=finish&order_id=${encodeURIComponent(orderId)}`,
          unfinish: `${appUrl}/?payment=unfinish&order_id=${encodeURIComponent(orderId)}`,
          error: `${appUrl}/?payment=error&order_id=${encodeURIComponent(orderId)}`,
        }
      : undefined,
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.redirect_url)
    throw new Error("Gateway pembayaran menolak transaksi ini.");
  return data;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")
    return json(res, 405, { message: "Method tidak diizinkan." });
  if (
    !process.env.MIDTRANS_SERVER_KEY ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return json(res, 503, {
      message: "Pembayaran online belum dikonfigurasi oleh toko.",
    });
  }

  try {
    const validated = validatePayload(req.body);
    const orderId = makeOrderId();
    await saveOrder({
      order_id: orderId,
      payment_status: "PENDING",
      payment_method: "MIDTRANS",
      amount: validated.amount,
      customer_name: validated.customer.name,
      customer_class: validated.customer.className,
      customer_phone: validated.customer.phone,
      customer_email: validated.customer.email || null,
      pickup_method: validated.customer.pickup,
      customer_note: validated.customer.note || null,
      line_items: validated.items.map(({ coffee, ...item }) => item),
    });
    const snap = await createSnapTransaction({ orderId, validated });
    await updateOrder(orderId, {
      midtrans_token: snap.token,
      midtrans_redirect_url: snap.redirect_url,
    });
    return json(res, 201, { orderId, redirectUrl: snap.redirect_url });
  } catch (error) {
    console.error("create-payment", error);
    return json(res, 400, {
      message: error.message || "Tidak bisa membuat pembayaran.",
    });
  }
}
