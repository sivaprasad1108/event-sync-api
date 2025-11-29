const events = [];

exports.createEvent = (event) => {
  events.push(event);
  return event;
};

exports.findEventById = (id) => events.find((e) => e.id === id);

exports.listEvents = () => [...events];

exports.updateEvent = (id, updates) => {
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updates, updatedAt: new Date() };
  return events[idx];
};

exports.deleteEvent = (id) => {
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  events.splice(idx, 1);
  return true;
};

exports.clearEvents = () => {
  events.length = 0;
};
