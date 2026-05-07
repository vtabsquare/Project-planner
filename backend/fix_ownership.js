import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/Project.js';
import User from './models/User.js';
import Task from './models/Task.js';

dotenv.config();

async function fixOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ email: 'sanjaysaravanan.vtab@gmail.com' });
    const normalUser = await User.findOne({ email: 'user@aethertracker.com' });

    if (!admin || !normalUser) {
      console.error('Users not found');
      return;
    }

    console.log(`Admin ID: ${admin._id}`);
    console.log(`User ID: ${normalUser._id}`);

    // Move 'vtab' and 'vtabhouse' to admin
    const projectNamesToMove = ['vtab', 'vtabhouse'];
    
    for (const name of projectNamesToMove) {
      const result = await Project.updateMany(
        { name, userId: normalUser._id },
        { $set: { userId: admin._id } }
      );
      console.log(`Moved ${result.modifiedCount} project documents for "${name}" to Admin`);
      
      const taskResult = await Task.updateMany(
        { project: name, userId: normalUser._id },
        { $set: { userId: admin._id } }
      );
      console.log(`Moved ${taskResult.modifiedCount} task documents for "${name}" to Admin`);
    }

    console.log('\nData Correction Complete.');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixOwnership();
