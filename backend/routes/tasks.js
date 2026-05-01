const express = require('express');
const {
  getTasksByProject, getAllTasks, createTask, updateTask,
  deleteTask, updateTaskOrder, getDashboardStats
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const { adminOnly, memberStatusOnly } = require('../middleware/taskPermission');

const router = express.Router();

// Public to all authenticated users
router.get('/stats/dashboard', auth, getDashboardStats);
router.get('/', auth, getAllTasks);
router.get('/project/:projectId', auth, getTasksByProject);

// Admin-only: create and delete
router.post('/', auth, adminOnly, createTask);
router.delete('/:id', auth, adminOnly, deleteTask);

// Members: only { status } allowed; admins: full body
router.put('/reorder', auth, updateTaskOrder);   // reorder is status-only by nature
router.put('/:id', auth, memberStatusOnly, updateTask);

module.exports = router;
