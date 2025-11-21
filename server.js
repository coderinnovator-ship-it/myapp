// server.js — minimal Express server for ZETRA CORE (starter)
const express = require('express');
const app = express();

app.use(express.json());

// simple health route — useful to check server is alive
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', timestamp: Date.now() });
});

// basic hello route
app.get('/', (req, res) => {
  res.send('ZETRA CORE backend — hello from Connect!');
});

// placeholder for future auth endpoints
// e.g. POST /auth/request-otp, POST /auth/verify-otp, POST /identity/verify-selfie, etc.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Zetra server running on port ${PORT}`);
});
