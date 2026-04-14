const express = require('express');
const router = express.Router();
const { getPendingSuppliers, updateSupplierStatus, getApprovedSuppliers, updatePOStatus, updateProfile } = require('../controllers/supplierController');
const { verifyToken } = require('../middleware/authMiddleware');
const {
    getSupplierMaterials,
    placePurchaseOrder,
    getAllPurchaseOrders,
    updatePurchaseOrderStatus,
    getSupplierPurchaseOrders,
    addSupplierMaterial,
    getMyMaterials,
    deleteSupplierMaterial,
    markAsReceived,
    getSupplierInvoice
} = require('../controllers/supplierProductController');

// PO Management Endpoints
router.get('/all-purchase-orders', getAllPurchaseOrders);
router.get('/my-purchase-orders/:userId', getSupplierPurchaseOrders);
router.put('/purchase-orders/:id/status', updatePurchaseOrderStatus);
router.patch('/purchase-orders/:id/receive', markAsReceived);
router.get('/purchase-orders/:id/receipt', getSupplierInvoice);

// GET http://localhost:5000/api/suppliers/pending
router.get('/pending', getPendingSuppliers);

// PUT http://localhost:5000/api/suppliers/:id/status
router.put('/:id/status', updateSupplierStatus);

// GET http://localhost:5000/api/suppliers/approved
router.get('/approved', getApprovedSuppliers);

// PATCH Request for Suppliers to Update PO Status
router.patch('/update-status/:id', updatePOStatus);

// New Marketplace Endpoints
router.get('/materials', getSupplierMaterials);
router.post('/purchase', placePurchaseOrder);

// Material Management for Suppliers
router.get('/my-materials/:userId', getMyMaterials);
router.post('/materials', addSupplierMaterial);
router.delete('/materials/:id', deleteSupplierMaterial);

// Update Profile 
router.put('/update-profile', verifyToken, updateProfile);

module.exports = router;