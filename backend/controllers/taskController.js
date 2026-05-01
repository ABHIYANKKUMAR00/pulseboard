const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const logActivity = require('../utils/activityLogger');

const syncOverdueStatuses = async () => {
  const now = new Date();
  await Promise.all([
    Task.updateMany({ dueDate: { $lt: now }, status: { $ne: 'done' } }, { isOverdue: true }),
    Task.updateMany({ $or: [{ dueDate: { $gte: now } }, { dueDate: null }, { status: 'done' }] }, { isOverdue: false })
  ]);
};

const recalcProductivity = async (userId) => {
  if (!userId) return;
  try {
    const [total, completed, overdue] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'done' }),
      Task.countDocuments({ assignedTo: userId, isOverdue: true })
    ]);
    const score = total > 0 ? Math.max(0, Math.round((completed / total) * 100) - (overdue * 5)) : 0;
    await User.findByIdAndUpdate(userId, { productivity_score: score });
  } catch (err) {
    console.error('Productivity recalc error:', err.message);
  }
};

exports.getTasksByProject = async (req, res) => {
  try {
    await syncOverdueStatuses();
    const { projectId } = req.params;
    const { status, priority, assignedTo, search } = req.query;

    const filter = { project: projectId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    await syncOverdueStatuses();
    const { status, priority, search } = req.query;

    let baseFilter = {};
    if (req.user.role !== 'admin') {
      const projects = await Project.find({ members: req.user._id }).select('_id');
      baseFilter = { $or: [{ project: { $in: projects.map(p => p._id) } }, { assignedTo: req.user._id }] };
    }

    if (status) baseFilter.status = status;
    if (priority) baseFilter.priority = priority;
    if (search) baseFilter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(baseFilter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    // Second-layer guard — middleware already blocks this, but never trust the chain alone
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create tasks.', code: 'ADMIN_REQUIRED' });
    }

    const { title, description, status, priority, dueDate, assignedTo, projectId, tags, order } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: 'Task title is required' });
    if (!projectId) return res.status(400).json({ message: 'Project ID is required' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim(),
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      project: projectId,
      createdBy: req.user._id,
      tags: tags || [],
      order: order || 0
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');

    await logActivity({
      action: `${req.user.name} created task "${title}"`,
      type: 'task_created',
      userId: req.user._id,
      projectId,
      taskId: task._id
    });

    if (assignedTo) await recalcProductivity(assignedTo);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    // Second-layer guard for members — middleware already stripped body to { status } only,
    // but re-verify here so the controller is safe even if the route middleware is bypassed
    if (req.user.role !== 'admin') {
      const keys = Object.keys(req.body).filter(k => k !== 'status');
      if (keys.length > 0) {
        return res.status(403).json({
          message: 'Members can only update task status.',
          code: 'STATUS_ONLY'
        });
      }
    }

    const oldTask = await Task.findById(req.params.id).populate('project', 'name _id');
    if (!oldTask) return res.status(404).json({ message: 'Task not found' });

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('project', 'name color _id');

    const projectId = task.project?._id || oldTask.project?._id;

    if (req.body.status && req.body.status !== oldTask.status) {
      const labels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
      await logActivity({
        action: `${req.user.name} moved "${task.title}" to ${labels[req.body.status]}`,
        type: 'task_moved',
        userId: req.user._id,
        projectId,
        taskId: task._id,
        metadata: { from: oldTask.status, to: req.body.status }
      });
    } else if (req.body.assignedTo && req.body.assignedTo !== oldTask.assignedTo?.toString()) {
      const assignee = await User.findById(req.body.assignedTo);
      await logActivity({
        action: `${req.user.name} assigned "${task.title}" to ${assignee?.name || 'a member'}`,
        type: 'task_assigned',
        userId: req.user._id,
        projectId,
        taskId: task._id
      });
    } else {
      await logActivity({
        action: `${req.user.name} updated task "${task.title}"`,
        type: 'task_updated',
        userId: req.user._id,
        projectId,
        taskId: task._id
      });
    }

    const assigneeId = task.assignedTo?._id || oldTask.assignedTo;
    if (assigneeId) await recalcProductivity(assigneeId);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    // Second-layer guard
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks.', code: 'ADMIN_REQUIRED' });
    }

    const task = await Task.findById(req.params.id).populate('project', 'name _id');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await logActivity({
      action: `${req.user.name} deleted task "${task.title}"`,
      type: 'task_deleted',
      userId: req.user._id,
      projectId: task.project?._id
    });

    const assigneeId = task.assignedTo;
    await Task.findByIdAndDelete(req.params.id);
    if (assigneeId) await recalcProductivity(assigneeId);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTaskOrder = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ message: 'tasks must be an array' });

    await Promise.all(
      tasks.map(({ id, order, status }) =>
        Task.findByIdAndUpdate(id, { order, ...(status && { status }) })
      )
    );

    res.json({ message: 'Task order updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    await syncOverdueStatuses();

    let projectFilter = {};
    let taskFilter = {};

    if (req.user.role !== 'admin') {
      const projects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = projects.map(p => p._id);
      projectFilter = { _id: { $in: projectIds } };
      taskFilter = { project: { $in: projectIds } };
    }

    const [
      totalTasks, completedTasks, inProgressTasks, todoTasks,
      overdueTasks, highPriorityTasks, totalProjects
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'done' }),
      Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, isOverdue: true }),
      Task.countDocuments({ ...taskFilter, priority: 'high', status: { $ne: 'done' } }),
      Project.countDocuments(projectFilter)
    ]);

    const tasksPerUser = await Task.aggregate([
      { $match: { ...taskFilter, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { 'user.name': 1, 'user.email': 1, 'user.avatar': 1, total: 1, completed: 1, inProgress: 1 } },
      { $sort: { total: -1 } },
      { $limit: 8 }
    ]);

    const tasksByPriority = await Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const tasksByStatus = [
      { status: 'todo', count: todoTasks, label: 'To Do' },
      { status: 'in-progress', count: inProgressTasks, label: 'In Progress' },
      { status: 'done', count: completedTasks, label: 'Done' }
    ];

    const recentTasks = await Task.find(taskFilter)
      .populate('assignedTo', 'name email avatar')
      .populate('project', 'name color')
      .sort({ updatedAt: -1 })
      .limit(6);

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      highPriorityTasks,
      totalProjects,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksPerUser,
      tasksByPriority,
      tasksByStatus,
      recentTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
