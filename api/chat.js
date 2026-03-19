export default async function handler(req, res) {
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
      return res.status(400).json({ error: "No message provided" });
    }

    const hfRes = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          messages: [{ role: "user", content: message }],
        }),
      }
    );

    const data = await hfRes.json();

    // 🔥 ADD THIS (VERY IMPORTANT)
    if (!hfRes.ok) {
      console.error("HF ERROR:", data);
      return res.status(500).json({
        error: "HF API Error",
        details: data,
      });
    }

    let reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(200).json({
        reply: "AI replied empty (model issue)",
        raw: data
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
                                }
