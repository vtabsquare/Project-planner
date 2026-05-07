import mongoose from 'mongoose';

const launchItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  version: { type: String, default: '1.0.0' },
  build: { type: String, default: 'B1' },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('LaunchItem', launchItemSchema);
