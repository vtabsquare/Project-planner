import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { google } from 'googleapis';

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'User not found in system matrix' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid security key' });

    req.session.userId = user._id;
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'System processing error: ' + error.message });
  }
};

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Entity already exists in database' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F5840B&color=fff`
    });

    req.session.userId = user._id;
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failure: ' + error.message });
  }
};

export const getProfile = async (req, res) => {
  // Check Google Tokens first
  if (req.session?.tokens) {
    try {
      const client = new google.auth.OAuth2();
      client.setCredentials(req.session.tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data } = await oauth2.userinfo.get();

      // Cross-reference with MongoDB to get the assigned role
      const dbUser = await User.findOne({ email: data.email.toLowerCase() });
      if (dbUser) {
        return res.json({
          name: dbUser.name || data.name,
          email: dbUser.email,
          picture: dbUser.picture || data.picture,
          role: dbUser.role
        });
      }
      // New Google user - return without role (will be 'user' by default)
      return res.json({ ...data, role: 'user' });
    } catch (error) {
      // Fall through to session userId if token fails
    }
  }

  // Check MongoDB session
  if (req.session?.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) return res.json({ name: user.name, email: user.email, picture: user.picture, role: user.role });
    } catch (error) {
      // Fall through
    }
  }

  res.status(401).json({ error: 'Not authenticated' });
};

export const logout = (req, res) => {
  req.session = null;
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
  }
};

export const createUser = async (req, res) => {
  const { email, password, name, role = 'user' } = req.body;
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=334155&color=fff`
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user: ' + error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.session.userId) {
      return res.status(400).json({ error: 'Cannot decommission own administrative entity' });
    }
    await User.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Decommissioning failure: ' + error.message });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, name, role } = req.body;
  try {
    const updateData = { 
      email: email.toLowerCase(), 
      name, 
      role,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=334155&color=fff`
    };
    
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Update failure: ' + error.message });
  }
};
