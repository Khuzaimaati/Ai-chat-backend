export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(200).json({
      success: false,
      message: "Only POST allowed"
    });
  }

  try {
    const { message } = req.body || {};

    // Check message
    if (!message) {
      return res.status(200).json({
        success: false,
        message: "Message missing"
      });
    }

    // GROQ API call
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "Detect the user's language and reply in the same language. Keep answers very short (maximum 2 sentences). Do not switch language."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 60
        })
      }
    );

    const data = await response.json();

    let reply = "No response";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    return res.status(200).json({
      success: true,
      message: reply
    });

  } catch (error) {
    console.error("Server Error:", error);

    return res.status(200).json({
      success: false,
      message: "Server error, try again"
    });
  }
}
