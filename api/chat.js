export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const hfToken = process.env.HF_TOKEN;

    // ✅ NEW API URL
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: message
        })
      }
    );

    const data = await response.json();

    let reply = "No response";

    if (Array.isArray(data)) {
      reply = data[0]?.generated_text || reply;
    } else if (data.generated_text) {
      reply = data.generated_text;
    } else if (data.error) {
      reply = "AI Error: " + data.error;
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
