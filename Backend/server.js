const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');
const randomstring = require('randomstring');

const app = express();
app.use(express.json());
app.use(cors());
const nodemailer = require('nodemailer');
const otpStorage = {}
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rpraneeth.19.cse@anits.edu.in',
        pass: 'welf xxoh hlkt tvct',
    },
});

const sendOtpEmail = async(to, otp) => {
    // Send OTP email
    const mailOptions = {
        from: 'rpraneeth.19.cse@anits.edu.in', // replace with your Gmail email
        to,
        subject: 'OTP Verification',
        text: `Your OTP for verification is: ${otp}`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully:', info);
        return { success: true };
    } catch (error) {
        console.error('Failed to send OTP email:', error);

        // Log the specific error details
        console.error('Error details:', error.message);

        return { error: 'Failed to send OTP email', details: error.message };
    }
};

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
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
            username VARCHAR(255) NOT NULL,
            useremail VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,           
            dob VARCHAR(255) NOT NULL,
            address  VARCHAR(255) NOT NULL,
            role VARCHAR(255) DEFAULT 'user',
            approved BOOLEAN DEFAULT false
            
           
        )
    `;
    connection.query(createUserTableSql, function(err) {
        if (err) throw err;
        console.log("User table created or already exists.");
    });
});
app.post('/get-user-data', (req, res) => {
    const { email } = req.body;
    const query = 'SELECT * FROM users WHERE useremail = ?';

    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        // Assuming results[0] contains the user data
        const userData = {
            username: results[0].username,
            dateOfBirth: results[0].dob,
            address: results[0].address,
            // Add any other fields you want to include
        };

        res.json(userData);
    });
});

app.post('/send-otp', async(req, res) => {
    console.log('Received send-otp request');
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const otp = randomstring.generate({
        length: 6,
        charset: 'numeric',
    });

    otpStorage[email] = otp;

    try {
        const result = await sendOtpEmail(email, otp);
        if (result.success) {
            res.json({ message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send OTP email', details: result.details });
        }
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        res.status(500).json({ error: 'Failed to send OTP email', details: error.message });
    }
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    // Validate if email and otp are provided
    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required for verification' });
    }

    const storedOTP = otpStorage[email];

    // Check if OTP exists for the provided email
    if (!storedOTP) {
        return res.status(404).json({ error: 'OTP not found for the provided email' });
    }

    // Verify the provided OTP
    if (otp === storedOTP) {
        // If OTP is correct, remove it from storage (single-use OTP)
        delete otpStorage[email];
        return res.json({ message: 'OTP verified successfully' });
    } else {
        // Incorrect OTP
        return res.status(401).json({ error: 'Incorrect OTP' });
    }
});

app.post('/register', async(req, res) => {
    try {
        const { username, email, password, address, dateOfBirth } = req.body;

        // Check if the email is already registered
        const checkDuplicateMails = 'SELECT * FROM users WHERE useremail = ?';
        const duplicateUser = await queryDatabase(checkDuplicateMails, [email]);

        if (duplicateUser.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);


        const user = { useremail: email, password: hashedPassword, username, address, dob: dateOfBirth, role: 'user', approved: false };

        const query = 'INSERT INTO users SET ?';
        connection.query(query, user, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error registering user' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Forgot Password endpoint
app.post('/forgot-password', async(req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the email exists in the database
        const checkUserQuery = 'SELECT * FROM users WHERE useremail = ?';
        const user = await queryDatabase(checkUserQuery, [email]);

        if (!user || user.length === 0) {
            return res.status(404).json({ error: 'User not found. Please check your email address.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE useremail = ?';
        await queryDatabase(updatePasswordQuery, [hashedPassword, email]);

        // Send the new password to the user (you might want to implement email sending here)

        res.status(200).json({ message: 'Password reset successful. Check your email for the new password.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE useremail = ?';

    connection.query(query, [email], async(err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        const user = results[0];

        if (!user) {
            return res.status(400).send('User Not Found, please SignUp');
        }

        // Check the approval status
        if (!user.approved) {
            return res.status(401).send('Waiting For Approval');
        }

        // Check the password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            // Passwords match, send the user role along with the success message
            return res.status(200).json({ message: 'Login successful', role: user.role });
        } else {
            // Passwords do not match
            return res.status(401).send('Invalid password');
        }
    });
});

// Assuming this is your server code
app.post('/check-admin', (req, res) => {
    const { email } = req.body;

    // You need to check if the user with this email is an admin in your database
    // Replace the following logic with your actual database query to check the admin status

    // Assuming you have a 'users' table with 'email' and 'isAdmin' columns
    const query = 'SELECT role FROM users WHERE useremail = ?';

    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error checking admin status:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isAdmin = results[0].role === "admin"; // Assuming 1 means admin in your database

        res.json({ isAdmin });
    });
});







app.get('/dashboard', async(req, res) => {
    const query = 'SELECT * FROM users';
    connection.query(query, async(err, results) => {
        if (err) {
            console.error('Error retrieving users:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.json(results);
    });
});
app.post('/dashboard/statusChange', (req, res) => {
    const { status, useremail } = req.body;
    const query = 'UPDATE users SET approved = ? WHERE useremail = ?';

    connection.query(query, [status, useremail], (err) => {
        if (err) {
            console.error('Error when changing status:', err);
            return res.status(500).json({ error: 'Error updating user approval status' });
        }

        res.json({ success: true });
    });
});

const queryDatabase = (sql, params) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};








app.listen(5000, () => {
    console.log('Server started on port 3000');
});