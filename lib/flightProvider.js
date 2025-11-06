// Mock flight provider - replace this with calls to a real API (Amadeus, Skyscanner, etc.)
// Exported function: getPrice(origin, destination, departDate, returnDate) -> Promise<number>

module.exports.getPrice = async function (origin, destination, departDate, returnDate) {
  // Very small deterministic-ish mock for demo purposes.
  const dep = new Date(departDate);
  const ret = new Date(returnDate);
  const nights = Math.max(1, Math.round((ret - dep) / (1000 * 60 * 60 * 24)));

  // Base price and simple heuristics to simulate variance
  const base = 80;
  const destFactor = Math.max(50, destination.length * 20);
  const seasonal = (dep.getMonth() % 12) * 10;
  const lengthFactor = nights * 15;

  // pseudo-random but not truly random so repeated runs vary a bit
  const rand = Math.floor(Math.abs(Math.sin(dep.getTime() + destination.length) * 200));

  const price = Math.round(base + destFactor + seasonal + lengthFactor + rand);
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 30));
  return price;
};
