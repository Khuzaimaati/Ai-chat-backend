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
    const { message, premium } = req.body || {};

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

    if (msg === "bonjour") {
      return res.status(200).json({
        success: true,
        message: "Bonjour!"
      });
    }

    // Premium Settings
    const model = premium
   ?  "Llama 3 70B-versatile"
   : "llama-3.1-8b-instant";

    const maxTokens = premium ? 500 : 200;

    // AI Call
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are Zyrobot, a smart, helpful and friendly AI assistant. Reply in the same language as the user."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: premium ? 0.9 : 0.7,
          max_tokens: maxTokens
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        message:
          data?.error?.message ||
          "Groq API Error"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response";

    return res.status(200).json({
      success: true,
      premium,
      model,
      message: reply
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
