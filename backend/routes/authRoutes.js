import express from 'express';
import { login, register, getProfile, logout, getUsers, createUser, deleteUser, updateUser } from '../controllers/authController.js';
import User from '../models/User.js';

const router = express.Router();

const isAdmin = async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await User.findById(req.session.userId);
    if (user?.role !== 'admin') return res.status(403).json({ error: 'Access denied: Admin only' });
    next();
  } catch (error) {
    res.status(500).json({ error: 'Auth check failure' });
  }
};

router.post('/login', login);
router.post('/register', register);
router.get('/me', getProfile);
router.post('/logout', logout);

// Admin Routes
router.get('/users', isAdmin, getUsers);
router.post('/users', isAdmin, createUser);
router.put('/users/:id', isAdmin, updateUser);
router.delete('/users/:id', isAdmin, deleteUser);

export default router;
