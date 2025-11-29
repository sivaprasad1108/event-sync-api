const usersStore = require('../data/usersStore');
const eventsStore = require('../data/eventsStore');

beforeEach(() => {
  usersStore.clearUsers();
  eventsStore.clearEvents();
});

// Set a predictable JWT secret for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';