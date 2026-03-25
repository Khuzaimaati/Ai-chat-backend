export default async function handler(req, res) {
  // ✅ CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Preflight request handle
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ Only POST allowed
  if (req.method !== "POST") {
    return res.status(200).json({
      success: false,
      message: "Only POST allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(200).json({
        success: false,
        message: "Message missing"
      });
    }

    // 🔥 GROQ API CALL
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `
You MUST follow these rules strictly:
- Reply in the EXACT same language as the user.
- NEVER change language.
- Do not translate.
- Keep reply very short (max 2 sentences).
`
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 60
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "No response";

    return res.status(200).json({
      success: true,
      message: reply
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(200).json({
      success: false,
      message: "Server error, try again"
    });
  }
}
