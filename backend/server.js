const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const supplierRoutes = require('./routes/supplierRoutes');
// 👇 NEW: Import the Product Routes for the catalog
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ownerPaymentRoutes = require('./routes/ownerPaymentRoutes');


// --- 1. IMPORT CONTROLLERS ---
// We import Auth functions directly to ensure verifyEmail is accessible
const { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } = require('./controllers/authController');
const { getStaff, deleteStaff } = require('./controllers/staffController');
const { getPendingSuppliers, approveSupplier, rejectSupplier } = require('./controllers/adminController');
const staffRoutes = require('./routes/staffRoutes');
const productionRoutes = require('./routes/productionRoutes');
const app = express();
app.use(express.json());
app.use(cors());

const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');


// --- 2. DEFINE ROUTES ---

// --- AUTH ROUTES (Gmail / Nodemailer) ---
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/verify/:token', verifyEmail); // ✅ This is the critical link route!
app.post('/api/auth/forgot-password', forgotPassword);
app.put('/api/auth/reset-password/:token', resetPassword);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);

// 👇 NEW: Mount the Product Routes (Required for the Dropdown & Customer View)
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/owner-payments', ownerPaymentRoutes);


// --- ADMIN ROUTES (Supplier Requests) ---
app.get('/api/admin/requests', getPendingSuppliers); // Fetch list
app.put('/api/admin/approve/:id', approveSupplier);  // Approve
app.put('/api/admin/reject/:id', rejectSupplier);    // Reject

// --- STAFF MANAGEMENT ROUTES (Owner Dashboard) ---
app.get('/api/admin/staff', getStaff);
app.delete('/api/admin/staff/:id', deleteStaff);


// --- TEST ROUTE ---
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.send(`API Running! Database Time: ${result.rows[0].now}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database connection error');
    }
});

// --- 3. START SERVER ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});