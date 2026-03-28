const express = require('express');
const router = express.Router();
const { 
    createReturnRequest, 
    getReturnRequestsBySupplier, 
    updateReturnStatus 
} = require('../controllers/supplierController');

// POST http://localhost:5000/api/returns
router.post('/', createReturnRequest);

// GET http://localhost:5000/api/returns/supplier/:supplierId
router.get('/supplier/:supplierId', getReturnRequestsBySupplier);

// PUT http://localhost:5000/api/returns/:id/status
router.put('/:id/status', updateReturnStatus);

module.exports = router;
