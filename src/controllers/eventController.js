const { v4: uuidv4 } = require('uuid');
const eventsStore = require('../data/eventsStore');
const usersStore = require('../data/usersStore');
const emailService = require('../services/emailService');

// Helper to format event data for list responses
const formatEventListItem = (event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  dateTime: event.dateTime,
  organizerId: event.organizerId,
  participantCount: (event.participants || []).length,
  createdAt: event.createdAt,
  updatedAt: event.updatedAt,
});

exports.listEvents = async (req, res, next) => {
  try {
    const events = eventsStore.listEvents();
    return res.json(events.map(formatEventListItem));
  } catch (err) {
    next(err);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = eventsStore.findEventById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json(event);
  } catch (err) {
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, dateTime } = req.body || {};
    if (!title || !description || !dateTime) {
      return res.status(400).json({ message: 'title, description and dateTime are required' });
    }

    // The authenticate + requireOrganizer middleware ensure req.user exists and is organizer
    const organizerId = req.user.id;
    const event = {
      id: uuidv4(),
      title,
      description,
      dateTime,
      organizerId,
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdEvent = eventsStore.createEvent(event);
    return res.status(201).json(createdEvent);
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dateTime } = req.body || {};
    const event = eventsStore.findEventById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // Restrict update to the organizer who created the event
    if (req.user.id !== event.organizerId) {
      return res.status(403).json({ message: 'Only the organizer who created the event can update it' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (dateTime) updates.dateTime = dateTime;
    updates.updatedAt = new Date().toISOString();

    const updated = eventsStore.updateEvent(id, updates);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = eventsStore.findEventById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (req.user.id !== event.organizerId) {
      return res.status(403).json({ message: 'Only the organizer who created the event can delete it' });
    }

    const ok = eventsStore.deleteEvent(id);
    if (!ok) {
      return res.status(500).json({ message: 'Failed to delete event' });
    }
    // No content
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = eventsStore.findEventById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = req.user.id;
    if ((event.participants || []).includes(userId)) {
      return res.status(400).json({ message: 'User already registered for this event' });
    }

    const participants = [...(event.participants || []), userId];
    const updated = eventsStore.updateEvent(id, { participants, updatedAt: new Date().toISOString() });

    // Send registration email (async but awaited so failures bubble up)
    const user = usersStore.findUserById(userId);
    if (user && user.email) {
      try {
        await emailService.sendRegistrationEmail(user.email, updated);
      } catch (emailErr) {
        // Do not fail the registration on email send failure, but log
        // eslint-disable-next-line no-console
        console.error('Failed to send registration email', emailErr);
      }
    }

    return res.json(updated);
  } catch (err) {
    next(err);
  }
};
