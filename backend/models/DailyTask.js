import mongoose from 'mongoose';

const dailyTaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Open' },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  dateKey: { type: String, required: true } // format YYYY-MM-DD for quick daily filtering
});

export default mongoose.model('DailyTask', dailyTaskSchema);
