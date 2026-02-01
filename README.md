# Recipe AI – Smart Recipe Recommendations

## Overview

Recipe AI is a full-stack web application that provides AI-powered recipe recommendations based on ingredients entered by the user. The system integrates user authentication, database connectivity, and Google Gemini AI to deliver structured, real-time recipe suggestions through a clean dashboard interface.

This project demonstrates secure backend integration, clean architectural design, and robust handling of AI-generated responses.

---

## Key Features

* User authentication (login & registration)
* Secure backend API using Express
* AI-powered recipe generation using Google Gemini
* Structured recipe outputs rendered as user-friendly cards
* MongoDB database connectivity for user management
* Demo-ready, modular, and extensible design
* User-scoped recipe persistence (JWT-protected endpoints)


---

## System Architecture Overview

**Frontend**

* Login & dashboard UI (HTML, CSS, JavaScript)
* Dynamic rendering of recipe suggestions

**Backend**

* Express server
* REST API endpoints
* Gemini AI integration
* MongoDB connection via Mongoose

**Folder Structure**
```
SIT725_RecipeRecommender/
├── client/
│ ├── public/
│ │ ├── index.html
│ │ ├── dashboard.html
│ │ ├── saved.html
│ │ ├── styles.css
│ │ ├── login-logic.js
│ │ ├── dashboard-logic.js
│ │ └── saved-logic.js
│ └── ...
├── server/
│ ├── app.js
│ ├── server.js
│ ├── config/
│ ├── middleware/
│ ├── models/
│ └── routes/
└── README.md
```


**External Services**

* Google Gemini API (AI generation)
* MongoDB Atlas (database)

---

## Application Flow

```
User Login
  → Authenticated Session
    → Dashboard (Enter Ingredients)
      → POST /api/gemini/recipes
        → Gemini Service
          → Gemini API
        ← Structured JSON
      ← Recipe Cards Rendered
```

---

## Authentication

The application includes a login interface that restricts access to the dashboard and AI recipe feature to authenticated users.

### Login Interface

* Users log in using a username and password
* Credentials are submitted to backend authentication endpoints
* Authentication ensures controlled access to application features

Relevant file:

* `client/public/index.html`

---

## Database Integration

The backend connects to a MongoDB database using **Mongoose**. This database supports:

* User account storage
* Authentication workflows
* Future persistence of generated recipes
* User-scoped persistence of saved recipes


### Database Connection

The database connection is initialised when the server starts. If the connection fails, the application exits to prevent unstable runtime behaviour.

Relevant file:

* `server/config/authDB.js`

---

## AI Recipe Recommendation Feature

### Feature Description

Users enter a list of ingredients on the dashboard. The system sends these ingredients to the backend, which calls the **Google Gemini API** to generate recipe suggestions. The dashboard also includes quick-add ingredient inputs to streamline validation and iteration.


The AI response is then:

* Cleaned
* Validated
* Normalised into a strict JSON schema

This ensures the frontend always receives **structured, predictable data**.

---

## API Endpoint

### `POST /api/gemini/recipes`

**Request**

```json
{
  "ingredients": ["chicken", "eggs", "rice"]
}
```

**Response**

```json
{
  "ok": true,
  "recipes": [
    {
      "title": "Chicken Fried Rice",
      "why_it_fits": "Uses available ingredients efficiently",
      "missing_ingredients": ["soy sauce"],
      "estimated_time_minutes": 25,
      "difficulty": "Easy",
      "steps": ["Cook rice", "Stir fry chicken", "Combine ingredients"],
      "optional_additions": ["spring onions"]
    }
  ]
}
```

---

## Gemini Integration Details

* The Gemini API is accessed **only from the backend**
* API keys are stored securely using environment variables
* The backend enforces a strict JSON schema
* If Gemini returns malformed output, the service:

  * Extracts valid JSON blocks
  * Cleans formatting issues
  * Uses a fallback “repair” pass if required

This ensures reliability even when AI output is inconsistent.

---

## Environment Setup

### Required Environment Variables

Create a `.env` file inside the `server/` directory:

```env
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> `.env` files are intentionally excluded from version control for security reasons.
> A `.env.example` file is provided to document required variables.

---

## Running the Application Locally

From the `server/` directory:

```bash
npm install
node server.js
```

Then open in a browser:

```
http://localhost:3000
```

After logging in, the user will be redirected to:

```
http://localhost:3000/dashboard
```

---

## Usage Guide

## Login/Register

- Navigate to /

- Register a new account or log in

## Generate Recipes

- Go to the dashboard page

- Enter ingredients

- Click Generate

- View recipe cards returned by the AI model

## Save Recipes

- Click Save on a recipe card to store it for your account

- View saved recipes on the Saved Recipes page

## API Summary

| Method | Endpoint                | Description                              |
|--------|-------------------------|------------------------------------------|
| POST   | `/api/auth/register`    | Register a new user                      |
| POST   | `/api/auth/login`       | Authenticate user and return JWT         |
| POST   | `/api/gemini/recipes`   | Generate AI-based recipe suggestions     |
| POST   | `/api/recipes`          | Save a recipe to the user’s account      |
| GET    | `/api/saved`            | Retrieve user’s saved recipes            |
| DELETE | `/api/recipes/:id`      | Remove a saved recipe from the account   |

## Design Decisions

### Backend Proxy Pattern

The Gemini API is called from the backend to:

* Protect API keys
* Control and validate AI responses
* Centralise error handling

### Separation of Concerns

* Routes handle endpoints
* Controllers manage request/response flow
* Services contain business logic and external API calls

### Simplified UI

The dashboard focuses only on ingredient input to:

* Improve usability
* Reduce error cases
* Keep the feature intuitive and focused


## Error Handling & Reliability

* Missing input → user-friendly error messages
* Invalid AI output → graceful retry or failure
* API or configuration errors → handled server-side


## Security Considerations

* API keys never exposed to the client
* `.env` files excluded from Git
* Controlled access via authentication
* Clean input handling


## Automated Backend Testing (Gemini Recipe API)

This project includes automated backend tests for the Gemini recipe API using Jest and Supertest.

The tests validate API behavior in isolation by mocking all external dependencies, ensuring fast, reliable, and repeatable test execution without requiring a database connection or real Gemini API calls.

**What is tested**

- API route availability

- Successful recipe generation with valid input

- Proper input validation and 400 error responses for invalid input

- Response JSON structure for generated recipes

**Testing approach**

- Jest is used as the test runner

- Supertest is used to simulate HTTP requests to the Express app

- Gemini API calls are mocked by default

- Database connections are mocked to avoid external dependencies

**How to run the tests**

From the project root:

```
npm install
npm test
```

No environment variables, database, or Gemini API key are required to run the tests.

**Test location**

```
tests/jest/gemini.recipes.test.js
```

**Expected output**

```
PASS  tests/jest/gemini.recipes.test.js
 ✓ GET /api/gemini/health is available
 ✓ POST /api/gemini/recipes returns expected structure for valid input
 ✓ POST /api/gemini/recipes returns 400 for invalid input
```
