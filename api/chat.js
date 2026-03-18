// File: /api/chat.js
import fetch from "node-fetch";

// In-memory user limits (reset daily)
let userLimits = {}; // { userId: { count: number, lastReset: date, premium: boolean } }

// Free user daily limit
const FREE_LIMIT = 20;

export default async function handler(req, res) {
  // --- CORS Headers ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  try {
    const { userId, message, premium } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message" });
    }

    // --- Check & Reset Daily Limit ---
    const today = new Date().toDateString();
    if (!userLimits[userId] || userLimits[userId].lastReset !== today) {
      userLimits[userId] = { count: 0, lastReset: today, premium: !!premium };
    }
    userLimits[userId].premium = !!premium;

    if (!userLimits[userId].premium && userLimits[userId].count >= FREE_LIMIT) {
      return res.status(403).json({ 
        error: "Daily limit reached", 
        ads: "Show ads here for free user" 
      });
    }

    if (!userLimits[userId].premium) userLimits[userId].count += 1;

    // --- Hugging Face API Call ---
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) return res.status(500).json({ error: "HF token missing" });

    // Use a safe & free model
    const model = premium ? "distilgpt2" : "distilgpt2";

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: message,
          parameters: { max_new_tokens: 50 }
        })
      }
    );

    const text = await response.text();

    // Safe JSON parse
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON from HF",
        raw: text
      });
    }

    // Extract reply safely
    let reply = "No response";
    if (Array.isArray(data)) {
      reply = data[0]?.generated_text || JSON.stringify(data);
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else if (data.error) {
      reply = "HF Error: " + data.error;
    } else {
      reply = JSON.stringify(data);
    }

    // Send response
    return res.status(200).json({
      reply,
      remainingFree: FREE_LIMIT - (userLimits[userId].count || 0),
      premium: userLimits[userId].premium,
      ads: !userLimits[userId].premium ? "Show ad here" : null
    });

  } catch (err) {
    console.error("FULL ERROR:", err);
    return res.status(500).json({ error: "Server crashed", detail: err.message });
  }
  }
