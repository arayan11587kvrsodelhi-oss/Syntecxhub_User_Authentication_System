# Syntecxhub User Authentication System

A backend authentication system built as part of the Syntecxhub internship project. It provides user registration, login, password hashing, JWT-based authentication, and a protected user profile endpoint.

## Features

- User registration with input validation
- Secure password hashing using bcrypt
- User login and JWT token generation
- Protected endpoint for retrieving the authenticated user's profile
- Duplicate username and email checks
- Request validation using Zod
- PostgreSQL database integration using Prisma ORM

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** JSON Web Tokens (JWT)
- **Password hashing:** bcrypt

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/arayan11587kvrsodelhi-oss/Syntecxhub_User_Authentication_System.git
cd Syntecxhub_User_Authentication_System
```

Install dependencies:

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the project root. Configure it with your own local PostgreSQL credentials and a securely generated JWT secret.

```dotenv
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/syntecxhub_auth?schema=public"
JWT_SECRET="replace-with-a-secure-random-secret"
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS="12"
NODE_ENV="development"
PORT="3000"
```

Replace the database username and password with your own values. Never commit `.env` or publish credentials.

## Database Setup

Generate the Prisma Client:

```bash
npx prisma generate
```

Synchronize the database schema for local development:

```bash
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:3000` by default.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the authenticated user's profile |
| GET | `/api/protected/data` | Protected data endpoint |

### Signup example

Send a `POST` request to `/api/auth/signup` with a JSON body:

```json
{
  "username": "example_user",
  "email": "example@example.com",
  "password": "StrongPassword123!"
}
```

### Login example

Send a `POST` request to `/api/auth/login`:

```json
{
  "username": "example_user",
  "password": "StrongPassword123!"
}
```

A successful login returns a JWT token. Use it to access protected endpoints by including this HTTP header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Testing

The main authentication flow has been tested locally:

- User registration
- Login with valid credentials
- Access to the authenticated user's profile
- Rejection of invalid login credentials

To test the endpoints manually, use PowerShell, Postman, or another HTTP client.

## Security Notes

- Passwords are hashed before storage.
- JWT secrets and database credentials must be kept private.
- Protected endpoints require a valid authentication token.
- Input is validated before user registration and login processing.

## Project Purpose

This project demonstrates backend development fundamentals, database integration, input validation, and token-based authentication as part of a practical internship project.

## Author

Aryan Sharma

GitHub: [@arayan11587kvrsodelhi-oss](https://github.com/arayan11587kvrsodelhi-oss)
