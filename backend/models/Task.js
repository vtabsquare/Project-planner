import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: String, required: true },
  version: { type: String, required: true },
  name: { type: String, required: true },
  status: { type: String, default: 'Open' },
  priority: { type: String, default: 'Medium' },
  dueDate: Date,
  prerequisites: [String],
  description: String,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  subtasks: [{
    name: String,
    status: { type: String, default: 'Open' },
    createdAt: { type: Date, default: Date.now }
  }],
  history: [{
    status: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

export default mongoose.model('Task', taskSchema);
