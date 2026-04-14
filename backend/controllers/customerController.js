const pool = require('../config/db');

const updateProfile = async (req, res) => {
    // accept full_name or name, phone_number or phone, address
    const name = req.body.full_name || req.body.name;
    const phone = req.body.phone_number || req.body.phone;
    const address = req.body.address;
    const userId = req.user.id; // from auth middleware

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING id, name, email, role, phone, address',
            [name, phone, address, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Also update customers table
        await pool.query(
            'UPDATE customers SET name = $1, phone = $2, address = $3 WHERE user_id = $4',
            [name, phone, address, userId]
        );

        res.json({ message: 'Profile updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { updateProfile };
