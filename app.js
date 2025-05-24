require("dotenv").config();
const fs = require('fs');
const https = require('https');
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const passport = require("./config/googleAuth");
const bodyParser = require('body-parser');
const session = require("express-session");

const { PORT, MONGO_URI, JWT_SECRET, FRONT_END_URL } = process.env;

const app = express();

// SSL options
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/api.milestono.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api.milestono.com/fullchain.pem')
};

// Middleware
app.use(cors({
    origin: FRONT_END_URL,
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000
})
.then(() => {
    console.log('MongoDB connected');
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`Server started on https://api.milestono.com:${PORT}`);
        console.log(`Swagger docs available at https://api.milestono.com:${PORT}/api-docs`);
    });
})
.catch(err => {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
});

// ====================== ROUTES ====================== //

// User Routes
app.get('/api/users', (req, res) => {
    res.json({ message: "Get all users" });
});

app.post('/api/users', (req, res) => {
    res.json({ message: "Create user" });
});

// Auth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect(FRONT_END_URL);
    }
);

// Property Routes
app.get('/api/properties', (req, res) => {
    res.json({ message: "Get all properties" });
});

app.post('/api/properties', (req, res) => {
    res.json({ message: "Create property" });
});

// Service Routes (both versions)
app.get('/api/services', (req, res) => {
    res.json({ message: "Get all services (v1)" });
});

app.get('/api/services/:id', (req, res) => {
    res.json({ message: `Get service ${req.params.id} (v1)` });
});

app.get('/api/services', (req, res) => {
    res.json({ message: "Get all services (v2)" });
});

// Vendor Routes
app.get('/api/vendors', (req, res) => {
    res.json({ message: "Get all vendors" });
});

app.post('/api/vendors', (req, res) => {
    res.json({ message: "Create vendor" });
});

// Account Routes
app.get('/api/accounts', (req, res) => {
    res.json({ message: "Get all accounts" });
});

// Payment Routes
app.post('/api/payments', (req, res) => {
    res.json({ message: "Process payment" });
});

// Other Routes (placeholder)
app.get('/api/other', (req, res) => {
    res.json({ message: "Other endpoints" });
});

// Homepage Routes
app.get('/api/homepage', (req, res) => {
    res.json({ message: "Homepage data" });
});

// Enquiry Routes
app.post('/api/enquiries', (req, res) => {
    res.json({ message: "Submit enquiry" });
});

// Feedback Routes
app.post('/api/feedback', (req, res) => {
    res.json({ message: "Submit feedback" });
});

// Project Routes
app.get('/api/projects', (req, res) => {
    res.json({ message: "Get all projects" });
});

// Gallery Routes
app.get('/api/gallery', (req, res) => {
    res.json({ message: "Get gallery images" });
});

// Bank Routes
app.get('/api/banks', (req, res) => {
    res.json({ message: "Get bank details" });
});

// Agent Routes
app.get('/api/agents', (req, res) => {
    res.json({ message: "Get all agents" });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message
    });
});

module.exports = app;
