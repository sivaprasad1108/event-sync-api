const request = require('supertest');
const app = require('../src/app');

describe('Auth APIs', () => {
  test('Successful registration', async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/register')
      .send({ name: 'Sivaprasad', email, password: 'password', role: 'organizer' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ email, role: 'organizer', name: 'Sivaprasad' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).toHaveProperty('id');
  });

  test('Registration with existing email returns 400', async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    await request(app).post('/api/register').send({ name: 'Bob', email, password: 'password', role: 'attendee' });
    const res = await request(app).post('/api/register').send({ name: 'Bob2', email, password: 'password', role: 'attendee' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  test('Successful login', async () => {
    const email = `login-${Date.now()}@example.com`;
    const password = 'mypassword';
    await request(app).post('/api/register').send({ name: 'Carl', email, password, role: 'attendee' });
    const loginRes = await request(app).post('/api/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body).toHaveProperty('user');
    expect(loginRes.body.user).not.toHaveProperty('passwordHash');
  });

  test('Login with wrong password returns 401', async () => {
    const email = `wrongpass-${Date.now()}@example.com`;
    await request(app).post('/api/register').send({ name: 'Deb', email, password: 'realpass', role: 'attendee' });
    const res = await request(app).post('/api/login').send({ email, password: 'badpass' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('Login with unknown email returns 401', async () => {
    const res = await request(app).post('/api/login').send({ email: 'unknown@example.com', password: 'x' });
    expect(res.status).toBe(401);
  });
});
