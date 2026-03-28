const express = require('express');
const router = express.Router();
const upload = require('../utils/multerConfig');
const { 
    createCustomerOrder, 
    getAllCustomerOrders, 
    getCustomerOrders, 
    updateCustomerOrderStatus,
    requestCustomerOrderReturn,
    getAllCustomerReturns,
    updateCustomerReturnStatus
} = require('../controllers/orderController');

router.post('/create', createCustomerOrder);
router.get('/all', getAllCustomerOrders);
router.get('/customer/:userId', getCustomerOrders);
router.put('/:id/status', updateCustomerOrderStatus);

// Return routes
router.post('/return', upload.single('image'), requestCustomerOrderReturn);
router.get('/returns/all', getAllCustomerReturns);
router.put('/returns/:id/status', updateCustomerReturnStatus);

module.exports = router;
