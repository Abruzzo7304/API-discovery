// Test if badges can be added via Job API
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test 1: Check existing job structure for badge fields
async function examineJobStructure() {
  try {
    console.log('🔍 TEST 1: Examining Job Structure for Badge Fields');
    console.log('==================================================');

    // Get a recent job to see all available fields
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$top=1&$orderby=edit_date desc`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobs = await response.json();
      if (jobs.length > 0) {
        const job = jobs[0];
        console.log('Sample job fields:');

        // Look for badge-related fields
        const badgeFields = [];
        const allFields = Object.keys(job);

        allFields.forEach(field => {
          if (field.toLowerCase().includes('badge') ||
              field.toLowerCase().includes('tag') ||
              field.toLowerCase().includes('label') ||
              field.toLowerCase().includes('flag') ||
              field.toLowerCase().includes('status') ||
              field.toLowerCase().includes('priority')) {
            badgeFields.push(`${field}: ${job[field]}`);
          }
        });

        if (badgeFields.length > 0) {
          console.log('\n🏷️  Potential badge-related fields found:');
          badgeFields.forEach(field => console.log(`   ${field}`));
        } else {
          console.log('\n❌ No obvious badge-related fields found in job structure');
        }

        console.log('\n📋 All job fields:');
        console.log(Object.keys(job).join(', '));
      }
    } else {
      console.log(`❌ Failed to get job data: ${response.status}`);
    }
  } catch (error) {
    console.error('Error examining job structure:', error.message);
  }
}

// Test 2: Look for badge-specific endpoints
async function exploreBadgeEndpoints() {
  console.log('\n\n🔍 TEST 2: Exploring Badge-Related Endpoints');
  console.log('=============================================');

  const badgeEndpoints = [
    'badge',
    'Badge',
    'jobbadge',
    'JobBadge',
    'tag',
    'Tag',
    'jobtag',
    'JobTag',
    'label',
    'Label',
    'joblabel',
    'JobLabel'
  ];

  for (const endpoint of badgeEndpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}.json?$top=1`, {
        headers: getAuthHeaders()
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS: Found ${data.length} records`);
        if (data.length > 0) {
          console.log(`  Fields: ${Object.keys(data[0]).join(', ')}`);
        }
      } else if (response.status === 404) {
        console.log(`  ❌ Not found`);
      } else {
        const error = await response.text();
        console.log(`  ⚠️  Error: ${error.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`  💥 Error: ${error.message}`);
    }
  }
}

// Test 3: Try creating a job with potential badge fields
async function testJobWithBadgeFields() {
  console.log('\n\n🔍 TEST 3: Testing Job Creation with Potential Badge Fields');
  console.log('=========================================================');

  const testJobData = {
    purchase_order_number: "ETS-BADGE-TEST-001",
    status: "Work Order",
    job_address: "123 Badge Test Street, Badge City QLD 4000",
    job_description: "Test job for badge functionality",
    category_uuid: "9b87f18b-5e5c-486f-99e5-1f4c5a3460fb", // Electrical
    job_priority: "High", // Try setting priority

    // Pre-configured ETS details
    billing_address: "223 Tweed Valley Way\nSouth Murwillumbah NSW 2484",
    company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb",
    active: 1,
    source: "Badge Test via API",

    // Try potential badge fields
    badges: "URGENT",
    badge: "HIGH_PRIORITY",
    tags: "urgent,high-priority",
    tag: "URGENT",
    job_tags: "urgent",
    labels: "HIGH_PRIORITY",
    flags: "urgent"
  };

  try {
    console.log('Attempting to create job with badge fields...');
    console.log('Job data:', JSON.stringify(testJobData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testJobData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const jobUuid = response.headers.get('x-record-uuid');
      console.log(`✅ Job created with UUID: ${jobUuid}`);

      // Verify what fields were actually saved
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const job = await verifyResponse.json();
        console.log('\n🔍 Checking which badge fields were saved:');

        const badgeTestFields = ['badges', 'badge', 'tags', 'tag', 'job_tags', 'labels', 'flags'];
        badgeTestFields.forEach(field => {
          if (job[field] !== undefined) {
            console.log(`   ✅ ${field}: ${job[field]}`);
          } else {
            console.log(`   ❌ ${field}: Not saved`);
          }
        });

        console.log(`\n📊 Job Priority: ${job.job_priority || 'Not set'}`);
        console.log(`📋 Job Status: ${job.status}`);
      }

      return { success: true, jobUuid };
    } else {
      const errorText = await response.text();
      console.log(`❌ Job creation failed: ${errorText}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('Error testing badge fields:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runBadgeTests() {
  console.log('🧪 ServiceM8 Badge Testing');
  console.log('==========================\n');

  await examineJobStructure();
  await exploreBadgeEndpoints();
  const result = await testJobWithBadgeFields();

  console.log('\n🎯 BADGE TEST SUMMARY');
  console.log('====================');
  console.log(`Job Creation: ${result.success ? 'SUCCESS' : 'FAILED'}`);

  if (result.success) {
    console.log(`Job UUID: ${result.jobUuid}`);
    console.log('Check the results above to see which badge fields worked.');
  }
}

// Run the tests
runBadgeTests();