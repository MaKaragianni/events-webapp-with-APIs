require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { toNodeHandler } = require('better-auth/node');
const { auth } = require('./lib/auth');

const userProfileRouter = require('./routes/userProfile')

const eventsRouter = require("./routes/events");

const app = express();

// CORS — must allow credentials so cookies work
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// better-auth handler — MUST come before express.json()
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parser for everything else
app.use(express.json());

// Application routes
app.use("/events", eventsRouter);

// Health check route so we can test the server is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/profile', userProfileRouter)

// DEV ONLY — surfaces the most recent password-reset link so the frontend
// can show it in a pop-up while no real email provider is configured.
// Remove this route (and api/lib/devResetLinkStore.js) once
// sendResetPassword in lib/auth.js sends real emails.
if (process.env.NODE_ENV !== 'production') {
  const { getLastResetLink } = require('./lib/devResetLinkStore')
  app.get('/dev/reset-link', (req, res) => {
    res.json({ url: getLastResetLink() })
  })
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ err: 'Error 404: Not Found' });
});

// 500 Error handler
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ err: 'Something went wrong' });
});

module.exports = app;