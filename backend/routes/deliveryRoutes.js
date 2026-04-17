const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { verifyToken, isDelivery } = require('../middleware/authMiddleware');

// Route to get available orders waiting for pickup
router.get('/available', verifyToken, isDelivery, deliveryController.getAvailableOrders);

// Route to get all active and past assigned deliveries for the driver
router.get('/my-deliveries', verifyToken, isDelivery, deliveryController.getMyDeliveries);

// Route to claim an available order
router.patch('/claim/:orderId', verifyToken, isDelivery, deliveryController.claimOrder);

// Route to complete a delivery
router.patch('/complete/:deliveryId', verifyToken, isDelivery, deliveryController.completeDelivery);

module.exports = router;
