const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ action, type, userId, projectId = null, taskId = null, metadata = {} }) => {
  try {
    await ActivityLog.create({
      action,
      type,
      user: userId,
      project: projectId,
      task: taskId,
      metadata
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

module.exports = logActivity;
