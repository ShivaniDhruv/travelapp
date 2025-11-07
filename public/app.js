console.log('app.js loaded');

let selectedDates = [];

function renderSelectedDates() {
  const container = document.getElementById('selectedDates');
  if (!container) return;
  container.innerHTML = '';
  if (selectedDates.length === 0) {
    container.textContent = 'No dates selected';
    return;
  }
  const ul = document.createElement('div');
  ul.style.display = 'flex';
  ul.style.flexWrap = 'wrap';
  ul.style.gap = '0.5rem';
  for (const d of selectedDates) {
    const el = document.createElement('div');
    el.style.border = '1px solid #ddd';
    el.style.padding = '0.25rem 0.5rem';
    el.style.borderRadius = '4px';
    el.textContent = d + ' ';
    const rm = document.createElement('button');
    rm.textContent = 'x';
    rm.style.marginLeft = '0.5rem';
    rm.addEventListener('click', () => { removeSelectedDate(d); });
    el.appendChild(rm);
    ul.appendChild(el);
  }
  container.appendChild(ul);
}

function addSelectedDate(dateStr) {
  if (!dateStr) return;
  if (!selectedDates.includes(dateStr)) {
    selectedDates.push(dateStr);
    // keep sorted
    selectedDates.sort();
  }
  renderSelectedDates();
}

function removeSelectedDate(dateStr) {
  selectedDates = selectedDates.filter(d => d !== dateStr);
  renderSelectedDates();
}

async function doSearch() {
  const dests = document.getElementById('destinations').value.split(',').map(s => s.trim()).filter(Boolean);
  const minNights = parseInt(document.getElementById('minNights').value || '1', 10);
  const output = document.getElementById('output');
  output.innerHTML = '<p>Searching…</p>';

  try {
    const base = (location.protocol === 'file:') ? 'http://localhost:3000' : '';
    if (base) {
      output.innerHTML = '<p>Searching… (will try http://localhost:3000)</p>';
    }

    const body = { destinations: dests, minNights };
    if (selectedDates && selectedDates.length) body.availabilityDates = selectedDates;

    const resp = await fetch(base + '/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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

// Wire add-date UI
document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addDate');
  const dateInput = document.getElementById('dateInput');
  if (addBtn && dateInput) {
    addBtn.addEventListener('click', () => {
      if (dateInput.value) {
        addSelectedDate(dateInput.value);
        dateInput.value = '';
      }
    });
    // allow Enter to add a date when focused on the input
    dateInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        if (dateInput.value) {
          addSelectedDate(dateInput.value);
          dateInput.value = '';
        }
      }
    });
  }
  // initial render
  renderSelectedDates();
});
