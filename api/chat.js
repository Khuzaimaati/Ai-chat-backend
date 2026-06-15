export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Backend is running 🚀"
    });
  }

  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message missing"
      });
    }

    const msg = message.trim().toLowerCase();

    // Greetings
    if (msg === "hello" || msg === "hi") {
      return res.status(200).json({
        success: true,
        message: "Hello!"
      });
    }

    if (
      msg === "assalamualaikum" ||
      msg === "assalamu alaikum"
    ) {
      return res.status(200).json({
        success: true,
        message: "Walikum assalam"
      });
    }

    // Groq AI
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
                "Reply in the same language as the user. Keep answers short and helpful."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 200
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

    return res.status(200).json({
      success: true,
      message: reply
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
