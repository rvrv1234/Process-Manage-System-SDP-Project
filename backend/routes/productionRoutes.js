const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route to get all batches
router.get('/', verifyToken, productionController.getBatches);

// Route to update batch status
router.put('/:id/status', verifyToken, productionController.updateBatchStatus);

// Routes for Grouped Order Bundling
router.get('/grouped-orders', verifyToken, productionController.getGroupedOrders);

module.exports = router;
