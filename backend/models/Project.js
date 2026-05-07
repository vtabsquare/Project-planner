import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  version: { type: String, required: true },
  description: String,
  status: { type: String, default: 'Active' },
  estimatedCompletionDate: String,
  finalizedAt: Date,
  coordinators: [{
    name: { type: String, required: true },
    email: { type: String, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique project+version per user
projectSchema.index({ userId: 1, name: 1, version: 1 }, { unique: true });

export default mongoose.model('Project', projectSchema);
