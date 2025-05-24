require("dotenv").config();
const fs = require('fs');
const https = require('https');
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const passport = require("./config/googleAuth");
const bodyParser = require('body-parser');
const session = require("express-session");

const { PORT, MONGO_URI, JWT_SECRET, FRONT_END_URL, NODE_ENV } = process.env;

const app = express();

// SSL options
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/api.milestono.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/api.milestono.com/fullchain.pem')
};

// Enhanced CORS configuration
app.use(cors({
    origin: NODE_ENV === "development" ? FRONT_END_URL : [
        FRONT_END_URL,
        'https://milestono.com',
        'https://www.milestono.com'
    ],
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Preflight handling
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// Secure session configuration
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // HTTPS only
        httpOnly: true,
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection with enhanced options
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    w: 'majority'
})
.then(() => {
    console.log('MongoDB connected successfully');
    https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`HTTPS server running on port ${PORT}`);
        console.log(`API endpoints available at https://api.milestono.com:${PORT}/api`);
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// ====================== ROUTES ====================== //

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV
    });
});

// API test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: "API is working",
        session: req.sessionID,
        authenticated: req.isAuthenticated() || false
    });
});

// Add your other API routes here...

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

module.exports = app;
