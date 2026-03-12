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

    const hash = await bcrypt.hash(pin, 10);

    const ref = adminDb.collection("eazemo_users").doc(email);

    await ref.set(
      {
        user_pin_hash: hash,
        user_pin_setAt: admin.firestore.FieldValue.serverTimestamp(),
        user_pin_updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        pin_attempts: 0,
        pin_lockedUntil: null,
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("pin/set error >>>", e);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
}
