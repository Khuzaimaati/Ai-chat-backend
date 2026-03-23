export default async function handler(req, res) {
  // Only POST allow
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    // HuggingFace API call
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
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 200,
        }),
      }
    );

    const data = await hfRes.json();

    // 🔥 Debug log (very important)
    console.log("HF RESPONSE:", JSON.stringify(data));

    // ✅ Smart reply extraction (ALL formats)
    let reply = "No response from AI";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    } else if (data?.generated_text) {
      reply = data.generated_text;
    } else if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data?.error) {
      reply = "HF Error: " + (data.error.message || "Unknown error");
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server crashed",
      details: err.message,
    });
  }
}
