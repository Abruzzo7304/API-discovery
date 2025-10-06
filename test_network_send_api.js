// Test if there's an API to send jobs to Network contacts
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test various Network Request endpoint possibilities
async function testNetworkRequestEndpoints() {
  console.log('🔍 TESTING NETWORK REQUEST/SEND API ENDPOINTS');
  console.log('=============================================\n');

  // Test Job 1609 (the one we kept)
  const testJobUuid = 'e194b965-7fe1-4194-a032-234d5a09e45b';
  console.log(`Using test job 1609 with UUID: ${testJobUuid}\n`);

  const endpoints = [
    // Network request endpoints
    { method: 'POST', endpoint: 'networkrequest.json', data: { job_uuid: testJobUuid } },
    { method: 'POST', endpoint: 'network_request.json', data: { job_uuid: testJobUuid } },
    { method: 'POST', endpoint: 'NetworkRequest.json', data: { job_uuid: testJobUuid } },

    // Send job endpoints
    { method: 'POST', endpoint: 'job_send.json', data: { job_uuid: testJobUuid } },
    { method: 'POST', endpoint: 'send_job.json', data: { job_uuid: testJobUuid } },
    { method: 'POST', endpoint: 'job_network.json', data: { job_uuid: testJobUuid } },

    // Job assignment endpoints
    { method: 'POST', endpoint: 'job_assignment.json', data: { job_uuid: testJobUuid } },
    { method: 'POST', endpoint: 'jobassignment.json', data: { job_uuid: testJobUuid } },
    { method: 'POST', endpoint: 'assignment.json', data: { job_uuid: testJobUuid } },

    // Action endpoints on the job itself
    { method: 'POST', endpoint: `job/${testJobUuid}/send.json`, data: {} },
    { method: 'POST', endpoint: `job/${testJobUuid}/network.json`, data: {} },
    { method: 'POST', endpoint: `job/${testJobUuid}/assign.json`, data: {} },
    { method: 'PUT', endpoint: `job/${testJobUuid}/network_request.json`, data: {} },

    // Queue assignment endpoints
    { method: 'GET', endpoint: 'queue.json', data: null },
    { method: 'POST', endpoint: 'queue_assignment.json', data: { job_uuid: testJobUuid } }
  ];

  const results = [];

  for (const test of endpoints) {
    console.log(`📡 Testing: ${test.method} ${test.endpoint}`);

    try {
      const options = {
        method: test.method,
        headers: getAuthHeaders()
      };

      if (test.data && test.method !== 'GET') {
        options.body = JSON.stringify(test.data);
      }

      const response = await fetch(`${SERVICEM8_API_BASE}/${test.endpoint}`, options);

      if (response.ok) {
        const data = await response.text();
        let parsedData;
        try {
          parsedData = JSON.parse(data);
          console.log(`   ✅ SUCCESS - Endpoint exists!`);
          console.log(`   📋 Response: ${JSON.stringify(parsedData).substring(0, 100)}...`);
          results.push({ endpoint: test.endpoint, method: test.method, status: 'SUCCESS', response: parsedData });
        } catch (e) {
          console.log(`   ⚠️  SUCCESS but HTML response: ${data.substring(0, 100)}`);
          results.push({ endpoint: test.endpoint, method: test.method, status: 'HTML_RESPONSE' });
        }
      } else if (response.status === 404) {
        console.log(`   ❌ NOT FOUND - Endpoint doesn't exist`);
        results.push({ endpoint: test.endpoint, method: test.method, status: 'NOT_FOUND' });
      } else if (response.status === 400) {
        const errorText = await response.text();
        console.log(`   ⚠️  BAD REQUEST - ${errorText.substring(0, 100)}`);
        results.push({ endpoint: test.endpoint, method: test.method, status: 'BAD_REQUEST' });
      } else if (response.status === 405) {
        console.log(`   🚫 METHOD NOT ALLOWED`);
        results.push({ endpoint: test.endpoint, method: test.method, status: 'METHOD_NOT_ALLOWED' });
      } else {
        console.log(`   ⚠️  ERROR ${response.status}`);
        results.push({ endpoint: test.endpoint, method: test.method, status: `ERROR_${response.status}` });
      }
    } catch (error) {
      console.log(`   💥 EXCEPTION: ${error.message}`);
      results.push({ endpoint: test.endpoint, method: test.method, status: 'EXCEPTION', error: error.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Summary
  console.log('\n\n🎯 ENDPOINT TEST SUMMARY');
  console.log('========================');

  const successful = results.filter(r => r.status === 'SUCCESS');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');
  const badRequest = results.filter(r => r.status === 'BAD_REQUEST');

  console.log(`✅ Successful endpoints: ${successful.length}`);
  console.log(`❌ Not found: ${notFound.length}`);
  console.log(`⚠️  Bad requests: ${badRequest.length}`);

  if (successful.length > 0) {
    console.log('\n✅ WORKING ENDPOINTS:');
    successful.forEach(result => {
      console.log(`   • ${result.method} ${result.endpoint}`);
      if (result.response) {
        console.log(`     Response: ${JSON.stringify(result.response).substring(0, 100)}`);
      }
    });
  }

  return results;
}

// Check if job has network-related fields
async function checkJobNetworkFields() {
  console.log('\n\n🔍 CHECKING JOB NETWORK FIELDS');
  console.log('================================\n');

  const testJobUuid = 'e194b965-7fe1-4194-a032-234d5a09e45b';

  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job/${testJobUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const job = await response.json();

      console.log('📋 Network-related fields in job:');

      const networkFields = [
        'active_network_request_uuid',
        'network_request_uuid',
        'network_status',
        'network_contact',
        'assigned_to',
        'queue_uuid',
        'queue_assigned_staff_uuid'
      ];

      networkFields.forEach(field => {
        if (field in job) {
          console.log(`   ${field}: ${job[field] || '(empty)'}`);
        }
      });

      // Check if we can update network fields
      console.log('\n🔄 Testing if we can update network fields...\n');

      const updateData = {
        active_network_request_uuid: 'test-uuid-12345'
      };

      const updateResponse = await fetch(`${SERVICEM8_API_BASE}/job/${testJobUuid}.json`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        console.log('✅ Successfully updated network field (but this might not trigger actual Network Request)');
      } else {
        const errorText = await updateResponse.text();
        console.log(`❌ Failed to update: ${errorText.substring(0, 200)}`);
      }
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  await testNetworkRequestEndpoints();
  await checkJobNetworkFields();

  console.log('\n\n📚 CONCLUSION');
  console.log('=============');
  console.log('Based on these tests, we can determine if there\'s an API');
  console.log('to send jobs to Network contacts in ServiceM8.');
}

runAllTests();