const express = require('express');
const line = require('@line/bot-sdk');
const dotenv = require('dotenv');
const gofile = require('./gofile');
const openai = require('./openai');
const replyMessage = require('./replyMessage');

dotenv.config();

const app = express();
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  const events = req.body.events;
  for (let event of events) {
    if (event.type === 'message' && event.message.type === 'image') {
      try {
        const stream = await client.getMessageContent(event.message.id);
        const imageUrl = await gofile.uploadImage(stream);
        const visionReply = await openai.analyzeImage(imageUrl);
        const finalReply = replyMessage.format(visionReply);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: finalReply
        });
      } catch (err) {
        console.error(err);
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: '画像の処理中にエラーが発生しました。'
        });
      }
    }
  }
  res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});