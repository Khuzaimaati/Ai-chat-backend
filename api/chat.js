export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
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

    console.log("HF FULL RESPONSE:", JSON.stringify(data));

    // SAFE extraction (no crash)
    let reply = "No response from AI";

// New format (chat)
if (data?.choices?.[0]?.message?.content) {
  reply = data.choices[0].message.content;
}
// Old format (some HF models)
else if (data?.generated_text) {
  reply = data.generated_text;
}
// Array format
else if (Array.isArray(data) && data[0]?.generated_text) {
  reply = data[0].generated_text;
}

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("ERROR:", err);

    return res.status(500).json({
      error: "Server crashed",
      details: err.message,
    });
  }
}
