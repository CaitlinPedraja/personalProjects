const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const pg = require('pg');
const bcrypt = require('bcryptjs'); //hashing passwords
const jwt = require('jsonwebtoken'); //token generator

const app = express();

// Serve static files from the 'final/build' directory
app.use(express.static(path.join(__dirname, 'build')));

app.use(express.json())

const { Pool } = require('pg');

const pool = new Pool({
    user: 'final_project',
    host: 'localhost',
    database: 'postgres',
    password: 'washu',
    port: 5432, 
});
// Login route
app.post('/login', async (req, res) => {
   
    const { user_name, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [user_name]);

        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }
        username = user_name;
        // Generate token
        const token = jwt.sign({ userId: user.id }, 'your_secret_key');
        res.json({ token, username });
    } catch (error) {
        console.error('Error during login:', error.response.data.message);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//sign up 
app.post('/signup', async (req, res) => {
    const { newUsername, newPassword } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [newUsername]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Insert the new user into the database
        const newUser = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [newUsername, hashedPassword]);

        // Generate token for the new user
        const token = jwt.sign({ userId: newUser.rows[0].id }, 'your_secret_key');
        
        res.json({ token, newUsername });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//check high score
app.post('/high_score', async (req, res) => {
    const { username, score } = req.body;

    try {
        // Check if the username exists in high_score
        const existingUser = await pool.query('SELECT * FROM high_scores WHERE username = $1', [username]);
        let response = '';
        if (existingUser.rows[0]) {
            //check if its higher than high score
            if(existingUser.rows[0].high_score < score){
                const newScore = await pool.query('UPDATE high_scores SET high_score = $1 WHERE username = $2 ', [score, username]);
                response = 'Thats a new high score!!';
            }else if (existingUser.rows[0].high_score == score){
                response = 'You tied your highest score!!';
            }
        }else{
            //first time playing
            await pool.query('INSERT INTO high_scores (username, high_score) VALUES ($1, $2)', [username, score]);
            response = 'Thats a new high score!!';
        }
        res.json({response});
    } catch (error) {
        console.error('Error checking high score:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Catch all other routes and return the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
const port = process.env.PORT || 3456;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
