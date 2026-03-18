export default async function handler(req, res) {
  // ✅ CORS fix (VERY IMPORTANT)
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
    const { userId, message, premium } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    const hfToken = process.env.HF_TOKEN;

    if (!hfToken) {
      return res.status(500).json({ error: "HF token missing" });
    }

    // ✅ WORKING FREE MODEL
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: message
        })
      }
    );

    const data = await response.json();

    console.log("HF Response:", data); // 🔍 DEBUG

    // ✅ Safe response handling
    let reply = "No response";

    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else if (data.error) {
      reply = "AI Error: " + data.error;
    }

    return res.status(200).json({
      reply
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server crashed",
      detail: err.message
    });
  }
}
