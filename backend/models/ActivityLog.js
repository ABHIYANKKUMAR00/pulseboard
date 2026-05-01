const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'task_created', 'task_updated', 'task_deleted', 'task_moved',
      'task_assigned', 'project_created', 'project_updated',
      'member_added', 'member_removed'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
