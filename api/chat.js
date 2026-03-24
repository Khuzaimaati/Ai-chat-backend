export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Message missing" });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("FULL RESPONSE:", JSON.stringify(data)); // 🔥 important

    let reply = "No response";

    // ✅ main case
    if (data && data.choices && data.choices.length > 0) {
      reply = data.choices[0].message?.content || "Empty reply";
    }

    // ❗ error case
    if (data.error) {
      reply = "Error: " + data.error.message;
    }

    // 🔥 fallback (debug)
    if (reply === "No response") {
      reply = JSON.stringify(data);
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);

    return res.status(200).json({
      reply: "Server busy, try again",
    });
  }
}
