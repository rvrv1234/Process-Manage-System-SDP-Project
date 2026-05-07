const express = require('express');
const router = express.Router();
const { requestReset, resetPassword } = require('../controllers/passwordController');

router.post('/forgot-password', requestReset);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
