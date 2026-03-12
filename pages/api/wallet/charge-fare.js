import { adminDb } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { email, amount, lineId, rideId, meta } = req.body || {};
    
    const amountNum = Number(amount);

    if (!email || !email.trim() || !Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ ok: false, error: "bad_request" });
    }

    // amount is expected in **major units** (e.g. PHP), convert to minor
    const amountMinor = Math.round(amountNum * 100);

    const snap = await adminDb
    .collection("eazemo_wallets")
    .where("email", "==", email)
    .limit(1)
    .get()

    if(snap.empty){
        return res.status(404).json({ok: false, error: "wallet_not_found"})
    }

    const doc = snap.docs[0]
    const walletRef = doc.ref;

    const chargeId = rideId || `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(walletRef);

      if (!snap.exists) {
        throw new Error("wallet_not_found");
      }

      const data = snap.data() || {};
      const prev = data.balanceMinor ?? 0;

      if (prev < amountMinor) {
        throw new Error("insufficient_funds");
      }

      const next = prev - amountMinor;

      tx.update(walletRef, {
        balanceMinor: next,
        updatedAt: new Date(),
      });

      const txRef = walletRef.collection("transactions").doc(chargeId);
      
      tx.set(txRef, {
        type: "fare_charge",
        amountMinor,
        lineId: lineId || null,
        rideId: rideId || null,
        meta: meta || null,
        createdAt: new Date(),
        status: "succeeded",
      });
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);

    if (e.message === "wallet_not_found") {
      return res.status(404).json({ ok: false, error: "wallet_not_found" });
    }
    if (e.message === "insufficient_funds") {
      return res.status(400).json({ ok: false, error: "insufficient_funds" });
    }

    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
