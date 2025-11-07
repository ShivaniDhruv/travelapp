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
  // Request body may include either:
  // - availabilityDates: ["2025-12-01","2025-12-05",...]
  // OR
  // - availabilityStart and availabilityEnd (legacy)
  const { destinations, availabilityDates, availabilityStart, availabilityEnd, minNights = 1 } = req.body;
  if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
    return res.status(400).json({ error: 'destinations (array) required' });
  }

  let dates = null;
  if (Array.isArray(availabilityDates) && availabilityDates.length > 0) {
    dates = availabilityDates;
  } else if (availabilityStart && availabilityEnd) {
    // build array of dates between start and end (inclusive)
    const s = new Date(availabilityStart);
    const e = new Date(availabilityEnd);
    dates = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().slice(0, 10));
    }
  } else {
    return res.status(400).json({ error: 'availabilityDates (array) or availabilityStart/availabilityEnd required' });
  }

  try {
    const results = [];
    for (const dest of destinations) {
      const best = await findBestForDestination(dest, dates, minNights);
      results.push({ destination: dest, best });
    }
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// availabilityDates: array of YYYY-MM-DD strings (may be non-contiguous)
async function findBestForDestination(destination, availabilityDates, minNights) {
  // parse, dedupe and sort
  const uniq = Array.from(new Set((availabilityDates || []).map(s => s.slice(0, 10)))).sort();
  if (uniq.length === 0) return null;

  // build consecutive blocks
  const blocks = [];
  let currentBlock = [uniq[0]];
  function dayAfter(a, b) {
    const da = new Date(a);
    const db = new Date(b);
    const diff = (db - da) / (1000 * 60 * 60 * 24);
    return diff === 1;
  }
  for (let i = 1; i < uniq.length; i++) {
    if (dayAfter(uniq[i - 1], uniq[i])) {
      currentBlock.push(uniq[i]);
    } else {
      blocks.push(currentBlock);
      currentBlock = [uniq[i]];
    }
  }
  blocks.push(currentBlock);

  const candidates = [];
  // For each block, generate candidate depart/return pairs that fully fit inside the block
  for (const block of blocks) {
    const N = block.length;
    // need at least 2 days to have a 1-night trip
    if (N < 2) continue;
    for (let i = 0; i < N - 1; i++) {
      // max nights if departing on index i is (N - i - 1)
      const maxNightsHere = N - i - 1;
      for (let nights = minNights; nights <= maxNightsHere; nights++) {
        const depart = block[i];
        const ret = block[i + nights];
        candidates.push({ depart, return: ret });
      }
    }
  }

  let best = null;
  for (const c of candidates) {
    const price = await flightProvider.getPrice('HOME', destination, c.depart, c.return);
    if (!best || price < best.price) {
      best = { depart: c.depart, return: c.return, price };
    }
  }
  return best;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
