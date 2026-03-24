export default async function handler(req, res) {
  // Only POST allow
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

    // Call GROQ API
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
              content: "Reply in maximum 2 short sentences only."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 30
        })
      }
    );

    const data = await response.json();

    let reply = "No response";

    if (data?.choices?.[0]?.message?.content) {
      reply = data.choices[0].message.content;
    }

    // Final response (IMPORTANT for app)
    return res.status(200).json({
      success: true,
      message: reply
    });

  } catch (error) {
    console.error(error);

    return res.status(200).json({
      success: false,
      message: "Server error, try again"
    });
  }
}
