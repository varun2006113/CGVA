const BASE = 'http://localhost:5173';

async function testEndpoint(name, url, expectedStatus = 200) {
  console.log(`\n==================================================`);
  console.log(`TESTING: ${name}`);
  console.log(`URL: ${url}`);
  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let isJson = false;
    let json = null;
    try {
      json = JSON.parse(text);
      isJson = true;
    } catch (e) {}

    console.log(`HTTP Status: ${res.status}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`Is Valid JSON: ${isJson}`);
    if (isJson) {
      console.log(`Top-level Keys:`, Object.keys(json));
    } else {
      console.log(`Raw Response Start:`, text.slice(0, 150));
    }
    return { status: res.status, contentType, isJson, json, text };
  } catch (err) {
    console.error(`Fetch error for ${name}:`, err.message);
    return null;
  }
}

async function runAllTests() {
  // 1. Gene: BRCA1
  await testEndpoint('1. Gene BRCA1', `${BASE}/api/gene/BRCA1`);

  // 2. Variant: rs28934578 (query param format)
  const v1 = await testEndpoint('2. Variant rs28934578', `${BASE}/api/variant?query=rs28934578`);
  if (v1 && v1.json && v1.json.variant) {
    console.log(`   -> Gene: ${v1.json.variant.gene?.symbol}`);
    console.log(`   -> Coding HGVS: ${v1.json.variant.hgvs?.coding}`);
    console.log(`   -> Protein HGVS: ${v1.json.variant.hgvs?.protein}`);
    console.log(`   -> Alternate Allele: ${v1.json.variant.genomic?.alternate}`);
  }

  // 3. Variant: rs121913343
  const v2 = await testEndpoint('3. Variant rs121913343', `${BASE}/api/variant?query=rs121913343`);
  if (v2 && v2.json && v2.json.variant) {
    console.log(`   -> Gene: ${v2.json.variant.gene?.symbol}`);
    console.log(`   -> Coding HGVS: ${v2.json.variant.hgvs?.coding}`);
    console.log(`   -> Protein HGVS: ${v2.json.variant.hgvs?.protein}`);
  }

  // 4. Variant: rs121913529
  const v3 = await testEndpoint('4. Variant rs121913529', `${BASE}/api/variant?query=rs121913529`);
  if (v3 && v3.json && v3.json.variant) {
    console.log(`   -> Gene: ${v3.json.variant.gene?.symbol}`);
    console.log(`   -> Alternate Alleles: ${v3.json.variant.genomic?.alternate}`);
  }

  // 5. Invalid: rs999999999999
  await testEndpoint('5. Invalid Variant rs999999999999', `${BASE}/api/variant?query=rs999999999999`, 404);

  // 6. Comparison: rs28934578 vs rs121913343
  const comp = await testEndpoint('6. Comparison rs28934578 vs rs121913343', `${BASE}/api/compare?varA=rs28934578&varB=rs121913343`);
  if (comp && comp.json) {
    console.log(`   -> Variant A query: ${comp.json.variantA?.query}`);
    console.log(`   -> Variant B query: ${comp.json.variantB?.query}`);
    console.log(`   -> Comparison summary: ${comp.json.comparison?.summary}`);
  }
}

runAllTests();
