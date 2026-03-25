export default async function handler(req, res) {
  // ✅ CORS HEADERS (IMPORTANT)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Handle preflight request
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
              content:
                "Detect the user's language and reply in the same language. Keep answers very short (maximum 2 sentences)."
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
