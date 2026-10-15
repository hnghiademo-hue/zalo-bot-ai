const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  msgId: { type: String },
  senderId: { type: String, required: true },
  type: { type: String, required: true }, // 'text', 'image', 'video', 'file'
  content: { type: String }, // Nội dung text hoặc URL media
  fileName: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Log || mongoose.model('Log', LogSchema);