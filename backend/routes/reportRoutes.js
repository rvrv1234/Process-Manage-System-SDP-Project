const express = require('express');
const router = express.Router();
const { 
    getFinancialSummary, 
    getSalesByProduct, 
    getOrderTrends, 
    getInventoryDistribution,
    getAuditReport
} = require('../controllers/reportController');

router.get('/financial-summary', getFinancialSummary);
router.get('/sales-by-product', getSalesByProduct);
router.get('/order-trends', getOrderTrends);
router.get('/inventory-distribution', getInventoryDistribution);
router.get('/system-audit', getAuditReport);

module.exports = router;
