const express = require('express');
const { getActivities } = require('../controllers/activityController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getActivities);

module.exports = router;
