const pages = [
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/components/Navbar.jsx',
  '/src/components/DisclaimerBanner.jsx',
  '/src/components/ErrorBoundary.jsx',
  '/src/pages/HomePage.jsx',
  '/src/pages/GeneExplorerPage.jsx',
  '/src/pages/VariantExplorerPage.jsx',
  '/src/pages/AnalyticsPage.jsx',
  '/src/pages/ComparisonPage.jsx',
  '/src/pages/AboutPage.jsx',
  '/src/components/Variant3DViewer.jsx',
  '/src/components/EvidenceInterpretation.jsx',
  '/src/components/VariantComparison.jsx'
];

async function checkModules() {
  console.log('Checking Vite module responses...');
  for (const path of pages) {
    try {
      const res = await fetch('http://localhost:5173' + path);
      console.log(path.padEnd(45), 'Status:', res.status, 'Type:', res.headers.get('content-type'));
      if (res.status !== 200) {
        const text = await res.text();
        console.error('  --> ERROR BODY:', text);
      }
    } catch(e) {
      console.log(path.padEnd(45), 'ERR:', e.message);
    }
  }
}

checkModules();
