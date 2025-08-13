const express = require('express');
const router = express.Router();
const pool = require('../../../db'); 

router.post('/check-or-add-user', async (req, res) => {
    const { user_id } = req.body;
  console.log(user_id);
    try {
      // Check if the user exists in the business_user table
      const userCheck = await pool.query('SELECT * FROM public."business_user" WHERE user_id = $1', [user_id]);
  
      if (userCheck.rows.length === 0) {
        // If the user doesn't exist, insert them into the business_user table
        const insertUser = await pool.query(
          'INSERT INTO public."business_user" (user_id, rating) VALUES ($1, $2) RETURNING *',
          [user_id, 5]  // Default rating of 5
        );
  
        if (insertUser.rows.length === 0) {
          return res.status(500).json({ error: 'Failed to insert user into business_user table' });
        }
        return res.status(201).json({ message: 'User added successfully', user: insertUser.rows[0] });
      }
  
      return res.status(200).json({ message: 'User already exists', user: userCheck.rows[0] });
    } catch (error) {
      console.error('Error checking or adding user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  module.exports = router; 