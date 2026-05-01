const express = require('express');
const { getAllUsers, getUserById, updateProfile, getProductivityScores } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getAllUsers);
router.get('/productivity', auth, getProductivityScores);
router.put('/profile', auth, updateProfile);
router.get('/:id', auth, getUserById);

module.exports = router;
