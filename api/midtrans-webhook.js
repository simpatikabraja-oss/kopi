import crypto from "node:crypto";

function transactionState(payload) {
  if (payload.transaction_status === "settlement") return "PAID";
  if (
    payload.transaction_status === "capture" &&
    payload.fraud_status === "accept"
  )
    return "PAID";
  if (payload.transaction_status === "pending") return "PENDING";
  if (
    ["deny", "cancel", "expire", "failure"].includes(payload.transaction_status)
  )
    return "FAILED";
  return "PENDING";
}

async function updateOrder(orderId, patch) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    },
  );
  if (!response.ok) throw new Error("Tidak bisa memperbarui pesanan.");
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method tidak diizinkan." });
  if (
    !process.env.MIDTRANS_SERVER_KEY ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return res.status(503).json({ message: "Webhook belum dikonfigurasi." });
  }

  try {
    const payload = req.body || {};
    const source = `${payload.order_id}${payload.status_code}${payload.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(source)
      .digest("hex");
    const receivedSignature = String(payload.signature_key || "");
    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature),
      )
    ) {
      return res
        .status(401)
        .json({ message: "Signature webhook tidak valid." });
    }
    await updateOrder(payload.order_id, {
      payment_status: transactionState(payload),
      midtrans_transaction_status: payload.transaction_status || null,
      midtrans_fraud_status: payload.fraud_status || null,
      paid_at:
        transactionState(payload) === "PAID" ? new Date().toISOString() : null,
    });
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("midtrans-webhook", error);
    return res.status(500).json({ message: "Webhook tidak bisa diproses." });
  }
}
