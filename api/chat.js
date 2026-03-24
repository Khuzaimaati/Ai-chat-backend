export default async function handler(req, res) {
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

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "user", content: message }
          ],
        }),
      }
    );

    const data = await response.json();

    let reply = "No response";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    return res.status(200).json({
      success: true,
      message: reply,   // ✅ IMPORTANT CHANGE
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      message: "Server error, try again"
    });
  }
}
