const fetch = require('node-fetch');

// Biến toàn cục lưu bộ nhớ tạm thời trên serverless (hoặc bạn có thể thay bằng dịch vụ như JSONBin nếu muốn lưu lâu dài)
global.appConfig = global.appConfig || {
  zaloBotToken: process.env.ZALO_ACCESS_TOKEN || '',
  zaloSecretToken: process.env.ZALO_SECRET_TOKEN || '',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};

exports.handler = async function(event) {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(global.appConfig)
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { zaloBotToken, zaloSecretToken, geminiApiKey, notifyUserId } = JSON.parse(event.body);

      // Cập nhật giá trị vào biến toàn cục
      global.appConfig.zaloBotToken = zaloBotToken;
      global.appConfig.zaloSecretToken = zaloSecretToken;
      global.appConfig.geminiApiKey = geminiApiKey;

      const now = new Date();
      const timeString = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      // Nếu có nhập ID Zalo để nhận thông báo
      if (notifyUserId && zaloBotToken) {
        const messageText = `[THÔNG BÁO HỆ THỐNG]\n\n⏰ Ngày giờ: ${timeString}\n✅ Uploads success token mới thành công!\n\nVui lòng sử dụng token sau để tích hợp HTTP API:\n${zaloBotToken}`;

        await fetch('https://openapi.zalo.me/v2.0/oa/message', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'access_token': zaloBotToken 
          },
          body: JSON.stringify({
            recipient: { user_id: notifyUserId },
            message: { text: messageText }
          })
        });
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Cập nhật Token thành công!', data: global.appConfig })
      };
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};