const axios = require('axios');

async function analyzeImage(imageUrl) {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "以下の画像を見て日本語でわかりやすく説明してください（数式も含めて）。" },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 1000
  }, {
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  return response.data.choices[0].message.content;
}

module.exports = { analyzeImage };