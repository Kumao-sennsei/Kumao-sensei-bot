const axios = require('axios');
const FormData = require('form-data');

async function uploadImage(stream) {
  const form = new FormData();
  form.append('file', stream, {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  });

  const res = await axios.post('https://store1.gofile.io/uploadFile', form, {
    headers: form.getHeaders()
  });

  return res.data.data.downloadPage.replace('downloadPage', 'directLink');
}

module.exports = { uploadImage };