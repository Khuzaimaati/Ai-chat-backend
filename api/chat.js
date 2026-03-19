export default async function handler(req, res) {
  // ✅ CORS (VERY IMPORTANT)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔥 HuggingFace API call (LATEST)
    const hfRes = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3-8b-instruct",
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: message }
          ],
          max_tokens: 200
        }),
      }
    );

    const data = await hfRes.json();

    // ❗ Agar HF error aaye
    if (!hfRes.ok) {
      console.error("HF ERROR:", data);
      return res.status(500).json({
        error: "HuggingFace API error",
        details: data
      });
    }

    // ✅ Proper reply extract
    let reply =
      data?.choices?.[0]?.message?.content ||
      data?.generated_text ||
      (Array.isArray(data) ? data[0]?.generated_text : null);

    // ❗ fallback (safe)
    if (!reply) {
      reply = "AI is not responding properly. Please try again.";
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("SERVER CRASH:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
}
