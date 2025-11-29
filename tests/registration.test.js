const request = require('supertest');
const app = require('../src/app');

// Mock and assert email sending
jest.mock('../src/services/emailService', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue({}),
}));
const emailService = require('../src/services/emailService');

describe('Event registration', () => {
  test('Successful registration for an event', async () => {
    // create organizer
    const org = await request(app).post('/api/register').send({ name: 'OrgReg', email: `orgreg-${Date.now()}@example.com`, password: 'p', role: 'organizer' });
    const orgToken = org.body.token;

    // create event
    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'RegEvent', description: 'D', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(201);
    const eventId = createRes.body.id;

    // create attendee and register
    const att = await request(app).post('/api/register').send({ name: 'AttReg', email: `attreg-${Date.now()}@example.com`, password: 'p', role: 'attendee' });
    const attToken = att.body.token;

    const regRes = await request(app).post(`/api/events/${eventId}/register`).set('Authorization', `Bearer ${attToken}`).send();
    expect(regRes.status).toBe(200);
    expect(Array.isArray(regRes.body.participants)).toBe(true);
    expect(regRes.body.participants).toContain(att.body.user.id);
    expect(emailService.sendRegistrationEmail).toHaveBeenCalledWith(att.body.user.email, expect.any(Object));
  });

  test('Duplicate registration should fail', async () => {
    const org = await request(app).post('/api/register').send({ name: 'OrgDup', email: `orgdup-${Date.now()}@example.com`, password: 'p', role: 'organizer' });
    const orgToken = org.body.token;
    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'DupEvent', description: 'D', dateTime: new Date().toISOString() });
    const eventId = createRes.body.id;

    const att = await request(app).post('/api/register').send({ name: 'AttDup', email: `attdup-${Date.now()}@example.com`, password: 'p', role: 'attendee' });
    const attToken = att.body.token;

    const r1 = await request(app).post(`/api/events/${eventId}/register`).set('Authorization', `Bearer ${attToken}`).send();
    expect(r1.status).toBe(200);

    const r2 = await request(app).post(`/api/events/${eventId}/register`).set('Authorization', `Bearer ${attToken}`).send();
    expect(r2.status).toBe(400);
  });

  test('Registration to non-existent event returns 404', async () => {
    const att = await request(app).post('/api/register').send({ name: 'AttNo', email: `attno-${Date.now()}@example.com`, password: 'p', role: 'attendee' });
    const attToken = att.body.token;

    const res = await request(app).post(`/api/events/non-existent-id/register`).set('Authorization', `Bearer ${attToken}`).send();
    expect(res.status).toBe(404);
  });

  test('Registration without token fails', async () => {
    const org = await request(app).post('/api/register').send({ name: 'OrgNoTok', email: `orgnotok-${Date.now()}@example.com`, password: 'p', role: 'organizer' });
    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${org.body.token}`).send({ title: 'NoTok', description: 'D', dateTime: new Date().toISOString() });
    const eventId = createRes.body.id;

    const res = await request(app).post(`/api/events/${eventId}/register`).send();
    expect(res.status).toBe(401);
  });
});
