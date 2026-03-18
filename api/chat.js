export default async function handler(req, res) {

  // ✅ CORS (VERY IMPORTANT)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  try {
    const { userId, message, premium } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message" });
    }

    // ✅ Free limit system
    const FREE_LIMIT = 20;
    global.userLimits = global.userLimits || {};

    const today = new Date().toDateString();

    if (!global.userLimits[userId] || global.userLimits[userId].date !== today) {
      global.userLimits[userId] = {
        count: 0,
        date: today,
        premium: !!premium
      };
    }

    // update premium status
    global.userLimits[userId].premium = !!premium;

    // check limit
    if (!global.userLimits[userId].premium &&
        global.userLimits[userId].count >= FREE_LIMIT) {

      return res.status(403).json({
        error: "Daily limit reached",
        ads: "Show ad here"
      });
    }

    // increment usage
    if (!premium) {
      global.userLimits[userId].count += 1;
    }

    // ✅ Hugging Face API
    const hfToken = process.env.HF_TOKEN;

    const model = premium
      ? "mistralai/Mistral-7B-Instruct-v0.2"
      : "HuggingFaceH4/zephyr-7b-beta";

    const response
