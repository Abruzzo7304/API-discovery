// ServiceM8 Network Contact Discovery Script
// Testing for network-related API endpoints

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Test potential network-related endpoints
async function testNetworkEndpoints() {
  console.log('🔍 Testing potential network-related API endpoints...\n');

  const potentialEndpoints = [
    'NetworkRequest',
    'networkrequest',
    'network_request',
    'NetworkContact',
    'networkcontact',
    'network_contact',
    'SubContractor',
    'subcontractor',
    'sub_contractor',
    'ExternalContact',
    'externalcontact',
    'external_contact',
    'JobAssignment',
    'jobassignment',
    'job_assignment',
    'Assignment',
    'assignment',
    'JobNetwork',
    'jobnetwork',
    'job_network',
    'Partner',
    'partner',
    'Vendor',
    'vendor',
    'Supplier',
    'supplier'
  ];

  for (const endpoint of potentialEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}.json?$top=1`, {
        headers: getAuthHeaders()
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS: Found ${data.length} records`);
        if (data.length > 0) {
          console.log(`  📋 Fields: ${Object.keys(data[0]).join(', ')}`);
          console.log(`  📄 Sample record:`, JSON.stringify(data[0], null, 4));
        }
      } else if (response.status === 404) {
        console.log(`  ❌ Not found`);
      } else {
        const error = await response.text();
        console.log(`  ⚠️  Error: ${error.substring(0, 100)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`  💥 Error: ${error.message}\n`);
    }
  }
}

// Test if we can find jobs with active network requests
async function testActiveNetworkRequests() {
  console.log('\n🔍 Testing jobs with active network requests...\n');

  try {
    // Look for jobs with non-empty active_network_request_uuid
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$filter=active_network_request_uuid ne ''&$top=10`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobs = await response.json();
      console.log(`Found ${jobs.length} jobs with active network requests:`);

      jobs.forEach((job, index) => {
        console.log(`\n${index + 1}. Job ${job.generated_job_id} (${job.uuid})`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Network Request UUID: ${job.active_network_request_uuid}`);
        console.log(`   Description: ${job.job_description?.substring(0, 100)}...`);
      });
    } else {
      console.log(`❌ Failed to query jobs: ${response.status}`);
    }
  } catch (error) {
    console.error('Error testing active network requests:', error);
  }
}

// Test related endpoints that might give clues
async function testRelatedEndpoints() {
  console.log('\n🔍 Testing related endpoints for clues...\n');

  const relatedEndpoints = [
    'company',
    'companycontact',
    'staff',
    'queue',
    'workgroup',
    'team',
    'category'
  ];

  for (const endpoint of relatedEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}.json?$top=3`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Found ${data.length} records`);

        if (data.length > 0) {
          const fields = Object.keys(data[0]);
          const networkFields = fields.filter(field =>
            field.toLowerCase().includes('network') ||
            field.toLowerCase().includes('external') ||
            field.toLowerCase().includes('subcontract') ||
            field.toLowerCase().includes('assign')
          );

          if (networkFields.length > 0) {
            console.log(`  🎯 Network-related fields: ${networkFields.join(', ')}`);
          }
        }
      } else {
        console.log(`  ❌ Status: ${response.status}`);
      }
      console.log('');
    } catch (error) {
      console.log(`  💥 Error: ${error.message}\n`);
    }
  }
}

async function main() {
  console.log('ServiceM8 Network Contact API Discovery');
  console.log('=====================================\n');

  await testNetworkEndpoints();
  await testActiveNetworkRequests();
  await testRelatedEndpoints();

  console.log('\n🏁 Discovery complete!');
}

// Run the discovery
main().catch(console.error);