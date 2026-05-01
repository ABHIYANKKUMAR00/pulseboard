const Project = require('../models/Project');
const Task = require('../models/Task');
const logActivity = require('../utils/activityLogger');

// Attach live task stats + computed isOverdue flag to a project plain object
const attachStats = async (project) => {
  const [taskCount, completedCount, overdueCount, inProgressCount] = await Promise.all([
    Task.countDocuments({ project: project._id }),
    Task.countDocuments({ project: project._id, status: 'done' }),
    Task.countDocuments({ project: project._id, isOverdue: true }),
    Task.countDocuments({ project: project._id, status: 'in-progress' })
  ]);
  return { ...project, taskCount, completedCount, overdueCount, inProgressCount };
};

exports.getProjects = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { members: req.user._id };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    const enriched = await Promise.all(projects.map(p => attachStats(p.toObject())));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, color, members, status, dueDate } = req.body;

    // — Validation —
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Project name must be at least 2 characters' });
    }
    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ message: 'Due date is not a valid date' });
    }
    const allowedStatuses = ['active', 'completed', 'on-hold'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Status must be active, completed, or on-hold' });
    }

    // — Ensure owner is always in members list —
    const memberIds = [...new Set([...(members || []).map(String), req.user._id.toString()])];

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#6366f1',
      owner: req.user._id,       // auto-assigned — never trusted from client
      createdBy: req.user._id,
      members: memberIds,
      status: status || 'active',
      dueDate: dueDate || null,
      columns: ['todo', 'in-progress', 'done']  // default Kanban columns
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('members', 'name email avatar');
    await project.populate('createdBy', 'name email');

    await logActivity({
      action: `${req.user.name} created project "${project.name}"`,
      type: 'project_created',
      userId: req.user._id,
      projectId: project._id
    });

    res.status(201).json({
      ...project.toObject(),
      taskCount: 0,
      completedCount: 0,
      overdueCount: 0,
      inProgressCount: 0
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)[0]?.message || 'Validation failed';
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar role')
      .populate('members', 'name email avatar role')
      .populate('createdBy', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && !isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const enriched = await attachStats(project.toObject());
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Prevent client from overriding owner
    const { owner: _o, createdBy: _c, ...safeBody } = req.body;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: safeBody },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar')
      .populate('createdBy', 'name email');

    await logActivity({
      action: `${req.user.name} updated project "${updated.name}"`,
      type: 'project_updated',
      userId: req.user._id,
      projectId: updated._id
    });

    const enriched = await attachStats(updated.toObject());
    res.json(enriched);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)[0]?.message || 'Validation failed';
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Promise.all([
      Task.deleteMany({ project: req.params.id }),
      Project.findByIdAndDelete(req.params.id)
    ]);

    res.json({ message: 'Project and all its tasks have been deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    await logActivity({
      action: `${req.user.name} added a new member to "${project.name}"`,
      type: 'member_added',
      userId: req.user._id,
      projectId: project._id,
      metadata: { addedUserId: userId }
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Prevent removing the owner from members
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner from members' });
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: userId } },
      { new: true }
    ).populate('members', 'name email avatar');

    await logActivity({
      action: `${req.user.name} removed a member from "${updated.name}"`,
      type: 'member_removed',
      userId: req.user._id,
      projectId: updated._id
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
