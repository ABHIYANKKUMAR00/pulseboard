const express = require('express');
const {
  getProjects, createProject, getProjectById, updateProject,
  deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', auth, getProjects);
router.post('/', auth, roleCheck('admin'), createProject);
router.get('/:id', auth, getProjectById);
router.put('/:id', auth, roleCheck('admin'), updateProject);
router.delete('/:id', auth, roleCheck('admin'), deleteProject);
router.post('/:id/members', auth, roleCheck('admin'), addMember);
router.delete('/:id/members/:userId', auth, roleCheck('admin'), removeMember);

module.exports = router;
