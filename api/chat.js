export default async function handler(req, res) {

  const response = await fetch(
    "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: req.body.message
      })
    }
  );

  const data = await response.json();

  res.status(200).json(data);
}
