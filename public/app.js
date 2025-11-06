console.log('app.js loaded');

async function doSearch() {
  const start = document.getElementById('start').value;
  const end = document.getElementById('end').value;
  const dests = document.getElementById('destinations').value.split(',').map(s => s.trim()).filter(Boolean);
  const minNights = parseInt(document.getElementById('minNights').value || '1', 10);
  const maxNights = parseInt(document.getElementById('maxNights').value || '7', 10);
  const output = document.getElementById('output');
  output.innerHTML = '<p>Searching…</p>';

  try {
    const base = (location.protocol === 'file:') ? 'http://localhost:3000' : '';
    if (base) {
      output.innerHTML = '<p>Searching… (will try http://localhost:3000)</p>';
    }

    const resp = await fetch(base + '/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinations: dests, availabilityStart: start, availabilityEnd: end, minNights, maxNights })
    });
    if (!resp.ok) throw new Error('Server error: ' + resp.statusText);
    const data = await resp.json();
    renderResults(data.results);
  } catch (err) {
    output.innerHTML = '<pre style="color:red">' + err.message + '</pre>';
  }
}

function renderResults(results) {
  const output = document.getElementById('output');
  if (!results || results.length === 0) {
    output.innerHTML = '<p>No results</p>';
    return;
  }
  output.innerHTML = '';
  for (const r of results) {
    const div = document.createElement('div');
    div.className = 'result';
    if (!r.best) {
      div.innerHTML = `<strong>${r.destination}</strong><div>No candidate trips in the given window.</div>`;
    } else {
      div.innerHTML = `<strong>${r.destination}</strong>
        <div>Depart: ${r.best.depart}</div>
        <div>Return: ${r.best.return}</div>
        <div>Estimated price: $${r.best.price}</div>`;
    }
    output.appendChild(div);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('search');
  if (!btn) {
    console.warn('Search button not found in DOM');
    return;
  }
  btn.addEventListener('click', doSearch);
});
