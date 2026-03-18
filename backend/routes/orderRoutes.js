const express = require('express');
const router = express.Router();
const { createCustomerOrder, getAllCustomerOrders, getCustomerOrders, updateCustomerOrderStatus } = require('../controllers/orderController');

router.post('/create', createCustomerOrder);
router.get('/all', getAllCustomerOrders);
router.get('/customer/:userId', getCustomerOrders);
router.put('/:id/status', updateCustomerOrderStatus);

module.exports = router;
