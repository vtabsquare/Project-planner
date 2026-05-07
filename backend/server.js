import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieSession from 'cookie-session';
import { google } from 'googleapis';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Import New Structure
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';

dotenv.config();

const requiredEnv = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET', 'MONGODB_URI'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('CRITICAL ERROR: Missing required environment variables:');
  missingEnv.forEach(key => console.error(` - ${key}`));
  process.exit(1);
}

// Dynamic APP_URL: Use environment variable or default to localhost
const APP_URL = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'profile',
  'email'
];

async function seedSystemUsers() {
  const adminPassword = await bcrypt.hash('Sanjay@1306', 10);
  const userPassword = await bcrypt.hash('User@123', 10);
  
  const admins = [
    { email: 'sanjaysaravanan130604@gmail.com', name: 'Sanjay Saravanan' },
    { email: 'sanjaysaravanan.vtab@gmail.com', name: 'Sanjay VTAB' }
  ];

  const standardUsers = [
    { email: 'user1@aethertracker.com', name: 'Alpha Operator' },
    { email: 'user2@aethertracker.com', name: 'Beta Operator' },
    { email: 'user3@aethertracker.com', name: 'Gamma Operator' }
  ];

  for (const admin of admins) {
    const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=F5840B&color=fff`;
    await User.findOneAndUpdate(
      { email: admin.email },
      { 
        $setOnInsert: { password: adminPassword, name: admin.name, picture },
        $set: { role: 'admin' }
      },
      { upsert: true, new: true }
    );
  }

  for (const user of standardUsers) {
    const picture = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=334155&color=fff`;
    await User.findOneAndUpdate(
      { email: user.email },
      { $setOnInsert: { password: userPassword, name: user.name, picture, role: 'user' } },
      { upsert: true, new: true }
    );
  }

  console.log('System Security Seeding: OK');
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Trust proxy for Render/Cloud environments
  app.set('trust proxy', 1);

  // Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  // CORS Configuration — dynamic for local dev and Render production
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    APP_URL,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) and listed origins
      if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('onrender.com')) {
        callback(null, true);
      } else {
        console.warn(`CORS attempt from blocked origin: ${origin}`);
        callback(null, true); // Be more permissive in dev if needed, or stick to strict
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('MongoDB: Connected');
      seedSystemUsers();
    })
    .catch(err => console.error('MongoDB Error:', err));

  app.use(express.json());
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }));

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${APP_URL}/auth/callback`
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/data', dataRoutes);

  app.get('/api/auth/url', (req, res) => {
    const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
    res.json({ url });
  });

  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');
    try {
      const { tokens } = await oauth2Client.getToken(code);
      req.session.tokens = tokens;

      // Sync with MongoDB User
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      let user = await User.findOne({ email: data.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          email: data.email.toLowerCase(),
          name: data.name,
          picture: data.picture,
          source: 'google'
        });
      }
      req.session.userId = user._id;

      res.send('<html><body><script>if (window.opener) { window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS" }, "*"); window.close(); } else { window.location.href = "/"; }</script></body></html>');
    } catch (error) {
      res.status(500).send('Auth failed: ' + error.message);
    }
  });

  app.get('/api/sheets/find', async (req, res) => {
    if (!req.session?.tokens) return res.status(401).json({ error: 'Unauthorized' });
    const auth = new google.auth.OAuth2();
    auth.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth });
    try {
      const response = await drive.files.list({ 
        q: "name = 'AetherTracker_Data' and mimeType = 'application/vnd.google-apps.spreadsheet'", 
        fields: 'files(id, name)', 
        spaces: 'drive' 
      });
      res.json(response.data.files[0] || null);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
    res.sendFile(path.join(distPath, 'index.html'));
  });

  const server = app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERROR: Port ${PORT} is in use. Run 'npx kill-port ${PORT}' and restart.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

startServer();
