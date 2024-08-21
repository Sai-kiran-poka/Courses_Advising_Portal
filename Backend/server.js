const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');
const fetch = require('node-fetch');
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


app.post('/verify-recaptcha', async(req, res) => {
    const { recaptchaToken } = req.body;

    try {
        // Verify reCAPTCHA token
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `secret=6LfB5ropAAAAAD0cJs8qiRCZqoozdW_3DRmELGcw&response=${recaptchaToken}`
        });

        const data = await response.json();

        if (data.success) {
            // If reCAPTCHA verification is successful
            res.status(200).json({ success: true });
        } else {
            // If reCAPTCHA verification fails
            res.status(400).json({ success: false });
        }
    } catch (error) {
        console.error('Verify reCAPTCHA error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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
const createCoursePlan = `
CREATE TABLE IF NOT EXISTS coursePlan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level INT NOT NULL,
  course VARCHAR(255) NOT NULL,
  available  INT 
)
`;
connection.query(createCoursePlan, (err) => {
    if (err) throw err;
    console.log('Course Plan table created or already exists');
});
const createPrerequesites = `
CREATE TABLE IF NOT EXISTS prerequesites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level INT NOT NULL,
  course VARCHAR(255) NOT NULL,
  available  INT 
)
`;
connection.query(createPrerequesites, (err) => {
    if (err) throw err;
    console.log('Course Prerequesites table created or already exists');
});
const createStudentPrerequisitesTableQuery = `
CREATE TABLE IF NOT EXISTS student_prerequisites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  advising_record_id INT NOT NULL,
  level INT NOT NULL,
  course VARCHAR(255) NOT NULL,
  FOREIGN KEY (advising_record_id) REFERENCES student_advising_records(id)
)
`;
connection.query(createStudentPrerequisitesTableQuery, (err) => {
    if (err) throw err;
    console.log('Student Prerequisites table created or already exists');
});
const createStudentAdvisingRecordsTableQuery = `
CREATE TABLE IF NOT EXISTS student_advising_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  last_term VARCHAR(255) NOT NULL,
  last_gpa DECIMAL(3, 2) NOT NULL,
  current_term VARCHAR(255) NOT NULL,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(255) NOT NULL,
  uin INT NOT NULL,
  name VARCHAR(255) NOT NULL

)
`;
connection.query(createStudentAdvisingRecordsTableQuery, (err) => {
    if (err) throw err;
    console.log('Advising records table created or already exists');
});

const createStudentCoursePlanTableQuery = `
CREATE TABLE IF NOT EXISTS student_coursePlan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  advising_record_id INT NOT NULL,
  level INT NOT NULL,
  course VARCHAR(255) NOT NULL,
  FOREIGN KEY (advising_record_id) REFERENCES student_advising_records(id)
)
`;
connection.query(createStudentCoursePlanTableQuery, (err) => {
    if (err) throw err;
    console.log('Student Prerequisites table created or already exists');
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

app.post('/student-records', (req, res) => {
    const { uin } = req.body;

    // Query the database to fetch student records based on UIN
    const sql = 'SELECT * FROM student_advising_records WHERE uin = ?';
    connection.query(sql, [uin], (error, results) => {
        if (error) {
            console.error('Error fetching student records:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
});
app.post('/submit-advising-form', (req, res) => {
    const { uin, name, lastTerm, lastGPA, currentTerm, prerequisites, plannedCourses } = req.body;

    // Store advising form data in the database
    const advisingRecord = {
        uin: uin,
        name: name,
        last_term: lastTerm,
        last_gpa: lastGPA,
        current_term: currentTerm,
        status: 'Pending' // Set status as "Pending" for new entries
    };

    const insertAdvisingRecordQuery = 'INSERT INTO student_advising_records SET ?';
    connection.query(insertAdvisingRecordQuery, advisingRecord, (err, result) => {
        if (err) {
            console.error('Error storing advising form data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        const advisingRecordId = result.insertId;

        // Store prerequisites in the database
        const prerequisitesValues = prerequisites.map(prerequisite => [advisingRecordId, prerequisite.level, prerequisite.course]);
        const insertPrerequisitesQuery = 'INSERT INTO student_prerequisites (advising_record_id, level, course) VALUES ?';
        connection.query(insertPrerequisitesQuery, [prerequisitesValues], (err) => {
            if (err) {
                console.error('Error storing prerequisites:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
        });

        // Store planned courses in the database
        const plannedCoursesValues = plannedCourses.map(course => [advisingRecordId, course.level, course.course]);
        const insertPlannedCoursesQuery = 'INSERT INTO student_courseplan (advising_record_id, level, course) VALUES ?';
        connection.query(insertPlannedCoursesQuery, [plannedCoursesValues], (err) => {
            if (err) {
                console.error('Error storing planned courses:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
        });

        res.status(200).json({ message: 'Advising form submitted successfully' });
    });
});
app.post('/admin/advising-sheets', (req, res) => {
    // Fetch advising sheets with status from the database
    const sql = `SELECT name, uin, status FROM student_advising_records`; // Assuming advising sheets are stored in a table named advising_sheets
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching advising sheets:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // If advising sheets are found, send them as response
        res.json(results);
    });
});
app.post('/approve-record', (req, res) => {
    const { recordId, email } = req.body;

    // Check if the email address is defined
    if (!email) {
        console.error('No recipient email address defined');
        return res.status(400).json({ error: 'Recipient email address is missing' });
    }

    // Update the status of the student record in the database to "Approved"
    const updateRecordQuery = 'UPDATE student_advising_records SET status = "Approved" WHERE id = ?';
    connection.query(updateRecordQuery, [recordId], (err, result) => {
        if (err) {
            console.error('Error updating student record:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Send email notification
        const mailOptions = {
            from: 'rpraneeth.19.cse@anits.edu.in', // Sender email address
            to: email, // Recipient email address
            subject: 'Advising Record Approval Notification',
            text: `Your advising record with ID ${recordId} has been approved.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Student record approved successfully and email notification sent' });
        });
    });
});
app.post('/reject-record', (req, res) => {
    const { recordId, rejectionReason, email } = req.body;

    // Check if the rejection reason and email are provided
    if (!rejectionReason || !email) {
        console.error('Rejection reason or email is missing');
        return res.status(400).json({ error: 'Rejection reason and email are required' });
    }

    // Update the status of the student record in the database to "Rejected" and store the rejection reason
    const updateRecordQuery = 'UPDATE student_advising_records SET status = "Rejected"  WHERE id = ?';
    connection.query(updateRecordQuery, [recordId], (err, result) => {
        if (err) {
            console.error('Error updating student record:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Send email notification
        const mailOptions = {
            from: 'rpraneeth.19.cse@anits.edu.in', // Sender email address
            to: email, // Recipient email address
            subject: 'Advising Record Rejection Notification',
            text: `Your advising record with ID ${recordId} has been rejected due to: ${rejectionReason}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Student record rejected successfully and email notification sent' });
        });
    });
});
app.post('/advising-records', (req, res) => {
    const { userId } = req.body;
    const query = 'SELECT * FROM student_advising_records WHERE uin = ?';

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching advising records:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(results);
    });
});

app.post('/prerequisites/levels', (req, res) => {
    // Query to fetch distinct levels from the prerequisites table
    const query = 'SELECT DISTINCT level FROM prerequesites WHERE available = 1';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching levels:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const levels = results.map(result => result.level);
        res.json(levels);
    });
});
app.post('/plannedCourses/levels', (req, res) => {
    // Query to fetch distinct levels from the prerequisites table
    const query = 'SELECT DISTINCT level FROM courseplan WHERE available = 1';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching levels:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const levels = results.map(result => result.level);
        res.json(levels);
    });
});
app.post('/plannedCourses/courses', (req, res) => {
    const { level } = req.body;
    // Query to fetch courses based on the selected level
    const query = 'SELECT  DISTINCT course FROM courseplan WHERE level = ?';

    connection.query(query, [level], (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const courses = results.map(result => result.course);
        res.json(courses);
    });
});

app.post('/prerequisites/courses', (req, res) => {
    const { level } = req.body;
    // Query to fetch courses based on the selected level
    const query = 'SELECT  DISTINCT course FROM prerequesites WHERE level = ?';

    connection.query(query, [level], (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const courses = results.map(result => result.course);
        res.json(courses);
    });
});
app.post('/prerequisites/courses1', (req, res) => {
    const { level } = req.body;
    // Query to fetch courses based on the selected level
    const query = 'SELECT course FROM prerequisites WHERE level = ? AND avaliable = 1';

    connection.query(query, [level], (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const courses = results.map(result => result.course);
        res.json(courses);
    });
});



app.post('/get-user-id', (req, res) => {
    const { email } = req.body;

    // Check if the email parameter is missing or invalid
    if (!email) {
        return res.status(400).json({ error: 'Email parameter is missing or invalid' });
    }

    // Query to select user ID and name based on email
    const sql = 'SELECT id, username FROM users WHERE useremail = ?';

    // Execute the query with the email as a parameter
    connection.query(sql, [email], (error, results) => {
        if (error) {
            // If an error occurs during the query execution, log the error and return a 500 status code
            console.error('Error executing MySQL query:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // If a user with the given email is found, return their ID and name
        if (results.length > 0) {
            const { id, name } = results[0]; // Destructure the id and name from the first result
            res.json({ userId: id, userName: name }); // Return userId and userName
        } else {
            // If user not found, return a 404 error
            res.status(404).json({ error: 'User not found' });
        }
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
app.post('/prerequisites', (req, res) => {
    // Assuming prerequisites are stored in a table named 'prerequisites'
    const sql = 'SELECT * FROM prerequesites';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching prerequisites:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});
app.post('/plannedCouses', (req, res) => {
    // Assuming prerequisites are stored in a table named 'prerequisites'
    const sql = 'SELECT * FROM coursePlan';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching prerequisites:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});
app.post('/update-prerequisite', (req, res) => {
    const { id, available } = req.body;

    // Update the availability status of the prerequisite in the database
    const sql = 'UPDATE prerequesites SET available = ? WHERE id = ?';
    connection.query(sql, [available, id], (error, result) => {
        if (error) {
            console.error('Error updating prerequisite availability:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'Prerequisite availability updated successfully' });
        }
    });
});
app.post('/update-plannedCourse', (req, res) => {
    const { id, available } = req.body;

    // Update the availability status of the prerequisite in the database
    const sql = 'UPDATE coursePlan SET available = ? WHERE id = ?';
    connection.query(sql, [available, id], (error, result) => {
        if (error) {
            console.error('Error updating prerequisite availability:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.status(200).json({ message: 'Prerequisite availability updated successfully' });
        }
    });
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
    const { useremail } = req.body;
    const query = 'SELECT * FROM users WHERE useremail = ?';

    connection.query(query, [useremail], (err, results) => {
        if (err) {
            console.error('Error checking admin status:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isAdmin = results[0].role === "admin"; // Assuming "admin" means admin role in your database

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





app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});


app.listen(5000, () => {
    console.log('Server started on port 3000');
});
module.exports = app;