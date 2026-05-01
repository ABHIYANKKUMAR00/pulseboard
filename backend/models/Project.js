const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  color: {
    type: String,
    default: '#6366f1',
    match: [/^#([0-9A-Fa-f]{6})$/, 'Color must be a valid hex code']
  },
  // owner: auto-assigned from JWT — never set manually by client
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // createdBy kept for backward compatibility — mirrors owner
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'on-hold'],
      message: 'Status must be active, completed, or on-hold'
    },
    default: 'active'
  },
  dueDate: {
    type: Date,
    default: null
  },
  // Default Kanban columns — stored so board can be customised later
  columns: {
    type: [String],
    default: ['todo', 'in-progress', 'done']
  }
}, { timestamps: true });

// Virtual: is this project past its due date and not yet completed?
projectSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.status !== 'completed' && new Date() > new Date(this.dueDate);
});

projectSchema.set('toObject', { virtuals: true });
projectSchema.set('toJSON', { virtuals: true });

projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', projectSchema);
