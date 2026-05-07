import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import DailyTask from '../models/DailyTask.js';
import LaunchItem from '../models/LaunchItem.js';
import User from '../models/User.js';
import { sendCoordinatorEmail } from '../utils/emailService.js';

const router = express.Router();

// Middleware to ensure user is logged in
const isAuthenticated = async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.userRole = user.role;
    req.userEmail = user.email; // Attach user email
    next();
  } catch (e) {
    res.status(500).json({ error: 'Auth system failure' });
  }
};

router.use(isAuthenticated);

// --- PROJECT ROUTES ---

router.get('/projects', async (req, res) => {
  try {
    let query = {};
    if (req.userRole !== 'admin') {
      query = {
        $or: [
          { userId: req.session.userId },
          { "coordinators.email": { $regex: new RegExp(`^${req.userEmail}$`, 'i') } }
        ]
      };
    }
    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/projects', async (req, res) => {
  try {
    console.log('CREATE_PROJECT_REQUEST:', { body: req.body, userId: req.session.userId });
    const project = new Project({ ...req.body, userId: req.session.userId });
    await project.save();
    console.log('PROJECT_CREATED_SUCCESS:', project._id);
    res.json(project);
  } catch (e) {
    console.error('CREATE_PROJECT_ERROR:', e.message);
    res.status(400).json({ error: e.message });
  }
});

router.put('/projects/:name/:version', async (req, res) => {
  try {
    const { name, version } = req.params;
    const filter = req.userRole === 'admin' ? { name, version } : { userId: req.session.userId, name, version };
    const project = await Project.findOneAndUpdate(
      filter,
      req.body,
      { new: true }
    );
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/projects/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const filter = req.userRole === 'admin' ? { name } : { userId: req.session.userId, name };
    await Project.deleteMany(filter);
    await Task.deleteMany({ project: name, ...(req.userRole === 'admin' ? {} : { userId: req.session.userId }) });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/projects/:name/:version', async (req, res) => {
  try {
    const { name, version } = req.params;
    const filter = req.userRole === 'admin' ? { name, version } : { userId: req.session.userId, name, version };
    await Project.deleteOne(filter);
    await Task.deleteMany({ project: name, version, ...(req.userRole === 'admin' ? {} : { userId: req.session.userId }) });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/projects/close', async (req, res) => {
  try {
    const { name, version } = req.body;
    const filter = req.userRole === 'admin' ? { name, version } : { userId: req.session.userId, name, version };
    const project = await Project.findOne(filter);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const isClosing = project.status !== 'Closed';
    project.status = isClosing ? 'Closed' : 'Active';
    project.finalizedAt = isClosing ? new Date() : null;
    await project.save();
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/projects/coordinators', async (req, res) => {
  try {
    const { name, version, coordinators } = req.body;
    console.log('UPDATE_COORDINATORS_REQUEST:', { name, version, count: coordinators?.length });

    if (!coordinators || !Array.isArray(coordinators) || coordinators.length === 0) {
      return res.status(400).json({ error: 'No coordinators provided' });
    }
    
    const filter = req.userRole === 'admin' ? { name, version } : { userId: req.session.userId, name, version };
    const project = await Project.findOne(filter);
    
    if (!project) {
      console.warn('COORDINATOR_ASSIGN_ERROR: Project not found with filter:', filter);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('PROJECT_FOUND:', project._id);

    // Determine which coordinators are newly added (not in existing list)
    const existingEmails = new Set((project.coordinators || []).map(c => (c.email || '').toLowerCase().trim()));
    const newCoordinators = coordinators.filter(c => !existingEmails.has(c.email.toLowerCase().trim()));
    console.log('New coordinators to notify:', newCoordinators.map(c => c.email));

    // Update database
    project.coordinators = coordinators;
    await project.save();
    console.log('COORDINATORS_SAVED:', project._id);

    // Fetch tasks for this project version to include in the email
    const projectTasks = await Task.find({ project: name, version });
    console.log('Tasks found for email:', projectTasks.length);

    // Send emails only to newly added coordinators
    for (const coord of newCoordinators) {
      try {
        console.log(`Sending email to: ${coord.email}`);
        await sendCoordinatorEmail(coord, project, projectTasks);
        console.log(`Email sent successfully to: ${coord.email}`);
      } catch (mailErr) {
        console.error(`Failed to send email to ${coord.email}:`, mailErr.message);
      }
    }

    res.json(project);
  } catch (e) {
    console.error('COORDINATOR_ROUTE_ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/projects/coordinators', async (req, res) => {
  try {
    const { name, version, email } = req.body;
    console.log('[BACKEND] DELETE_COORD_REQ:', { name, version, email });

    const filter = req.userRole === 'admin' ? { name, version } : { userId: req.session.userId, name, version };
    const project = await Project.findOne(filter);

    if (!project) {
      console.error('[BACKEND] Project not found for removal:', filter);
      return res.status(404).json({ error: 'Project not found' });
    }

    const initialCount = project.coordinators.length;
    
    // Use Mongoose's pull for atomic subdocument removal
    project.coordinators = project.coordinators.filter(c => 
      c.email.toLowerCase().trim() !== email.toLowerCase().trim()
    );

    // Explicitly mark as modified to ensure Mongoose saves the change
    project.markModified('coordinators');
    await project.save();

    console.log(`[BACKEND] Removal complete. Initial: ${initialCount} | Remaining: ${project.coordinators.length}`);
    res.json({ success: true, remaining: project.coordinators.length });
  } catch (e) {
    console.error('[BACKEND] DELETE_COORD_ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
});



router.get('/tasks', async (req, res) => {
  try {
    let query = {};
    if (req.userRole !== 'admin') {
      // Find projects the user coordinates
      const coordinatedProjects = await Project.find({ 
        "coordinators.email": { $regex: new RegExp(`^${req.userEmail}$`, 'i') } 
      });
      
      const projectFilters = coordinatedProjects.map(p => ({ 
        project: p.name, 
        version: p.version 
      }));

      query = {
        $or: [
          { userId: req.session.userId },
          ...projectFilters
        ]
      };
    }
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.session.userId });
    await task.save();
    res.json(task);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/tasks/status', async (req, res) => {
  try {
    const { task, status } = req.body;
    
    // Find task first
    const existingTask = task._id 
      ? await Task.findById(task._id)
      : await Task.findOne({ name: task.name, project: task.project, version: task.version });

    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    
    // Check permission: Admin OR Owner OR Coordinator
    let hasPermission = req.userRole === 'admin' || existingTask.userId.toString() === req.session.userId.toString();
    
    if (!hasPermission) {
      const project = await Project.findOne({ 
        name: existingTask.project, 
        version: existingTask.version,
        "coordinators.email": { $regex: new RegExp(`^${req.userEmail}$`, 'i') }
      });
      if (project) hasPermission = true;
    }

    if (!hasPermission) return res.status(403).json({ error: 'Permission denied: Not project owner or coordinator' });
    
    existingTask.status = status;
    existingTask.completedAt = status === 'Completed' ? new Date() : null;
    existingTask.history.push({ status, timestamp: new Date() });
    await existingTask.save();
    res.json(existingTask);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existingTask = await Task.findById(id);
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    // Check permission
    let hasPermission = req.userRole === 'admin' || existingTask.userId.toString() === req.session.userId.toString();
    if (!hasPermission) {
      const project = await Project.findOne({ 
        name: existingTask.project, 
        version: existingTask.version,
        "coordinators.email": { $regex: new RegExp(`^${req.userEmail}$`, 'i') }
      });
      if (project) hasPermission = true;
    }

    if (!hasPermission) return res.status(403).json({ error: 'Permission denied' });

    const task = await Task.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/tasks', async (req, res) => {
  try {
    const { name, project, version } = req.body;
    const filter = req.userRole === 'admin' 
      ? { name, project, version } 
      : { userId: req.session.userId, name, project, version };
    await Task.deleteOne(filter);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- DAILY TASK ROUTES ---

router.get('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = req.userRole === 'admin' ? { dateKey: today } : { userId: req.session.userId, dateKey: today };
    const daily = await DailyTask.find(query).sort({ createdAt: -1 });
    res.json(daily);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/daily', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const daily = new DailyTask({ 
      ...req.body, 
      userId: req.session.userId,
      dateKey: today
    });
    await daily.save();
    res.json(daily);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/daily/status', async (req, res) => {
  try {
    const { name, status } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const filter = req.userRole === 'admin' 
      ? { name, dateKey: today } 
      : { userId: req.session.userId, name, dateKey: today };
    const task = await DailyTask.findOne(filter);
    if (!task) return res.status(404).json({ error: 'Daily task not found' });
    
    task.status = status;
    task.completedAt = status === 'Completed' ? new Date() : null;
    await task.save();
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/daily/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const filter = req.userRole === 'admin' 
      ? { name, dateKey: today } 
      : { userId: req.session.userId, name, dateKey: today };
    await DailyTask.deleteOne(filter);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- LAUNCHPAD ROUTES ---

router.get('/launch', async (req, res) => {
  try {
    const query = req.userRole === 'admin' ? {} : { userId: req.session.userId };
    const items = await LaunchItem.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/launch', async (req, res) => {
  try {
    const item = new LaunchItem({ ...req.body, userId: req.session.userId });
    await item.save();
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/launch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = req.userRole === 'admin' ? { _id: id } : { userId: req.session.userId, _id: id };
    const item = await LaunchItem.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Launch item not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/launch/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = req.userRole === 'admin' ? { _id: id } : { userId: req.session.userId, _id: id };
    await LaunchItem.deleteOne(filter);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/tasks/subtask/status', async (req, res) => {
  try {
    const { task, subtaskName, status } = req.body;
    const existingTask = await Task.findOne({ 
      userId: req.session.userId, 
      name: task.name, 
      project: task.project, 
      version: task.version 
    });
    
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    
    const subtask = existingTask.subtasks.find(s => s.name === subtaskName);
    if (subtask) {
      subtask.status = status;
    } else {
      existingTask.subtasks.push({ name: subtaskName, status });
    }
    
    await existingTask.save();
    res.json(existingTask);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
