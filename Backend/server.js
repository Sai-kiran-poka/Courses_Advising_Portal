const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


// Secret key for JWT
const SECRET_KEY = 'your_secret_key'; // In production, use an environment variable

// Database connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ramkrishna!1',
    database: 'adviserform'
});

// Connect to database
connection.connect(err => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Connected as id ' + connection.threadId);

    // Create table if it does not exist
    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            useremail VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(255) DEFAULT 'user'
        )
    `;
    connection.query(createUserTableSql, function (err) {
        if (err) throw err;
        console.log("User table created or already exists.");
    });
});

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { useremail: req.body.email, password: hashedPassword, role: 'user' };

        const query = 'INSERT INTO users SET ?';
        connection.query(query, user, (err, result) => {
            if (err) throw err;
            res.status(201).send('User registered');
        });
    } catch {
        res.status(500).send();
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const query = 'SELECT * FROM users WHERE useremail = ?';
    connection.query(query, [req.body.email], async (err, results) => {
        if (err) throw err;

        const user = results[0];
        if (user == null) {
            return res.status(400).send('Cannot find user');
        }

        try {
            if (await bcrypt.compare(req.body.password, user.password)) {
                const token = jwt.sign({ email: user.useremail }, SECRET_KEY);
                res.json({ token: token });
            } else {
                res.send('Not Allowed');
            }
        } catch {
            res.status(500).send();
        }
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
