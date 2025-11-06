const express = require('express');
const path = require('path');
const flightProvider = require('./lib/flightProvider');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/search
// Request body: { destinations: ["Paris","Tokyo"], availabilityStart: "2025-12-01", availabilityEnd: "2025-12-20", minNights:1, maxNights:7 }
app.post('/api/search', async (req, res) => {
  const { destinations, availabilityStart, availabilityEnd, minNights = 1, maxNights = 7 } = req.body;
  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'destinations (array) required' });
  }
  if (!availabilityStart || !availabilityEnd) {
    return res.status(400).json({ error: 'availabilityStart and availabilityEnd required' });
  }

  try {
    const results = [];
    for (const dest of destinations) {
      const best = await findBestForDestination(dest, availabilityStart, availabilityEnd, minNights, maxNights);
      results.push({ destination: dest, best });
    }
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function findBestForDestination(destination, startStr, endStr, minNights, maxNights) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const candidates = [];

  // Generate candidate departure/return dates inside availability window
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    for (let nights = minNights; nights <= maxNights; nights++) {
      const dep = new Date(d);
      const ret = new Date(d);
      ret.setDate(ret.getDate() + nights);
      if (ret > end) continue;
      candidates.push({ depart: new Date(dep), return: new Date(ret) });
    }
  }

  let best = null;
  for (const c of candidates) {
    const departISO = c.depart.toISOString().slice(0, 10);
    const returnISO = c.return.toISOString().slice(0, 10);
    const price = await flightProvider.getPrice('HOME', destination, departISO, returnISO);
    if (!best || price < best.price) {
      best = { depart: departISO, return: returnISO, price };
    }
  }
  return best;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
