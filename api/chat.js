// In-memory user limits (reset daily)
let userLimits = {}; // { userId: { count: number, lastReset: date, premium: boolean } }

const FREE_LIMIT = 20;

export default async function handler(req, res) {
  try {

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST requests allowed" });
    }

    const { userId, message, premium } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message" });
    }

    // Reset daily limit
    const today = new Date().toDateString();

    if (!userLimits[userId] || userLimits[userId].lastReset !== today) {
      userLimits[userId] = {
        count: 0,
        lastReset: today,
        premium: !!premium
      };
    }

    // Update premium status
    userLimits[userId].premium = !!premium;

    // Limit check
    if (!userLimits[userId].premium && userLimits[userId].count >= FREE_LIMIT) {
      return res.status(403).json({
        error: "Daily limit reached",
        remainingFree: 0,
        ads: "Watch Ad to Unlock 5 messages"
      });
    }

    // Increase message count
    if (!userLimits[userId].premium) {
      userLimits[userId].count += 1;
    }

    // Hugging Face API token
    const hfToken = process.env.HF_TOKEN;

    if (!hfToken) {
      return res.status(500).json({ error: "HF_TOKEN not set in environment variables" });
    }

    // Select AI model
    const model = userLimits[userId].premium
      ? "mistralai/Mistral-7B-Instruct-v0.2"
      : "microsoft/DialoGPT-medium";

    // Call Hugging Face
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: message
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.generated_text ||
      data?.[0]?.generated_text ||
      "Sorry, AI did not respond.";

    res.status(200).json({
      reply: reply,
      premium: userLimits[userId].premium,
      remainingFree: userLimits[userId].premium
        ? null
        : FREE_LIMIT - userLimits[userId].count,
      ads: !userLimits[userId].premium
        ? "Show banner ad"
        : null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
