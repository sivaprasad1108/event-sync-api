# API Documentation

## Overview

This RESTful API provides backend services for a Virtual Event Management Platform. The API allows users to register and login, create/manage events (organizers only), and register as participants for events. It uses JWT-based authentication, bcrypt for password hashing, and sends registration confirmation emails using Nodemailer (Ethereal by default for local/dev).

All requests and responses use JSON. The API root is mounted under `/api` (e.g., `/api/register`).

## Authentication

- Token type: JWT (JSON Web Token)
- After logging in or registering, the server returns a `token` in the response body. Include this token in the `Authorization` header for protected endpoints.

Example header:

```
Authorization: Bearer <JWT_TOKEN>
```

Notes:
- The JWT payload contains `userId`, `role`, and `email`. The server uses `JWT_SECRET` from environment variables.
- If the Authorization header is absent or the token is invalid/expired, the server returns `401 Unauthorized`.

---

## Endpoints

Base URL: http://localhost:4000 (default)

### POST /api/register
- **Description**: Create a new user (organizer or attendee) and return a JWT.
- **Authorization**: Public
- **Request Body Example**:

```json
{
  "name": "sivaprasad",
  "email": "sivaprasad@example.com",
  "password": "Password123",
  "role": "organizer"
}
```

- **Responses**:
  - 201 Created (success):

```json
{
  "user": {
    "id": "uuid",
    "name": "sivaprasad",
    "email": "sivaprasad@example.com",
    "role": "organizer",
    "createdAt": "2025-12-01T12:00:00.000Z"
  },
  "token": "<jwt-token>"
}
```

  - 400 Bad Request (validation or duplicate email):

```json
{ "message": "name, email, password and role are required" }
```

```json
{ "message": "Email already in use" }
```

---

### POST /api/login
- **Description**: Authenticate a user and return a JWT.
- **Authorization**: Public
- **Request Body Example**:

```json
{ "email": "sivaprasad@example.com", "password": "Password123" }
```

- **Responses**:
  - 200 OK (success):

```json
{
  "user": { "id": "uuid", "email": "sivaprasad@example.com", "name": "sivaprasad", "role": "organizer", "createdAt": "..." },
  "token": "<jwt-token>"
}
```

  - 401 Unauthorized (invalid credentials):

```json
{ "message": "Invalid credentials" }
```

---

### GET /api/events
- **Description**: List events with summary data (participant counts included).
- **Authorization**: Requires token (any authenticated role)
- **Query Parameters**: Optional filtering can be added, but none implemented now.
- **Response**: 200 OK (success)

```json
[
  {
    "id": "uuid",
    "title": "Event Title",
    "description": "Event description",
    "dateTime": "2025-12-01T10:00:00.000Z",
    "organizerId": "organizer-uuid",
    "participantCount": 2,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

  - 401 Unauthorized:

```json
{ "message": "Authorization header missing or invalid" }
```

---

### GET /api/events/:id
- **Description**: Get event details (includes participants array)
- **Authorization**: Requires token (any authenticated role)
- **Path Parameters**: `id` (string)
- **Response**: 200 OK (success)

```json
{
  "id": "uuid",
  "title": "Event Title",
  "description": "Event description",
  "dateTime": "2025-12-01T10:00:00.000Z",
  "organizerId": "organizer-uuid",
  "participants": ["user-id-1", "user-id-2"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

  - 404 Not Found:

```json
{ "message": "Event not found" }
```

---

### POST /api/events
- **Description**: Create a new event
- **Authorization**: Requires token; **Organizer only**
- **Request Body Example**:

```json
{ "title": "Demo Event", "description": "Test event", "dateTime": "2025-12-01T10:00:00.000Z" }
```

- **Responses**:
  - 201 Created:

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

  - 401 Unauthorized (missing or invalid token):

```json
{ "message": "Authorization header missing or invalid" }
```

  - 403 Forbidden (non-organizer tries to create):

```json
{ "message": "Organizer role required" }
```

  - 400 Bad Request (missing fields):

```json
{ "message": "title, description and dateTime are required" }
```

---

### PUT /api/events/:id
- **Description**: Update an event (title, description, dateTime)
- **Authorization**: Requires token; **Organizer only; only event owner can update**
- **Path Params**: `id` of event
- **Request Body Example**:

```json
{ "title": "Updated event title" }
```

- **Responses**:
  - 200 OK (success): updated event object
  - 403 Forbidden (if not the owner):

```json
{ "message": "Only the organizer who created the event can update it" }
```

  - 404 Not Found (event doesn't exist):

```json
{ "message": "Event not found" }
```

---

### DELETE /api/events/:id
- **Description**: Delete an event
- **Authorization**: Requires token; **Organizer only; only event owner can delete**
- **Path Params**: `id` of event
- **Responses**:
  - 204 No Content (success)
  - 403 Forbidden (not owner) or 404 Not Found (if event missing)

```json
{ "message": "Only the organizer who created the event can delete it" }
```

---

### POST /api/events/:id/register
- **Description**: Register the authenticated user for the event
- **Authorization**: Requires token (any role)
- **Path Params**: `id` of event
- **Request Body**: not required
- **Responses**:
  - 200 OK: updated event object with the user added to `participants`

```json
{
  "id": "uuid",
  "title": "Demo Event",
  "participants": ["user-id-1", "user-id-2"],
  "...": "..."
}
```

  - 400 Bad Request (user already registered):

```json
{ "message": "User already registered for this event" }
```

  - 404 Not Found (event not found):

```json
{ "message": "Event not found" }
```

  - 401 Unauthorized (no token):

```json
{ "message": "Authorization header missing or invalid" }
```

Notes:
- When registration is successful, the API calls `emailService.sendRegistrationEmail(userEmail, eventData)`. In tests, this is mocked.
- The send may fail but the endpoint will still return success — failures are logged.

---

## Error Handling Format

All errors return a JSON body with a `message` string and an appropriate HTTP status code. Example:

```json
{ "message": "Invalid credentials" }
```

Common HTTP status codes used:
- 200 OK — successful reads and writes
- 201 Created — successful resource creation
- 204 No Content — successful delete
- 400 Bad Request — validation failure or missing fields
- 401 Unauthorized — missing or invalid token (authentication failure)
- 403 Forbidden — user not allowed for this action (authorization failure)
- 404 Not Found — resource not found
- 500 Internal Server Error — unexpected errors

---

## Data Models / Schemas

### User
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "role": "organizer|attendee",
  "createdAt": "ISO-8601 string"
}
```

> Note: `passwordHash` is stored in-memory for authentication but never returned in responses.

### Event
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "dateTime": "ISO-8601 string",
  "organizerId": "user-id",
  "participants": ["user-id"],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

For list endpoints, events are returned as summary objects that include `participantCount` instead of the full `participants` list.

---

## Usage Workflow Examples

### 1) Create a user (organizer), create an event, and register an attendee
1. POST `/api/register` to create an organizer and retrieve token.
2. POST `/api/events` with the organizer token to create an event.
3. POST `/api/register` to create an attendee and retrieve a token.
4. POST `/api/events/:id/register` with the attendee token to register the user for the event.

### 2) Authenticate and query events
1. POST `/api/login` to receive JWT.
2. GET `/api/events` with token to list events.
3. GET `/api/events/:id` to view full event details.

### 3) Update an event as the owner
1. POST `/api/login` or `/api/register` to receive token for organizer.
2. PUT `/api/events/:id` with the organizer token to update fields.

---

## Tools / Testing Recommendation

- Use Postman, Insomnia, or Thunder Client to exercise endpoints.
- For quick CLI testing, use `curl` and set the `Authorization` header.

Example `curl`:

```bash
# Register
curl -s -X POST http://localhost:4000/api/register -H "Content-Type: application/json" -d '{"name":"sivaprasad","email":"sivaprasad@example.com","password":"pw","role":"organizer"}'

# Create event
curl -s -X POST http://localhost:4000/api/events -H "Content-Type: application/json" -H "Authorization: Bearer <jwt>" -d '{"title":"Event","description":"Desc","dateTime":"2025-12-01T10:00:00Z"}'
```

Testing setup
- Local tests are run with `npm test` using Jest and Supertest.
- Tests use `tests/setup.js` to reset in-memory stores before each test and set `JWT_SECRET` for predictability.
- `emailService` is mocked in tests to avoid external SMTP reliance.

---

## Versioning

- The API is currently unversioned but can be namespace-prefixed (e.g., `/v1`) in future for backward compatibility.

---

## Changelog / Notes

- The project uses in-memory stores suitable for demo purposes only.
- Email sending uses Ethereal when no SMTP settings are provided (good for development and debug).

---

