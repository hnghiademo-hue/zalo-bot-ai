const fetch = require('node-fetch');
const { GoogleGenAI } = require('@google/genai');

// Mảng lưu log tin nhắn tạm thời trong RAM của serverless
global.chatLogs = global.chatLogs || [];

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    console.log("Nhận Zalo Webhook:", body);

    // Lấy token từ cấu hình hệ thống hiện tại
    const config = global.appConfig || {};
    const zaloToken = config.zaloBotToken || process.env.ZALO_ACCESS_TOKEN;
    const geminiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;

    const eventName = body.event_name;
    const senderId = body.sender?.id;

    if (eventName === 'user_send_text') {
      const userText = body.message.text;

      // Lưu log tin nhắn
      global.chatLogs.unshift({
        msgId: body.message.msg_id || Date.now().toString(),
        senderId: senderId,
        type: 'text',
        content: userText,
        timestamp: new Date()
      });

      // Gọi Gemini AI phản hồi
      let aiResponseText = "Xin chào! Bot đã nhận được tin nhắn của bạn.";
      if (geminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Bạn là trợ lý AI thông minh trên Zalo. Khách hàng nhắn: "${userText}". Hãy trả lời ngắn gọn, lịch sự bằng tiếng Việt.`
          });
          if (response.text) aiResponseText = response.text;
        } catch (aiErr) {
          console.error("Lỗi Gemini AI:", aiErr);
        }
      }

      // Gửi tin nhắn về Zalo
      await sendZaloMessage(senderId, aiResponseText, zaloToken);

    } else if (['user_send_image', 'user_send_file', 'user_send_video'].includes(eventName)) {
      const mediaUrl = body.message.url || body.message.file_url;
      const msgType = eventName.replace('user_send_', '');

      // Lưu media backup
      global.chatLogs.unshift({
        msgId: body.message.msg_id || Date.now().toString(),
        senderId: senderId,
        type: msgType,
        content: mediaUrl,
        fileName: body.message.file_name || `download_${Date.now()}`,
        timestamp: new Date()
      });

      await sendZaloMessage(senderId, `Hệ thống đã backup ${msgType} của bạn thành công trên Web!`, zaloToken);
    }

    return { statusCode: 200, body: JSON.stringify({ status: 'success' }) };
  } catch (error) {
    console.error("Webhook Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

async function sendZaloMessage(userId, text, token) {
  if (!token) return;
  try {
    await fetch('https://openapi.zalo.me/v2.0/oa/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'access_token': token },
      body: JSON.stringify({ recipient: { user_id: userId }, message: { text: text } })
    });
  } catch (err) {
    console.error("Zalo API Error:", err);
  }
}