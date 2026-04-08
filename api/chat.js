export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

    const msg = message.trim().toLowerCase();

    // 🔥 SIMPLE LANGUAGE DETECTION
    let detectedLanguage = "Unknown";

    if (msg.includes("assalam") || msg.includes("kia") || msg.includes("hai")) {
      detectedLanguage = "Urdu";
    } else if (msg.includes("bonjour")) {
      detectedLanguage = "French";
    } else if (msg.includes("halo") || msg.includes("apa")) {
      detectedLanguage = "Malay";
    } else if (msg.includes("hello") || msg.includes("hi")) {
      detectedLanguage = "English";
    }

    // 🔥 FIXED GREETING RESPONSES
    if (msg === "hello" || msg === "hi") {
      return res.status(200).json({
        success: true,
        language: "English",
        message: "Hello!"
      });
    }

    if (msg === "assalamualaikum" || msg === "assalamu alaikum") {
      return res.status(200).json({
        success: true,
        language: "Urdu",
        message: "Walikum assalam"
      });
    }

    if (msg === "bonjour") {
      return res.status(200).json({
        success: true,
        language: "French",
        message: "Bonjour!"
      });
    }

    // 🔥 AI CALL (only if not greeting)
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
Reply in the EXACT same language as the user.
Keep answer very short (max 10 sentences).
`
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 100
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content || "No response";

    return res.status(200).json({
      success: true,
      language: detectedLanguage,
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
