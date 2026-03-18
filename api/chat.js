export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    const hfToken = process.env.HF_TOKEN;

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/google/flan-t5-base",
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

    const text = await response.text(); // 👈 IMPORTANT

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: "Invalid JSON",
        raw: text
      });
    }

    // 🔥 HANDLE ALL CASES
    let reply = "No response";

    if (Array.isArray(data)) {
      reply = data[0]?.generated_text || JSON.stringify(data);
    } 
    else if (data.generated_text) {
      reply = data.generated_text;
    } 
    else if (data.error) {
      reply = "HF Error: " + data.error;
    } 
    else {
      reply = JSON.stringify(data);
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      error: "Server crashed",
      detail: err.message
    });
  }
}
