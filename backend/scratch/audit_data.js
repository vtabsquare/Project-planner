import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import User from '../models/User.js';

dotenv.config({ path: '../.env' });

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const projects = await Project.find({});
    const users = await User.find({});

    console.log('\n--- USERS ---');
    users.forEach(u => console.log(`${u.email} (${u.role}) ID: ${u._id}`));

    console.log('\n--- PROJECTS ---');
    projects.forEach(p => console.log(`Project: ${p.name} | Owner ID: ${p.userId}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
