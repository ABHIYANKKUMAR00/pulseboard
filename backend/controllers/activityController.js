const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');

exports.getActivities = async (req, res) => {
  try {
    const { projectId, limit = 30 } = req.query;
    let filter = {};

    if (projectId) {
      filter.project = projectId;
    } else if (req.user.role !== 'admin') {
      const projects = await Project.find({ members: req.user._id }).select('_id');
      filter.project = { $in: projects.map(p => p._id) };
    }

    const activities = await ActivityLog.find(filter)
      .populate('user', 'name email avatar')
      .populate('project', 'name color')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit), 100));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
