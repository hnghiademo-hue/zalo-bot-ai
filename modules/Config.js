const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., 'system_config'
  zaloBotToken: { type: String, default: '' },
  zaloSecretToken: { type: String, default: '' },
  geminiApiKey: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Config || mongoose.model('Config', ConfigSchema);  