const request = require('supertest');
const app = require('../app');

describe('Auth routes', () => {
  test('Successful registration and login', async () => {
    const email = `user-${Date.now()}@example.com`;
    const registerResponse = await request(app).post('/api/register').send({
      name: 'Test User',
      email,
      password: 'secret',
      role: 'attendee',
    });
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.token).toBeDefined();
    expect(registerResponse.body.user).toBeDefined();
    expect(registerResponse.body.user).not.toHaveProperty('passwordHash');

    const loginResponse = await request(app).post('/api/login').send({
      email,
      password: 'secret',
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();
  });

  test('Login with wrong credentials returns 401', async () => {
    const email = `broken-${Date.now()}@example.com`;
    // don't register this email
    const response = await request(app).post('/api/login').send({ email, password: 'wrong' });
    expect(response.status).toBe(401);
  });
});
