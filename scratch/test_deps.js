async function testDeps() {
  console.log('Testing main.jsx and its pre-bundled deps...');
  const mainRes = await fetch('http://localhost:5173/src/main.jsx');
  const mainText = await mainRes.text();
  console.log('main.jsx status:', mainRes.status);
  
  const imports = mainText.match(/\/node_modules\/\.vite\/deps\/[^\s\"';]+/g) || [];
  console.log('\nFound deps imported by main.jsx:', imports);
  
  for (const dep of imports) {
    const depRes = await fetch('http://localhost:5173' + dep);
    console.log('Dep:', dep.padEnd(60), 'Status:', depRes.status);
    if (depRes.status !== 200) {
      console.log('Dep error text:', (await depRes.text()).slice(0, 200));
    }
  }

  // Also check App.jsx transformed JS text
  console.log('\nTesting App.jsx...');
  const appRes = await fetch('http://localhost:5173/src/App.jsx');
  const appText = await appRes.text();
  console.log('App.jsx status:', appRes.status);
  const appImports = appText.match(/\/node_modules\/\.vite\/deps\/[^\s\"';]+/g) || [];
  console.log('Found deps imported by App.jsx:', appImports);
  for (const dep of appImports) {
    const depRes = await fetch('http://localhost:5173' + dep);
    console.log('Dep:', dep.padEnd(60), 'Status:', depRes.status);
  }
}

testDeps();
