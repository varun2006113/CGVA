const BASE = 'http://localhost:5173';

async function test(path) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (e) {}
    console.log(`[${res.status}] ${path} | JSON: ${!!json}`);
    return res.status === 200 && json !== null;
  } catch (err) {
    console.error(`[FAIL] ${path}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('--- TESTING ALL CONSOLIDATED ROUTES ---');
  await test('/api/gene/TP53');
  await test('/api/variant?query=rs28934578');
  await test('/api/compare?varA=rs28934578&varB=rs121913343');
  await test('/api/analytics?symbol=TP53');
  await test('/api/variant/rs28934578/clinical');
  await test('/api/variant/TP53/protein');
  await test('/api/variant/rs28934578/structure');
  await test('/api/variant/rs28934578/predictions');
  console.log('--- ALL TESTS COMPLETE ---');
}

main();
