// pages/api/checkout/alt-webhook.js
import { adminDb } from "../../../lib/firebaseAdmin";

// Optional: implement signature verification based on Checkout.com docs
function verifyCheckoutSignature(req) {
  // TODO: read req.headers["cko-signature"] and verify using your secret
  return true;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    if (!verifyCheckoutSignature(req)) {
      return res.status(401).end();
    }

    const event = req.body;

    // You may receive multiple event types; only process successful payments
    if (event.type !== "payment_approved" && event.type !== "payment_captured") {
      return res.status(200).end();
    }

    const data = event.data || {};
    const metadata = data.metadata || {};
    const uid = metadata.uid || null;
    const email = metadata.email || null;
    const method = metadata.method || "unknown"; // "gcash" | "maya"
    const currency = (data.currency || "PHP").toUpperCase();

    if (!uid || !email) {
      console.error("Webhook missing uid/email >>>", data);
      return res.status(400).end();
    }

    const totalMinor = data.amount || 0;

    // Read userAmountMinor and feeMinor from metadata, fallback if missing
    let userAmountMinor = Number(metadata.userAmountMinor);
    let feeMinor = Number(metadata.feeMinor);

    if (!Number.isFinite(userAmountMinor) || userAmountMinor <= 0) {
      const fallbackFee = 7 * 100;
      userAmountMinor = Math.max(totalMinor - fallbackFee, 0);
      feeMinor = fallbackFee;
    }
    if (!Number.isFinite(feeMinor) || feeMinor < 0) {
      feeMinor = Math.max(totalMinor - userAmountMinor, 0);
    }

    const walletRef = adminDb.collection("eazemo_wallets").doc(email);
    const txId = data.id || `cko_${Date.now()}`;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(walletRef);
      const prev = snap.exists ? snap.data().balanceMinor || 0 : 0;
      const next = prev + userAmountMinor;

      tx.set(
        walletRef,
        {
          uid,
          email,
          currency,
          balanceMinor: next,
          updatedAt: new Date(),
          lastTopupSource: method, // "gcash" or "maya"
        },
        { merge: true }
      );

      const txRef = walletRef.collection("transactions").doc(txId);
      tx.set(txRef, {
        type: "topup",
        provider: method, // explicitly mark GCash / Maya here
        gateway: "checkout.com",
        amountMinor: userAmountMinor,
        feeMinor,
        totalMinor,
        currency,
        createdAt: new Date(),
        status: "succeeded",
        raw: {
          payment_id: data.id || null,
          reference: data.reference || null,
        },
      });
    });

    return res.status(200).end();
  } catch (e) {
    console.error("alt-webhook error >>>", e);
    return res.status(500).end();
  }
}
