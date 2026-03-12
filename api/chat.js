// api/chat.js
import fetch from "node-fetch";

// In-memory user limits (reset daily)
let userLimits = {}; // { userId: { count: number, lastReset: date, premium: boolean } }

// Free user daily limit
const FREE_LIMIT = 20;

export default async function handler(req, res) {
  try {
    const { userId, message, premium } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message" });
    }

    // Check and reset daily limit
    const today = new Date().toDateString();
    if (!userLimits[userId] || userLimits[userId].lastReset !== today) {
      userLimits[userId] = { count: 0, lastReset: today, premium: !!premium };
    }

    // Update premium status if changed
    userLimits[userId].premium = !!premium;

    // Free user limit check
    if (!userLimits[userId].premium && userLimits[userId].count >= FREE_LIMIT) {
      return res.status(403).json({
        error: "Daily limit reached",
        ads: "Watch Ad to Unlock 5 messages",
        remainingFree: 0,
      });
    }

    // Increment message count if not premium
    if (!userLimits[userId].premium) userLimits[userId].count += 1;

    // Hugging Face API token from environment variable
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return res.status(500).json({ error: "Server token not set" });
    }

    // Select model based on premium status
    const model = userLimits[userId].premium
      ? "mistralai/Mistral-7B-Instruct-v0.2"
      : "microsoft/DialoGPT-medium";

    // Call Hugging Face inference API
    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: message }),
      }
    );

    const data = await hfResponse.json();

    // Extract reply
    const reply = data?.generated_text || data?.[0]?.generated_text || "Sorry, no response";

    // Send final response
    res.status(200).json({
      reply,
      remainingFree: userLimits[userId].premium
        ? null
        : FREE_LIMIT - (userLimits[userId].count || 0),
      premium: userLimits[userId].premium,
      ads:
        !userLimits[userId].premium && userLimits[userId].count >= FREE_LIMIT
          ? "Watch Ad to Unlock 5 messages"
          : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
