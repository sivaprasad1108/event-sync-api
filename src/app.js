const express = require('express');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', eventRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
