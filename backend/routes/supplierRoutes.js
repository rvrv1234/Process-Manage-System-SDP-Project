const express = require('express');
const router = express.Router();
const { getPendingSuppliers, updateSupplierStatus, getApprovedSuppliers } = require('../controllers/supplierController');
const { getSupplierMaterials, placePurchaseOrder, getAllPurchaseOrders, updatePurchaseOrderStatus, getSupplierPurchaseOrders } = require('../controllers/supplierProductController');

// PO Management Endpoints
router.get('/all-purchase-orders', getAllPurchaseOrders);
router.get('/my-purchase-orders/:userId', getSupplierPurchaseOrders);
router.put('/purchase-orders/:id/status', updatePurchaseOrderStatus);

// GET http://localhost:5000/api/suppliers/pending
router.get('/pending', getPendingSuppliers);

// PUT http://localhost:5000/api/suppliers/:id/status
router.put('/:id/status', updateSupplierStatus);

// GET http://localhost:5000/api/suppliers/approved
router.get('/approved', getApprovedSuppliers);

// New Marketplace Endpoints
router.get('/materials', getSupplierMaterials);
router.post('/purchase', placePurchaseOrder);

module.exports = router;