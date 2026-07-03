## 🎵 enCore — Music Events Web App

enCore is a full-stack web application that lets users discover, save, and track live music events near them. Built by a team of 5 developers over two weeks at Makers Academy.

### Team
Built by Coral, Joe, Kit, Maria and Zein at Makers Academy, 2025.

### What it does

- Browse live music events pulled from the Ticketmaster API
- Filter events by city, date range, and genre tags
- Follow artists and get personalised recommendations
- Save events to your profile
- Set your home location to see events near you

### Structure

This repo contains two applications:

- A frontend React App (Vite)
- A backend API server (Node.js + Express)

These two applications will communicate through HTTP requests, and need to be run separately.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | Better Auth |
| Events API | Ticketmaster Discovery API |
| Maps | Google Maps API |
| Location Search | Geoapify Autocomplete |

### Card wall

Link to our Trello board: https://trello.com/invite/b/6a3945bef636cd146d28a5b0/ATTIdc6a806202ac862a1b056cb2c9428b56A3E4CAB7/gigs-app

### Quickstart

#### Install Node.js

If you haven't already, make sure you have node and NVM installed.

1. Install Node Version Manager (NVM)
```bash
brew install nvm
```
   Then follow the instructions to update your `~/.zshrc`.
2. Open a new terminal
3. Install the latest version of [Node.js](https://nodejs.org/en/), (`20.5.0` at time of writing).
```bash
nvm install 20
```

#### Set up your project

1. Clone the repository
```bash
git clone <repo-url>
cd events-webapp
```
2. Install dependencies for both the `frontend` and `api` applications:
```bash
cd frontend
npm install --legacy-peer-deps
cd ../api
npm install
```
   _Note:_ `--legacy-peer-deps` is required in the frontend due to a peer dependency conflict between Geoapify and React 18.

3. Install an ESLint plugin for your editor, for example
   [ESLint for VSCode](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

#### Setting up environment variables

We need to create three `.env` files — one in the frontend and two in the api.

##### Frontend

Create a file `frontend/.env` with the following contents:
```bash
VITE_BACKEND_URL="http://localhost:3000"
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_demo_key"
VITE_GEOAPIFY_API_KEY="your_geoapify_key"
```
##### Backend

Create a file `api/.env` with the following contents:
```bash
MONGODB_URL="your_mongodb_connection_string"
BETTER_AUTH_SECRET="your_secret"
BETTER_AUTH_URL="http://localhost:3000"
TICKETMASTER_API_KEY="your_ticketmaster_key"
```

Create a file `api/.env.test` with the following contents:
```bash
MONGODB_URL="mongodb://0.0.0.0/events_test"
BETTER_AUTH_SECRET="test-secret-not-for-production"
BETTER_AUTH_URL="http://localhost:3000"
```

_Note:_ Never commit `.env` files — they are already in `.gitignore`.

#### Seed the database

Once your backend is running, seed events from Ticketmaster:
```bash
cd api
node scripts/seed.js
```

### How to run the server and use the app

1. Start the server application (in the `api` directory) in dev mode:
```bash
cd api
nvm use 20
npm run dev
```

2. Start the front end application (in the `frontend` directory)

In a new terminal session...
```bash
cd frontend
npm run dev
```

You should now be able to open your browser and go to `http://localhost:5173` to use the app.

Sign up for an account at `http://localhost:5173/signup` and log in at `http://localhost:5173/login`.

### How to run the tests

**Backend:**
```bash
cd api
nvm use 20
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```
