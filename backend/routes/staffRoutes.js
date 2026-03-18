const express = require('express');
const router = express.Router();

// Import the controller (Make sure the path is correct!)
const { 
    getStaff, 
    addStaff, 
    deleteStaff, 
    updateCatalog 
} = require('../controllers/staffController');

// --- STAFF ROUTES ---
router.get('/', getStaff);             // Get all staff
router.post('/', addStaff);            // Add new staff
router.delete('/:id', deleteStaff);    // Delete staff

// --- CATALOG ROUTES ---
router.put('/catalog', updateCatalog); // Update packet quantities

module.exports = router;