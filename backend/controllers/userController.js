const User = require('../models/User');
const Task = require('../models/Task');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductivityScores = async (req, res) => {
  try {
    const users = await User.find().select('name email avatar productivity_score');

    const scores = await Promise.all(users.map(async (user) => {
      const [totalTasks, completedTasks, overdueTasks, inProgressTasks] = await Promise.all([
        Task.countDocuments({ assignedTo: user._id }),
        Task.countDocuments({ assignedTo: user._id, status: 'done' }),
        Task.countDocuments({ assignedTo: user._id, isOverdue: true }),
        Task.countDocuments({ assignedTo: user._id, status: 'in-progress' })
      ]);

      const score = totalTasks > 0
        ? Math.max(0, Math.round((completedTasks / totalTasks) * 100) - (overdueTasks * 5))
        : 0;

      await User.findByIdAndUpdate(user._id, { productivity_score: score });

      return {
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        score,
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks
      };
    }));

    scores.sort((a, b) => b.score - a.score);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
