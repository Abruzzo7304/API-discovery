// Test Network Contact API endpoints
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test various Network Contact endpoint possibilities
async function testNetworkContactEndpoints() {
  console.log('🔍 TESTING NETWORK CONTACT API ENDPOINTS');
  console.log('=========================================');

  const endpoints = [
    'networkcontact.json',
    'network_contact.json',
    'NetworkContact.json',
    'netcontact.json',
    'contact.json',
    'subcontractor.json',
    'contractor.json',
    'vendor.json',
    'supplier.json',
    'partner.json',
    'external.json',
    'network.json'
  ];

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);

    try {
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS - Found ${Array.isArray(data) ? data.length : 'data'} records`);

        if (Array.isArray(data) && data.length > 0) {
          console.log(`   📋 Sample fields: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
        }

        results.push({
          endpoint,
          status: 'SUCCESS',
          recordCount: Array.isArray(data) ? data.length : 1,
          sampleFields: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []
        });
      } else if (response.status === 401) {
        console.log(`   🔐 UNAUTHORIZED - Authentication issue`);
        results.push({ endpoint, status: 'UNAUTHORIZED' });
      } else if (response.status === 404) {
        console.log(`   ❌ NOT FOUND - Endpoint doesn't exist`);
        results.push({ endpoint, status: 'NOT_FOUND' });
      } else if (response.status === 403) {
        console.log(`   🚫 FORBIDDEN - No permission to access`);
        results.push({ endpoint, status: 'FORBIDDEN' });
      } else {
        console.log(`   ⚠️  ERROR ${response.status}`);
        results.push({ endpoint, status: `ERROR_${response.status}` });
      }
    } catch (error) {
      console.log(`   💥 EXCEPTION: ${error.message}`);
      results.push({ endpoint, status: 'EXCEPTION', error: error.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n\n🎯 ENDPOINT TEST SUMMARY');
  console.log('========================');

  const successful = results.filter(r => r.status === 'SUCCESS');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');
  const forbidden = results.filter(r => r.status === 'FORBIDDEN');
  const errors = results.filter(r => r.status.startsWith('ERROR_'));

  console.log(`✅ Successful endpoints: ${successful.length}`);
  console.log(`❌ Not found: ${notFound.length}`);
  console.log(`🚫 Forbidden: ${forbidden.length}`);
  console.log(`⚠️  Errors: ${errors.length}`);

  if (successful.length > 0) {
    console.log('\n✅ WORKING ENDPOINTS:');
    successful.forEach(result => {
      console.log(`   • ${result.endpoint} - ${result.recordCount} records`);
      if (result.sampleFields.length > 0) {
        console.log(`     Fields: ${result.sampleFields.slice(0, 8).join(', ')}`);
      }
    });
  }

  if (forbidden.length > 0) {
    console.log('\n🚫 FORBIDDEN ENDPOINTS (might exist but no access):');
    forbidden.forEach(result => {
      console.log(`   • ${result.endpoint}`);
    });
  }

  return results;
}

// Test for Network Contact creation
async function testNetworkContactCreation() {
  console.log('\n\n🛠️  TESTING NETWORK CONTACT CREATION');
  console.log('====================================');

  // Test if we can create a network contact
  const testData = {
    company_name: 'Test Network Contact',
    contact_first: 'John',
    contact_last: 'TestContractor',
    email: 'john@testcontractor.com',
    mobile: '0412345678',
    active: 1
  };

  const creationEndpoints = [
    'networkcontact.json',
    'network_contact.json',
    'vendor.json',
    'contact.json'
  ];

  for (const endpoint of creationEndpoints) {
    console.log(`\n📝 Testing creation on: ${endpoint}`);

    try {
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ SUCCESS - Created record with UUID: ${result.uuid || 'Unknown'}`);
        return { endpoint, success: true, result };
      } else {
        const errorText = await response.text();
        console.log(`   ❌ FAILED ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   💥 EXCEPTION: ${error.message}`);
    }
  }

  return null;
}

// Run all tests
async function runAllTests() {
  await testNetworkContactEndpoints();
  await testNetworkContactCreation();

  console.log('\n\n📚 CONCLUSION');
  console.log('=============');
  console.log('This test explores all possible Network Contact API endpoints.');
  console.log('Check the results above to see which endpoints are available');
  console.log('for Network Contact management in ServiceM8.');
}

runAllTests();