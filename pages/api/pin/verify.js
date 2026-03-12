import bcrypt from "bcryptjs";
import { adminDb } from "../../../lib/firebaseAdmin";
import admin from "firebase-admin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

    const { email, pin } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ ok: false, error: "missing_email" });
    }

    if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ ok: false, error: "invalid_pin" });
    }

    const ref = adminDb.collection("eazemo_users").doc(email);
    const snap = await ref.get();

    if (!snap.exists) return res.status(404).json({ ok: false, error: "wallet_not_found" });

    const data = snap.data() || {};
    const hash = data.user_pin_hash;

    if (!hash) return res.status(400).json({ ok: false, error: "pin_not_set" });

    // Optional lockout (basic)
    const lockedUntil = data.pin_lockedUntil?.toDate?.() || null;
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      return res.status(429).json({ ok: false, error: "locked", lockedUntil: lockedUntil.toISOString() });
    }

    const ok = await bcrypt.compare(pin, hash);

    if (!ok) {
      const attempts = Number(data.pin_attempts || 0) + 1;

      // lock after 5 attempts for 60 seconds
      const shouldLock = attempts >= 5;
      const lockUntil = shouldLock ? new Date(Date.now() + 60 * 1000) : null;

      await ref.set(
        {
          pin_attempts: attempts,
          pin_lockedUntil: lockUntil ? admin.firestore.Timestamp.fromDate(lockUntil) : null,
          user_pin_updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return res.status(401).json({ ok: false, error: "wrong_pin", attempts, locked: shouldLock });
    }

    // success: reset attempts
    await ref.set(
      {
        pin_attempts: 0,
        pin_lockedUntil: null,
        user_pin_updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("pin/verify error >>>", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
