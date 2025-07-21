require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const line = require('@line/bot-sdk');
const axios = require('axios');

// raw body 保持（署名検証に必要）
const rawBodySaver = (req, res, buf) => {
  req.rawBody = buf;
};

const app = express();

// Webhookエンドポイントだけrawで受ける（ここ超重要）
app.use('/webhook', bodyParser.raw({ type: '*/*', verify: rawBodySaver }));

// LINE構成
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// Webhookルート
app.post('/webhook', line.middleware(config), async (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(error => {
      console.error('イベント処理中のエラー:', error);
      res.status(500).end();
    });
});

// メッセージイベントの処理
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'image') {
    return Promise.resolve(null);
  }

  const messageId = event.message.id;

  // LINE画像を取得
  const stream = await client.getMessageContent(messageId);
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // GoFileにアップロード
  const gofileRes = await axios.post('https://store1.gofile.io/uploadFile', buffer, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  const directLink = gofileRes.data.data.downloadPage;

  // Vision APIに送信
  const visionRes = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'この画像を解析して日本語で説明して。' },
            { type: 'image_url', image_url: { url: directLink } },
          ],
        },
      ],
      max_tokens: 1000,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const replyText = visionRes.data.choices[0].message.content;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText,
  });
}

// ポート設定（RenderやRailway用）
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
