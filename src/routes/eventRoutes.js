const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireOrganizer } = require('../middleware/roleMiddleware');

// GET /api/events
router.get('/events', authenticate, eventController.listEvents);

// GET /api/events/:id
router.get('/events/:id', authenticate, eventController.getEventById);

// POST /api/events
router.post('/events', authenticate, requireOrganizer, eventController.createEvent);

// PUT /api/events/:id
router.put('/events/:id', authenticate, requireOrganizer, eventController.updateEvent);

// DELETE /api/events/:id
router.delete('/events/:id', authenticate, requireOrganizer, eventController.deleteEvent);

// POST /api/events/:id/register
router.post('/events/:id/register', authenticate, eventController.registerForEvent);

module.exports = router;
