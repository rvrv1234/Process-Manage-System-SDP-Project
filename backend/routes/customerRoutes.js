const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/customerController');
const { verifyToken } = require('../middleware/authMiddleware');

router.put('/update-profile', verifyToken, updateProfile);

module.exports = router;
