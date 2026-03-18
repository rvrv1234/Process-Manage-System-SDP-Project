const express = require('express');
const router = express.Router();
const { getCatalog, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');

// GET /api/products
router.get('/', getCatalog);

// POST /api/products
router.post('/', addProduct);

// PUT /api/products/:id
router.put('/:id', updateProduct);

// DELETE /api/products/:id
router.delete('/:id', deleteProduct);

module.exports = router;