const request = require('supertest');
const app = require('../app');
jest.mock('../services/emailService', () => ({
  sendRegistrationEmail: jest.fn().mockResolvedValue({}),
}));
const emailService = require('../services/emailService');

describe('Events routes', () => {
  test('Organizer can create event and attendee can register', async () => {
    // create organizer
    const organizerEmail = `org-${Date.now()}@example.com`;
    const registerOrg = await request(app).post('/api/register').send({
      name: 'Organizer',
      email: organizerEmail,
      password: 'secret',
      role: 'organizer',
    });
    expect(registerOrg.status).toBe(201);
    const orgToken = registerOrg.body.token;

    // create an event as organizer
    const createRes = await request(app).post('/api/events')
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ title: 'My Event', description: 'desc', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(201);
    const event = createRes.body;

    // create attendee
    const attendeeEmail = `att-${Date.now()}@example.com`;
    const registerAttRes = await request(app).post('/api/register')
      .send({ name: 'Attendee', email: attendeeEmail, password: 'secret', role: 'attendee' });
    expect(registerAttRes.status).toBe(201);
    const attendeeToken = registerAttRes.body.token;

    // register attendee for event
    const regRes = await request(app).post(`/api/events/${event.id}/register`)
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send();
    expect(regRes.status).toBe(200);
    expect(Array.isArray(regRes.body.participants)).toBe(true);
    expect(regRes.body.participants).toContain(registerAttRes.body.user.id);
    // Ensure email was triggered
    expect(emailService.sendRegistrationEmail).toHaveBeenCalledWith(registerAttRes.body.user.email, expect.any(Object));
  });

  test('Non-organizer cannot create event', async () => {
    // create attendee
    const attendeeEmail = `att-${Date.now()}@example.com`;
    const registerAttRes = await request(app).post('/api/register')
      .send({ name: 'Attendee2', email: attendeeEmail, password: 'secret', role: 'attendee' });
    expect(registerAttRes.status).toBe(201);
    const attendeeToken = registerAttRes.body.token;

    const createRes = await request(app).post('/api/events')
      .set('Authorization', `Bearer ${attendeeToken}`)
      .send({ title: 'Should not create', description: 'desc', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(403);
  });

  test('Event creator can update and delete the event; others cannot', async () => {
    // create organizer A
    const orgAEmail = `orga-${Date.now()}@example.com`;
    const regA = await request(app).post('/api/register').send({ name: 'Org A', email: orgAEmail, password: 'secret', role: 'organizer' });
    const tokenA = regA.body.token;

    // create organizer B
    const orgBEmail = `orgb-${Date.now()}@example.com`;
    const regB = await request(app).post('/api/register').send({ name: 'Org B', email: orgBEmail, password: 'secret', role: 'organizer' });
    const tokenB = regB.body.token;

    // Create event with Org A
    const createRes = await request(app).post('/api/events').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Owner Event', description: 'desc', dateTime: new Date().toISOString() });
    expect(createRes.status).toBe(201);
    const event = createRes.body;

    // Organizer A updates event
    const updateRes = await request(app).put(`/api/events/${event.id}`).set('Authorization', `Bearer ${tokenA}`).send({ title: 'Updated Title' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Updated Title');

    // Organizer B attempts to update — forbidden
    const updateResB = await request(app).put(`/api/events/${event.id}`).set('Authorization', `Bearer ${tokenB}`).send({ title: 'Hacked Title' });
    expect(updateResB.status).toBe(403);

    // Attendee attempt to delete (should be 403)
    const attendeeEmail = `atta-${Date.now()}@example.com`;
    const regAtt = await request(app).post('/api/register').send({ name: 'Att', email: attendeeEmail, password: 'secret', role: 'attendee' });
    const attToken = regAtt.body.token;

    const deleteAttRes = await request(app).delete(`/api/events/${event.id}`).set('Authorization', `Bearer ${attToken}`);
    expect(deleteAttRes.status).toBe(403);

    // Organizer A deletes successfully
    const deleteOwnerRes = await request(app).delete(`/api/events/${event.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(deleteOwnerRes.status).toBe(204);

    // Fetch after delete should be 404
    const getAfterDelete = await request(app).get(`/api/events/${event.id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(getAfterDelete.status).toBe(404);
  });
});
