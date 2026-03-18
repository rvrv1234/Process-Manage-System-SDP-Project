const express = require('express');
const router = express.Router();
const { getInventory, addInventoryItem, updateInventoryItem } = require('../controllers/inventoryController');

// GET /api/inventory
router.get('/', getInventory);

// POST /api/inventory
router.post('/', addInventoryItem);

// PUT /api/inventory/:id
router.put('/:id', updateInventoryItem);

module.exports = router;
