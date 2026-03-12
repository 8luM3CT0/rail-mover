import Stripe from "stripe";
import { adminDb } from "../../../lib/firebaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  try {
    const { session_id } = req.query || {};
    if (!session_id ) return res.status(400).json({ ok: false, error: "missing_params" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== "paid") {
      return res.status(402).json({ ok: false, error: "unpaid" });
    }

    const meta = session.metadata ?? {};
    const uid = session.metadata?.uid || "unknown";
    const email = 
    session.customer_email || 
    session.customer_details?.email || 
    "unknown";

    const totalMinor = session.amount_total ?? 0;
    const currency = session.currency ?? "php";

    let userAmountMinor = Number(meta.userAmountMinor)
    let feeMinor = Number(meta.feeMinor)

    if(!Number.isFinite(userAmountMinor) || userAmountMinor <= 0){
      const fallbackFee = 7 * 100;
      userAmountMinor = Math.max(totalMinor - fallbackFee, 0)
      feeMinor = fallbackFee
    }
    if(!Number.isFinite(feeMinor) || feeMinor < 0){
      feeMinor = Math.max(totalMinor - userAmountMinor, 0)
    }

    const walletRef = adminDb.collection("eazemo_wallets").doc(email)

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(walletRef)
      const prev = snap.exists ? snap.data().balanceMinor || 0 : 0;
      const next = prev + userAmountMinor;

      tx.set(
        walletRef,
        {
          uid,
          email,
          currency,
          balanceMinor: next,
          updatedAt: new Date().toLocaleDateString()
        },
        {merge: true}
      );
    });

    await walletRef.collection("transactions").doc(session.id).set({
      type: "topup",
      stripe: {
        session_id: session.id,
        payment_intent: session.payment_intent ?? null,
        amount_total: totalMinor,
        currency
      },
      userAmountMinor,
      feeMinor,
      totalMinor,
      createdAt: new Date().toLocaleDateString(),
      status: "successful"
    })
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
