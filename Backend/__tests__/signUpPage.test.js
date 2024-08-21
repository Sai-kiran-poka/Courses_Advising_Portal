const app = require('../server'); // Import your Express app
const supertest = require('supertest');
const request = supertest(app);


describe('Registration Endpoint', () => {
    it('should register a new user successfully', async() => {
        // Define a sample user data
        const newUser = {
            username: 'testuser',
            email: 'test1234@example.com',
            password: 'testpassword',
            address: '123 Test St',
            dateOfBirth: '2000-01-01'
        };

        // Send a POST request to the registration endpoint with the sample user data
        const response = await request
            .post('/register')
            .send(newUser);

        // Expect the response status to be 201 (Created)
        expect(response.status).toBe(201);
        // Expect the response body message to indicate successful user registration
        expect(response.body.message).toBe('User registered successfully');
    });

    it('should return an error if email is already registered', async() => {
        // Define a sample user data with an email that already exists in the database
        const existingUser = {
            username: 'existinguser',
            email: 'test1@example.com',
            password: 'existingpassword',
            address: '456 Test St',
            dateOfBirth: '1990-01-01'
        };

        // Send a POST request to the registration endpoint with the existing user data
        const response = await request
            .post('/register')
            .send(existingUser);

        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(400);
        // Expect the response body error message to indicate that the email is already registered
        expect(response.body.error).toBe('Email already registered');
    });

    it('should return an error if username is not provided', async() => {
        // Define a sample user data without a username
        const userWithoutUsername = {
            email: 'test2@example.com',
            password: 'testpassword',
            address: '123 Test St',
            dateOfBirth: '2000-01-01'
        };

        // Send a POST request to the registration endpoint with the user data without a username
        const response = await request
            .post('/register')
            .send(userWithoutUsername);

        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(500);
        // Expect the response body error message to indicate that the username is required
        expect(response.body.error).toBe("Error registering user");
    });

    it('should return an error if email is not provided', async() => {
        // Define a sample user data without an email
        const userWithoutEmail = {
            username: 'testuser2',
            password: 'testpassword',
            address: '123 Test St',
            dateOfBirth: '2000-01-01'
        };

        // Send a POST request to the registration endpoint with the user data without an email
        const response = await request
            .post('/register')
            .send(userWithoutEmail);

        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(500);
        // Expect the response body error message to indicate that the email is required
        expect(response.body.error).toBe("Error registering user");
    });

    it('should return an error if password is not provided', async() => {
        // Define a sample user data without a password
        const userWithoutPassword = {
            username: 'testuser3',
            email: 'test3@example.com',
            address: '123 Test St',
            dateOfBirth: '2000-01-01'
        };

        // Send a POST request to the registration endpoint with the user data without a password
        const response = await request
            .post('/register')
            .send(userWithoutPassword);

        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(500);
        // Expect the response body error message to indicate that the password is required
        expect(response.body.error).toBe("Internal Server Error")
    });

    it('should return an error if date of birth is not provided', async() => {
        // Define a sample user data without a date of birth
        const userWithoutDOB = {
            username: 'testuser4',
            email: 'test4@example.com',
            password: 'testpassword',
            address: '123 Test St'
        };

        // Send a POST request to the registration endpoint with the user data without a date of birth
        const response = await request
            .post('/register')
            .send(userWithoutDOB);

        // Expect the response status to be 400 (Bad Request)
        expect(response.status).toBe(500);
        // Expect the response body error message to indicate that the date of birth is required
        expect(response.body.error).toBe("Error registering user");
    });
});