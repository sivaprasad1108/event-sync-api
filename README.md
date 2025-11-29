# Virtual Event Management Backend

A small, testable backend API for a Virtual Event Management Platform built using Node.js & Express. This project demonstrates role-based access, in-memory data stores, JWT authentication, password hashing with bcrypt, email confirmations using Nodemailer, and comprehensive tests using Jest + Supertest.

---

## Overview

This backend provides endpoints for user registration and login, event creation and management (organizer-only), and participant registration for events. It's intended for educational and assignment purposes and uses in-memory storage (no database). The API is asynchronous and properly tested.

Key features
- User authentication with bcrypt for password hashing and JWT for token-based authentication
- Role-based authorization (organizer vs attendee)
- Event CRUD operations protected by role and ownership checks
- Participant registration for events and email confirmation (via Nodemailer)
- In-memory data storage (simple arrays) for both users and events
- RESTful API design and async handling
- Jest + Supertest integration tests with mocked email sending

---

## Tech Stack

- Node.js (14+ / 18+ recommended)
- Express.js
- bcrypt
- jsonwebtoken (JWT)
- nodemailer
- dotenv (for environment variables)
- jest + supertest (for tests)
- uuid

---

## Project Structure

```
event-sync-api/
├─ src/
│  ├─ app.js              # Express app and route registration
│  ├─ server.js           # Server entrypoint
│  ├─ routes/
│  │  ├─ authRoutes.js
│  │  └─ eventRoutes.js
│  ├─ controllers/
│  │  ├─ authController.js
│  │  └─ eventController.js
│  ├─ middleware/
│  │  ├─ authMiddleware.js
│  │  ├─ roleMiddleware.js
│  │  └─ errorHandler.js
│  ├─ services/
│  │  ├─ emailService.js
│  │  └─ jwtService.js
│  ├─ data/
│  │  ├─ usersStore.js
│  │  └─ eventsStore.js
│  └─ tests/              # local test helpers and legacy tests
├─ tests/                 # main test suites (Jest + Supertest)
│  ├─ auth.test.js
│  ├─ events.test.js
│  └─ registration.test.js
├─ package.json
├─ README.md
└─ context.md
```

---

## Features

- Authentication: register/login with hashed passwords (bcrypt) and JWT tokens
- Authorization: organizer vs attendee roles and route enforcement
- Event CRUD (create, read, update, delete) with ownership checks
- Participant registration for events with confirmation email trigger
- In-memory stores for users and events (suitable for assignment/test environments)
- Centralized error handling for consistent JSON error responses
- Full test coverage using Jest and Supertest and mocked email calls

---

## Installation & Setup

### Prerequisites

- Node.js 14+ (Node 18+ recommended)
- npm (included with Node.js)

### Clone & install

```bash
git clone <repository-url>
cd event-sync-api
npm install
```

### Environment Variables

Create a `.env` file at the repository root (optional — the app will use sane defaults for local testing):

```
PORT=4000
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email-username
SMTP_PASS=your-email-password
EMAIL_FROM=no-reply@example.com
```

- If no SMTP configuration is provided, the app falls back to Ethereal (a test SMTP service) for local development and tests.
- `JWT_SECRET` is strongly recommended to be set for production environments.

---

## Running the Server

Start the server:

```bash
npm start
```

During development with autoreload (requires `nodemon`):

```bash
npm run dev
```

The server listens on `PORT` (defaults to `4000`). The app mounts routes under `/api`, so the endpoints begin with `/api/`.

---

## Running Tests

This project uses Jest + Supertest to run integration tests covering authentication, event management, and registration.

```bash
npm test
```

Notes:
- Tests run in a Node environment and use `src/tests/setup.js` to reset the in-memory stores before each test.
- Email sending is mocked in tests to avoid reliance on real SMTP.

---

## API Endpoints

All endpoints are mounted under `/api` (e.g. `/api/register`).

| Method | Endpoint                | Auth Required | Role      | Description |
|--------|-------------------------|---------------|-----------|-------------|
| POST   | /api/register           | No            | —         | Register a new user (organizer or attendee)
| POST   | /api/login              | No            | —         | Login and receive a JWT
| GET    | /api/events             | Yes           | Any       | List events (returns basic data; authenticated preferred)
| GET    | /api/events/:id         | Yes           | Any       | Get full event detail including participants
| POST   | /api/events             | Yes           | Organizer | Create an event (organizer-only)
| PUT    | /api/events/:id         | Yes           | Organizer | Update event (organization-only & owner required)
| DELETE | /api/events/:id         | Yes           | Organizer | Delete event (owner-only)
| POST   | /api/events/:id/register| Yes           | Any       | Register authenticated user for an event

---

### Example Requests & Responses

1) Register (POST /api/register)

Request:

```bash
curl -X POST http://localhost:4000/api/register -H 'Content-Type: application/json' -d '{"name":"Alice","email":"alice@example.com","password":"password","role":"organizer"}'
```

Response (201):

```json
{
  "user": {
    "id": "uuid",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "organizer",
    "createdAt": "2025-01-01T12:34:56.789Z"
  },
  "token": "<jwt-token>"
}
```

2) Login (POST /api/login)

Request:

```bash
curl -X POST http://localhost:4000/api/login -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"password"}'
```

Response (200):

```json
{
  "user": { "id":"...", "email":"alice@example.com", "name":"Alice", "role":"organizer", "createdAt":"..." },
  "token": "<jwt-token>"
}
```

3) Create Event (POST /api/events)

Request headers:
```
Authorization: Bearer <jwt-token>
```

Request body:

```json
{ "title": "Demo Event", "description": "Test event", "dateTime": "2025-12-01T10:00:00.000Z" }
```

Response (201):

```json
{
  "id": "uuid",
  "title": "Demo Event",
  "description": "Test event",
  "dateTime": "2025-12-01T10:00:00.000Z",
  "organizerId": "<user-id>",
  "participants": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

4) Register for Event (POST /api/events/:id/register)

Request headers:
```
Authorization: Bearer <attendee-jwt-token>
```

Response (200):

```json
{
  "id": "uuid",
  "title": "Demo Event",
  "description": "Test event",
  "dateTime": "...",
  "organizerId": "<user-id>",
  "participants": ["<attendee-id>"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Testing Coverage Summary

The project includes comprehensive tests to ensure the core functionality of the system:

- `tests/auth.test.js`: registration and login tests
  - Successful registration
  - Duplicate email registration returns 400
  - Successful login returns a JWT
  - Wrong password returns 401
  - Unknown email returns 401

- `tests/events.test.js`: event-related tests
  - Organizer can create event
  - Attendee cannot create events (403)
  - Unauthorized creation returns 401
  - Retrieve events list (GET /api/events)
  - Organizer can update/delete event
  - Non-owner cannot update/delete the event (403)
  - Update on non-existent event returns 404

- `tests/registration.test.js`: event registration tests
  - Successful registration (attendee can register for event)
  - Duplicate registration returns 400
  - Registration to non-existent event returns 404
  - Registration without token returns 401

Tests are deterministic and ensure the in-memory stores are cleared between test runs via a test setup file.

---

## Limitations

- In-memory storage only — not persistent. All data is lost on restart.
- Not production-ready in terms of security & robustness; lacks rate-limiting, input sanitization, and persistent storage.
- Nodemailer is configured for Ethereal or a given SMTP; production requires a real SMTP provider and environment variable configuration.

---

## Future Enhancements

- Replace in-memory stores with a database like MongoDB or PostgreSQL.
- Add input validation and better error messages using `express-validator` or similar.
- Add role-based admin panel and dashboard for organizers.
- Add email templates and HTML email support for registration confirmations.
- Add real-time notifications (e.g., WebSocket) for event updates and participant changes.
- Add CI / GitHub Actions for automatic testing and linting.

---

## License

This project is available under the MIT License.

---

## Submission Notes

- The repository contains all required endpoints and tests, and a `context.md` describing requirements.
- All tests should pass with `npm test` after installing dependencies.

If you have any questions or want improvements (e.g., adding CI or integrating a DB), let me know and I can implement them next.
# event-sync-api
