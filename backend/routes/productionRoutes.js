const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');

// Route to get all batches
router.get('/', productionController.getBatches);

// Route to update batch status
router.put('/:id/status', productionController.updateBatchStatus);

module.exports = router;
