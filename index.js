require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const rawBodySaver = (req, res, buf) => { req.rawBody = buf; };

const app = express();
app.use(express.json({ verify: rawBodySaver }));

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then(result => res.json(result));
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'image') {
    return Promise.resolve(null);
  }

  const messageId = event.message.id;
  const stream = await client.getMessageContent(messageId);

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const gofileRes = await axios.post("https://store1.gofile.io/uploadFile", buffer, {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });

  const directLink = gofileRes.data.data.downloadPage;

  const visionRes = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-4-vision-preview",
    messages: [{
      role: "user",
      content: [
        { type: "text", text: "この画像を解析して日本語で説明して。" },
        { type: "image_url", image_url: { url: directLink } }
      ]
    }],
    max_tokens: 1000
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const replyText = visionRes.data.choices[0].message.content;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText
  });
}

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});