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

// JWT Secret from .env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables!');
}

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from headers
    if (!token) return res.sendStatus(403);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // Attach user info to request
        next();
    });
};

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


const Customer = mongoose.model('Customer', customerSchema);

// Reply schema and model
const replySchema = new mongoose.Schema({
    sender: String,
    subject: String,
    body: String,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    createdAt: { type: Date, default: Date.now },
});
const Reply = mongoose.model('Reply', replySchema);

// Email configuration (Nodemailer)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});



// Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Function to call Google Generative AI to generate unique email response
const generateUniqueResponse = async (name, age, businessType, location) => {
    const prompt = `Generate a professional thank-you email from Sahaya Henith of SalesEase, expressing appreciation to ${name} for their interest. Mention admiration for their achievements in ${businessType}, based in ${location}. Invite them to connect for a call within the next few working days to discuss how SalesEase can support their business goals and offer any additional information they may need.`;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);
            attempt++;
            if (attempt < maxRetries) {
                await new Promise(res => setTimeout(res, 1000));
            } else {
                throw new Error('Failed to generate text after multiple attempts');
            }
        }
    }
};

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

// Collect customer information endpoint
app.post('/collect-customer-info', authenticateJWT, async (req, res) => {
    const { name, age, businessType, location, email } = req.body;
    const userId = req.user.id;

    const newCustomer = new Customer({
        name,
        age,
        businessType,
        location,
        email,
        userId
    });

    try {
        await newCustomer.save();
        console.log("Customer data received, scheduling email...");

        const uniqueResponse = await generateUniqueResponse(name, age, businessType, location);

        setTimeout(async () => {
            try {
                const customerData = await Customer.findOne({ email });
                if (!customerData) {
                    console.error(`Customer with email ${email} not found.`);
                    return;
                }

                const interestLink = `${process.env.BASE_URL}/confirm-interest/${customerData._id}`;
    

                const mailOptions = {
                    from: process.env.GMAIL_USER,
                    to: customerData.email,
                    replyTo: 'bcoraxgaming@gmail.com',
                    subject: 'Customer Information Collected',
                    text: uniqueResponse,
                    html: `
                        <p>${uniqueResponse}</p>
                        <a href="${interestLink}" style="text-decoration:none;">
                            <button style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px;
                                text-align: center; text-decoration: none; display: inline-block;
                                font-size: 16px; margin: 4px 2px; cursor: pointer;">
                                Yes, I'm Interested!
                            </button>
                        </a>
                    `,
                };


                


                await transporter.sendMail(mailOptions);
                console.log(`Email sent to ${customerData.email}`);
            } catch (error) {
                console.error('Error retrieving customer data or sending email:', error);
            }
        }, 30000);

        res.json({ message: 'Information collected! You will receive an email shortly.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to collect information.' });
    }
});

// Get all users with count of forms collected
app.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('_id name email');
        const usersWithCount = await Promise.all(users.map(async user => {
            const count = await Customer.countDocuments({ userId: user._id });
            return { ...user.toObject(), customerCount: count };
        }));
        res.status(200).json(usersWithCount);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Get customers for a specific user
// Backend: Fetch customers of a specific user
app.get('/admin/users/:userId/customers', async (req, res) => {
    const { userId } = req.params;

    try {
        const customers = await Customer.find({ userId });

        // Send the customers as-is (keep interested as boolean)
        res.status(200).json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Error fetching customers' });
    }
});

app.patch('/customers/:customerId/interest', async (req, res) => {
    const { customerId } = req.params;
    const { interested } = req.body; // Expecting { interested: true } or { interested: false }

    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            { interested },
            { new: true } // Return the updated document
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json(updatedCustomer);
    } catch (error) {
        console.error('Error updating customer interest:', error);
        res.status(500).json({ message: 'Error updating customer interest' });
    }
});



app.get('/confirm-interest/:customerId', async (req, res) => {
    const { customerId } = req.params;

    try {
        // Find the customer by their ID
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).send('C+ustomer not found.');
        }

        // Mark the customer as interested
        customer.interested = true;
        await customer.save();

        // Redirect to the confirmation page
        const confirmationPageUrl = `${process.env.BASE_URL}/ConfirmationPage`; // Set this to your frontend confirmation page URL
        res.redirect(confirmationPageUrl);
    } catch (error) {
        console.error('Error updating customer interest:', error);
        res.status(500).send('Error processing your request.');
    }
});



app.get('/customers/:customerId', authenticateJWT, async (req, res) => {
    const { customerId } = req.params;
    try {
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.status(200).json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ message: 'Error fetching customer.' });
    }
});




// Incoming emails route to handle Mailgun webhooks
app.post('/incoming', async (req, res) => {
    const replyData = req.body;
    const newReply = new Reply({
        sender: replyData.sender,
        subject: replyData.subject,
        body: replyData.body,
        customerId: replyData.customerId,
    });

    try {
        await newReply.save();
        console.log('Reply saved successfully!');
        res.status(200).send({ message: 'Reply saved!' });
    } catch (error) {
        console.error('Error saving reply:', error);
        res.status(500).json({ message: 'Failed to save reply.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
