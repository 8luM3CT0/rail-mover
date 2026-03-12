// pages/api/ride-guide.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // this is where your 405 + "method_not_allowed" is coming from
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const { stationName, lineId, city, qrToken, userQuestion } = req.body || {};

    if (!stationName || !lineId || !qrToken) {
      return res.status(400).json({ error: "missing_params" });
    }

    const lineLabel = String(lineId || "").toUpperCase();

    const prompt = `
You are an AI guide for a Metro Manila train ticketing app called EazeMo.

User context:
- Station: ${stationName}
- Line: ${lineLabel}
- City/Area: ${city || "Unknown"}
- Ticket token (do NOT reveal or repeat as-is to users): ${qrToken}

User question (if any):
${userQuestion || "No specific question. Give a general step-by-step guide."}

Write a clear, concise step-by-step guide for the commuter.
Use numbered steps, be practical, do not repeat or reveal the raw token.
    `.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a transit assistant for a Metro Manila LRT/MRT ticketing app. Be concrete, procedural, and concise.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No guide generated.";

    return res.status(200).json({ text });
  } catch (e) {
    console.error("AI guide route error >>>", e);
    return res.status(500).json({ error: "server_error" });
  }
}
