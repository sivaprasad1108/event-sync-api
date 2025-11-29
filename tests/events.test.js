const request = require('supertest');
const app = require('../src/app');

describe('Events API', () => {
  test('Organizer can create event', async () => {
    const email = `org-create-${Date.now()}@airtribe.com`;
    const reg = await request(app).post('/api/register').send({ name: 'Org', email, password: 'pass', role: 'organizer' });
    expect(reg.status).toBe(201);
    const token = reg.body.token;

    const eventData = { title: 'Event Title', description: 'Description', dateTime: new Date().toISOString() };
    const res = await request(app).post('/api/events').set('Authorization', `Bearer ${token}`).send(eventData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(eventData.title);
    expect(res.body.organizerId).toBe(reg.body.user.id);
    expect(Array.isArray(res.body.participants)).toBe(true);
    expect(res.body.participants.length).toBe(0);
  });

  test('Attendee cannot create event', async () => {
    const email = `att-create-${Date.now()}@airtribe.com`;
    const reg = await request(app).post('/api/register').send({ name: 'Att', email, password: 'pass', role: 'attendee' });
    const token = reg.body.token;

    const res = await request(app).post('/api/events').set('Authorization', `Bearer ${token}`).send({ title: 'No', description: 'No', dateTime: new Date().toISOString() });
    expect(res.status).toBe(403);
  });

  test('Creating event without token fails', async () => {
    const res = await request(app).post('/api/events').send({ title: 'No', description: 'No', dateTime: new Date().toISOString() });
    expect(res.status).toBe(401);
  });

  test('Get events list', async () => {
    // Ensure there is at least one event
    const email = `org-list-${Date.now()}@airtribe.com`;
    const reg = await request(app).post('/api/register').send({ name: 'Org2', email, password: 'pass', role: 'organizer' });
    const token = reg.body.token;
    await request(app).post('/api/events').set('Authorization', `Bearer ${token}`).send({ title: 'E1', description: 'D1', dateTime: new Date().toISOString() });

    const res = await request(app).get('/api/events').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('Update event by organizer', async () => {
    const email = `org-update-${Date.now()}@airtribe.com`;
    const reg = await request(app).post('/api/register').send({ name: 'Org3', email, password: 'pass', role: 'organizer' });
    const token = reg.body.token;

    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${token}`).send({ title: 'ToUpdate', description: 'D', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(201);
    const eventId = createRes.body.id;

    const newTitle = 'Updated Title';
    const updateRes = await request(app).put(`/api/events/${eventId}`).set('Authorization', `Bearer ${token}`).send({ title: newTitle });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe(newTitle);
  });

  test('Update non-existent event returns 404', async () => {
    const email = `org-update-none-${Date.now()}@airtribe.com`;
    const reg = await request(app).post('/api/register').send({ name: 'Org4', email, password: 'pass', role: 'organizer' });
    const token = reg.body.token;

    const res = await request(app).put(`/api/events/non-existent-id`).set('Authorization', `Bearer ${token}`).send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  test('Delete event by organizer', async () => {
    const email = `org-delete-${Date.now()}@airtribe.com`;
    const reg = await request(app).post('/api/register').send({ name: 'Org5', email, password: 'pass', role: 'organizer' });
    const token = reg.body.token;

    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${token}`).send({ title: 'ToDelete', description: 'D', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(201);
    const eventId = createRes.body.id;

    const deleteRes = await request(app).delete(`/api/events/${eventId}`).set('Authorization', `Bearer ${token}`);
    expect([204, 200]).toContain(deleteRes.status);

    const getRes = await request(app).get(`/api/events/${eventId}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });

  test('Only event owner can update/delete', async () => {
    const regA = await request(app).post('/api/register').send({ name: 'OrgA', email: `orgaA-${Date.now()}@airtribe.com`, password: 'pass', role: 'organizer' });
    const tokenA = regA.body.token;
    const regB = await request(app).post('/api/register').send({ name: 'OrgB', email: `orgaB-${Date.now()}@airtribe.com`, password: 'pass', role: 'organizer' });
    const tokenB = regB.body.token;

    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Owned', description: 'D', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(201);
    const eventId = createRes.body.id;

    const updateByB = await request(app).put(`/api/events/${eventId}`).set('Authorization', `Bearer ${tokenB}`).send({ title: 'N' });
    expect(updateByB.status).toBe(403);

    const deleteByB = await request(app).delete(`/api/events/${eventId}`).set('Authorization', `Bearer ${tokenB}`);
    expect(deleteByB.status).toBe(403);
  });
});
