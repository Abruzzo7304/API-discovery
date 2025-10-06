// ServiceM8 Create Job API Test
// Tests job creation with realistic data from your CSV

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Comprehensive job creation test with realistic data
async function createTestJob() {
  const jobData = {
    // Core required fields
    status: "Work Order",
    job_address: "123 Test Street, Brisbane QLD 4000",
    job_description: "API Test - Electrical Installation and Maintenance",

    // Contact information
    contact_first: "John",
    contact_last: "Smith",
    contact_phone: "0412345678",
    contact_email: "john.smith@example.com",

    // Job details based on your CSV data
    job_number: `TEST-${Date.now()}`, // Unique test job number
    job_priority: "Normal",
    generated_job_id: Date.now(),

    // Scheduling
    date_created: new Date().toISOString().split('T')[0] + ' 00:00:00',

    // Additional fields often used
    active: 1,

    // Custom fields that might be relevant
    job_notes: "This is a test job created via API for testing purposes. Safe to delete.",

    // Location details
    job_location_name: "Test Location",

    // Billing information
    billing_address: "123 Test Street, Brisbane QLD 4000",

    // Work type classification
    category_uuid: null, // Will be set by ServiceM8 if not provided

    // Additional metadata
    source: "API Test",

    // Company/customer details
    company_name: "Test Company Pty Ltd"
  };

  try {
    console.log('🧪 ServiceM8 Job Creation Test');
    console.log('===============================');
    console.log('📋 Creating new job with test data...\n');

    console.log('Job Data:', JSON.stringify(jobData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    console.log(`\n📡 Response Status: ${response.status}`);
    console.log('📡 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    const jobUuid = response.headers.get('x-record-uuid');

    if (response.ok && jobUuid) {
      console.log(`\n✅ Job created successfully!`);
      console.log(`🎯 Job UUID: ${jobUuid}`);

      // Fetch the created job to verify all fields
      console.log('\n🔍 Fetching created job to verify...');
      const getResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (getResponse.ok) {
        const createdJob = await getResponse.json();
        console.log('\n✅ Job verification successful!');
        console.log('📋 Created job details:');
        console.log(JSON.stringify(createdJob, null, 2));

        // Check which fields were set vs defaults
        console.log('\n📊 Field Analysis:');
        Object.keys(jobData).forEach(key => {
          const provided = jobData[key];
          const actual = createdJob[key];
          if (provided !== actual) {
            console.log(`   ${key}: Provided "${provided}" → Actual "${actual}"`);
          } else {
            console.log(`   ${key}: ✓ Set as provided`);
          }
        });

        return {
          success: true,
          uuid: jobUuid,
          job: createdJob
        };
      }
    } else {
      const errorText = await response.text();
      console.error(`\n❌ Job creation failed:`);
      console.error(`Status: ${response.status}`);
      console.error(`Response: ${errorText}`);

      return {
        success: false,
        error: errorText,
        status: response.status
      };
    }

  } catch (error) {
    console.error('\n💥 Error during job creation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test different job types and statuses
async function testJobVariations() {
  console.log('\n🧪 Testing Job Status Variations');
  console.log('=================================');

  const variations = [
    { status: "Quote", description: "Quote for electrical work" },
    { status: "Work Order", description: "Scheduled electrical maintenance" },
    { status: "Job", description: "Active electrical job" }
  ];

  for (const variation of variations) {
    console.log(`\n📋 Testing ${variation.status} status...`);

    const testData = {
      status: variation.status,
      job_address: "456 Variation Test St, Brisbane QLD 4000",
      job_description: variation.description,
      contact_first: "Test",
      contact_last: "User",
      job_number: `VAR-${variation.status}-${Date.now()}`
    };

    try {
      const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testData)
      });

      const uuid = response.headers.get('x-record-uuid');

      if (response.ok && uuid) {
        console.log(`   ✅ ${variation.status} job created: ${uuid}`);
      } else {
        const error = await response.text();
        console.log(`   ❌ ${variation.status} failed: ${error}`);
      }

    } catch (error) {
      console.log(`   💥 ${variation.status} error: ${error.message}`);
    }
  }
}

// Main test runner
async function main() {
  console.log('🚀 ServiceM8 Job Creation API Test Suite');
  console.log('========================================\n');

  try {
    // Test 1: Create comprehensive test job
    const result = await createTestJob();

    if (result.success) {
      console.log('\n🎉 PRIMARY TEST PASSED!');

      // Test 2: Try variations
      await testJobVariations();

      console.log('\n🎯 TESTING COMPLETE!');
      console.log('==================');
      console.log('✅ All tests completed');
      console.log('📝 Check ServiceM8 interface to verify jobs were created');
      console.log('🗑️  Remember to delete test jobs after verification');

    } else {
      console.log('\n❌ PRIMARY TEST FAILED!');
      console.log('Please check your credentials and API access');
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Export for use in other scripts
module.exports = {
  createTestJob,
  testJobVariations
};

// Run tests if called directly
if (require.main === module) {
  main();
}