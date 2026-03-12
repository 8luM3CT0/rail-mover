import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20"
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { amount, uid, email } = req.body || {};
    // validate input
    const amountNum = Number(amount);
    if(
      !uid ||
      !email || 
      !Number.isFinite(amountNum) || 
      amountNum <= 0
    ){
      return res.status(400).json({error: "bad_request"})
    }

    const amountMinor = Math.round(amountNum * 100)

    const feeMinor = 7.02 * 100

    const totalMinor = amountMinor + feeMinor
    // Create session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      currency: "php",
      success_url: `${req.headers.origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/subscribe?cancelled=1`,
      customer_email: email,
      metadata: {
        uid,
        kind: "wallet_topup"
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "php",
            unit_amount: totalMinor,
            product_data: {
              name: `EazeMo Wallet Top-up (PHP ${amountNum.toFixed(
                2
              )} + PHP 0.15 fee)`
            },
          },
        },
      ],
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
}
