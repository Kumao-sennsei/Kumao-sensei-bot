require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// ミドルウェア登録
app.post('/webhook', line.middleware(config), (req, res) => {
  const events = req.body.events;
  const client = new line.Client(config);

  Promise.all(events.map(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `くまお先生だよ！「${event.message.text}」って言ったね🐻`,
      });
    }
    return Promise.resolve(null);
  }))
  .then(result => res.json(result))
  .catch(err => {
    console.error(err);
    res.status(500).end();
  });
});

// 🔥 Railwayで必要な書き方（必須！）
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
