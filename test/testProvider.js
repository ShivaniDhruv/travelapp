const provider = require('../lib/flightProvider');

(async function(){
  try {
    const price = await provider.getPrice('HOME','Tokyo','2025-12-10','2025-12-15');
    console.log('Sample price for Tokyo 2025-12-10 -> 2025-12-15:', price);
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
