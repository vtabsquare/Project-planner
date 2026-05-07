import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/Project.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function fixAndCheckData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fix roles
    const admins = ['sanjaysaravanan130604@gmail.com', 'sanjaysaravanan.vtab@gmail.com'];
    const adminPassword = await bcrypt.hash('Sanjay@1306', 10);
    for (const email of admins) {
      await User.updateOne({ email }, { $set: { role: 'admin' } });
      console.log(`Updated ${email} to admin`);
    }

    // Add new users
    const userPassword = await bcrypt.hash('User@123', 10);
    const standardUsers = [
        { email: 'user1@aethertracker.com', name: 'Alpha Operator' },
        { email: 'user2@aethertracker.com', name: 'Beta Operator' },
        { email: 'user3@aethertracker.com', name: 'Gamma Operator' }
    ];

    for (const u of standardUsers) {
        const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=334155&color=fff`;
        await User.findOneAndUpdate(
            { email: u.email },
            { $setOnInsert: { password: userPassword, name: u.name, picture, role: 'user' } },
            { upsert: true, new: true }
        );
        console.log(`Ensured user exists: ${u.email}`);
    }

    const projects = await Project.find({});
    const users = await User.find({});

    console.log('\n--- USERS ---');
    users.forEach(u => console.log(`${u.email} (${u.role}) ID: ${u._id}`));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixAndCheckData();
