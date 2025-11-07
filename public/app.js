console.log('app.js loaded');

let selectedDates = [];
let flatpickrInstance = null;

// Format a date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// Parse a date range and add all dates in between
function addDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  const endDate = new Date(end);
  
  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Add all dates that aren't already selected
  for (const d of dates) {
    if (!selectedDates.includes(d)) {
      selectedDates.push(d);
    }
  }
  
  // Sort all dates
  selectedDates.sort();
  renderSelectedDates();
}

function renderSelectedDates() {
  const container = document.getElementById('selectedDates');
  if (!container) return;
  container.innerHTML = '';
  
  if (selectedDates.length === 0) {
    container.innerHTML = '<div class="help-text">No dates selected yet</div>';
    return;
  }
  
  // Group consecutive dates into ranges for cleaner display
  const ranges = [];
  let currentRange = [selectedDates[0]];
  
  function dayAfter(a, b) {
    const da = new Date(a);
    const db = new Date(b);
    const diff = (db - da) / (1000 * 60 * 60 * 24);
    return diff === 1;
  }
  
  for (let i = 1; i < selectedDates.length; i++) {
    if (dayAfter(selectedDates[i-1], selectedDates[i])) {
      currentRange.push(selectedDates[i]);
    } else {
      ranges.push(currentRange);
      currentRange = [selectedDates[i]];
    }
  }
  ranges.push(currentRange);
  
  // Create tags for each range
  for (const range of ranges) {
    const el = document.createElement('div');
    el.className = 'date-tag';
    
    const dates = range.length === 1 
      ? range[0]
      : `${range[0]} → ${range[range.length-1]}`;
      
    el.innerHTML = `
      <span>${dates}</span>
      <button type="button" title="Remove these dates">×</button>
    `;
    
    // Remove either single date or range when clicking X
    el.querySelector('button').addEventListener('click', () => {
      selectedDates = selectedDates.filter(d => !range.includes(d));
      renderSelectedDates();
      
      // Clear the date picker selection
      if (flatpickrInstance) {
        flatpickrInstance.clear();
      }
    });
    
    container.appendChild(el);
  }
}

async function doSearch() {
  const dests = document.getElementById('destinations').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
    
  const minNights = parseInt(document.getElementById('minNights').value || '1', 10);
  const output = document.getElementById('output');
  
  if (!dests.length) {
    output.innerHTML = '<div class="help-text">Please enter at least one destination</div>';
    return;
  }
  
  if (!selectedDates.length) {
    output.innerHTML = '<div class="help-text">Please select some available dates first</div>';
    return;
  }
  
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
    output.innerHTML = '<p>No results found</p>';
    return;
  }
  output.innerHTML = '';
  for (const r of results) {
    const div = document.createElement('div');
    div.className = 'result';
    const planeIcon = '<span class="plane"><i class="fas fa-plane-departure"></i></span>';
    if (!r.best) {
      div.innerHTML = `
        ${planeIcon}
        <strong>${r.destination}</strong>
        <div>No suitable trips found in your selected dates.</div>
      `;
    } else {
      div.innerHTML = `
        ${planeIcon}
        <strong>${r.destination}</strong>
        <div>Depart: ${r.best.depart}</div>
        <div>Return: ${r.best.return}</div>
        <div>Estimated price: $${r.best.price}</div>
      `;
    }
    output.appendChild(div);
  }
}

// Initialize Flatpickr calendar and wire up event handlers
document.addEventListener('DOMContentLoaded', () => {
  // Initialize date picker
  flatpickrInstance = flatpickr("#dateInput", {
    mode: "range",
    dateFormat: "Y-m-d",
    minDate: "today",
    showMonths: 2,
    animate: true,
    position: "below",
    static: true,
    onOpen: function(selectedDates, dateStr, instance) {
      // Try to keep calendar in viewport
      setTimeout(() => {
        const cal = instance.calendarContainer;
        if (cal) {
          cal.style.left = '0';
          cal.style.right = 'auto';
          cal.style.maxWidth = '100vw';
          cal.style.zIndex = 1000;
        }
      }, 10);
    },
    onClose: function(dates) {
      if (dates.length === 2) {
        addDateRange(dates[0], dates[1]);
        this.clear(); // Clear for next selection
      }
    }
  });
  
  // Wire search button
  const btn = document.getElementById('search');
  if (btn) {
    btn.addEventListener('click', doSearch);
  }
  
  // Initial render
  renderSelectedDates();
});

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
