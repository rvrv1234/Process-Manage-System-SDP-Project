const pool = require('../config/db');

// 1. Find User by Email
const findUserByEmail = async (email) => {
    try {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

// 2. Create User
const createUser = async (name, email, password, role, phone, address) => {
    try {
        const query = `
            INSERT INTO users (name, email, password, role, phone, address)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *; 
        `;
        // ^ "RETURNING *" is the magic line that gives us the ID
        
        const result = await pool.query(query, [name, email, password, role, phone, address]);
        
        // DEBUG: Print what the database sent back
        console.log("Database Result:", result.rows[0]); 
        
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

module.exports = { findUserByEmail, createUser };