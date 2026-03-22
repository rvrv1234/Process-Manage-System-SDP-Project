const express = require('express');
const router = express.Router();
const { saveOwnerPayment } = require('../controllers/ownerPaymentController');

router.post('/', saveOwnerPayment);

module.exports = router;
