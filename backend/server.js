require('dotenv').config(); // Ensure dotenv is required early in the file

const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import the Google Generative AI

const app = express();

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// Use MongoDB URI from the .env file
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


app.get('/', (req, res) => {
    res.send('Welcome to the API!'); // Response for root path
});

// User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
});

const User = mongoose.model('User', userSchema);

// Customer schema and model
const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    businessType: { type: String, required: true },
    location: { type: String, required: true },
    email: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    interested: { type: Boolean, default: false }, // Track interest
});


// Signup endpoint
app.post(
    '/signup',
    [
        body('email').isEmail().withMessage('Enter a valid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).send({ error: "User already exists!" });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const user = new User({ name, email, password: hashedPassword });
            await user.save();

            res.status(201).send({ message: "User created successfully!" });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).send({ error: "Error in saving user!" });
        }
    }
);

// Login endpoint
app.post(
    '/login',
    [
        body('email').isEmail().withMessage('Enter a valid email address'),
        body('password').not().isEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            if (email === 'admin@gmail.com') {
                if (password === 'admin123') {
                    const token = jwt.sign(
                        { email, role: 'admin' },
                        JWT_SECRET,
                        { expiresIn: '1h' }
                    );
                    return res.status(200).send({ message: "Admin login successful!", token, role: 'admin' });
                } else {
                    return res.status(400).send({ error: "Invalid admin password!" });
                }
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).send({ error: "User not found!" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).send({ error: "Invalid password!" });
            }

            const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

            res.status(200).send({ message: "Login successful!", token });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).send({ error: "Error during login!" });
        }
    }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
