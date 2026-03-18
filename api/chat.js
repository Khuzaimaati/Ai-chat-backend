export default async function handler(req, res) {

  // ✅ ALWAYS set CORS first
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  // ✅ Handle preflight request
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

    // ✅ Hugging Face
    const hfToken = process.env.HF_TOKEN;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: message })
      }
    );

    const data = await response.json();

    let reply = "No response";

    if (Array.isArray(data)) {
      reply = data[0]?.generated_text || reply;
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else if (data.error) {
      reply = "Error: " + data.error;
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
