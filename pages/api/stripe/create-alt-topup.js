import { fetch } from "undici";

const CKO_SECRET = process.env.CKO_SECRET_KEY;


export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    // Hard fail early if env missing
    const CKO_SECRET = process.env.CKO_SECRET_KEY;
    if (!CKO_SECRET) {
      return res.status(500).json({ ok: false, error: "missing_cko_secret_key" });
    }

    // Show what server actually received
    const body = req.body || {};
    const method = body.method;
    const uid = body.uid;
    const email = body.email;
    const amount = body.amount;

    if (
      !uid ||
      !email ||
      !method ||
      !["gcash", "maya"].includes(method) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        ok: false,
        error: "bad_request",
        received: { method, uid: !!uid, email: !!email, amount },
      });
    }

    const amountNum = Number(amount);
    const userAmountMinor = Math.round(amountNum * 100);
    const feeMinor = 7 * 100;
    const totalMinor = userAmountMinor + feeMinor;

    // Origin can be undefined depending on env/proxy; compute safely
    const origin =
      req.headers.origin ||
      (req.headers.host ? `http://${req.headers.host}` : null);

    if (!origin) {
      return res.status(500).json({ ok: false, error: "missing_origin_headers" });
    }

    // Ensure fetch exists; if not, this is your runtime problem
    if (typeof fetch !== "function") {
      return res.status(500).json({ ok: false, error: "server_fetch_not_available" });
    }

    const payload = {
      source: { type: method },
      amount: totalMinor,
      currency: "PHP",
      success_url: `${origin}/topup/success`,
      failure_url: `${origin}/topup/fail`,
      reference: `topup-${method}-${email}-${Date.now()}`,
      customer: { email },
      metadata: {
        uid,
        email,
        method,
        userAmountMinor: String(userAmountMinor),
        feeMinor: String(feeMinor),
        kind: "wallet_topup",
      },
    };

    const resp = await fetch("https://api.checkout.com/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CKO_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await resp.text();
    let json;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = { raw };
    }

    if (!resp.ok) {
      // RETURN the provider failure body to the client (stop hiding it)
      return res.status(500).json({
        ok: false,
        error: "cko_create_failed",
        status: resp.status,
        provider: json,
        sent: {
          method,
          currency: "PHP",
          userAmountMinor,
          feeMinor,
          totalMinor,
        },
      });
    }

    const redirectUrl = json?._links?.redirect?.href || json?.redirect_url || null;
    if (!redirectUrl) {
      return res.status(500).json({
        ok: false,
        error: "cko_no_redirect_url",
        provider: json,
      });
    }

    return res.status(200).json({
      ok: true,
      url: redirectUrl,
      meta: { userAmountMinor, feeMinor, totalMinor, method },
    });
  } catch (e) {
    // NEVER return just "server_error" during debugging
    return res.status(500).json({
      ok: false,
      error: "server_exception",
      message: String(e?.message || e),
      stack: String(e?.stack || ""),
    });
  }
}
