// Test if job_priority accepts 'Critical' value
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test creating job with Critical priority
async function testCriticalPriority() {
  console.log('🚨 TESTING CRITICAL PRIORITY JOB CREATION');
  console.log('==========================================\n');

  const criticalJobData = {
    company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb',
    purchase_order_number: 'ETS-CRITICAL-TEST-001',
    status: 'Work Order',

    // Client and Site info
    job_address: '456 Emergency Hospital Road, Brisbane QLD 4000',
    job_location_name: 'Brisbane General Hospital - Emergency Wing',

    // Job details with critical description
    job_description: `CRITICAL EMERGENCY - Power failure in emergency ward

Site Contact: John Emergency
Contact Phone: 0411 111 111
Site: Hospital Emergency Wing

CRITICAL: Complete power failure affecting life support systems
Required: Immediate response - 24x7 emergency callout

Approved up to: Emergency rates apply`,

    category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical

    // Test Critical priority
    job_priority: 'Critical',

    // Assign to TEE New Job queue for critical work
    queue_uuid: '3a8029ef-b239-4c2e-a18f-215f7964552b',

    badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
    active: 1
  };

  console.log('📝 Testing with job_priority: "Critical"');
  console.log('📋 Queue: TEE New Job (Critical queue)\n');

  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(criticalJobData)
    });

    const responseText = await response.text();

    // Check if we got HTML (error) or JSON (success)
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.log('⚠️  HTML response received - checking error message:\n');
      console.log(responseText);

      // Try again with 'High' priority
      console.log('\n🔄 RETRYING with job_priority: "High" (standard value)\n');

      criticalJobData.job_priority = 'High';
      criticalJobData.job_description = `CRITICAL EMERGENCY - Power failure in emergency ward
*** PRIORITY: CRITICAL - 24x7 EMERGENCY RESPONSE ***

Site Contact: John Emergency
Contact Phone: 0411 111 111
Site: Hospital Emergency Wing

CRITICAL: Complete power failure affecting life support systems
Required: Immediate response - 24x7 emergency callout

Approved up to: Emergency rates apply`;

      const retryResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(criticalJobData)
      });

      const retryText = await retryResponse.text();

      if (retryText.startsWith('<!DOCTYPE') || retryText.startsWith('<html')) {
        // Check if job was created anyway
        const checkResponse = await fetch(
          `${SERVICEM8_API_BASE}/job.json?company_uuid=971d644f-d6a8-479c-a901-1f9b0425d7bb&$orderby=date desc&$top=1`,
          { headers: getAuthHeaders() }
        );

        if (checkResponse.ok) {
          const jobs = await checkResponse.json();
          if (jobs.length > 0 && jobs[0].purchase_order_number === 'ETS-CRITICAL-TEST-001') {
            console.log('✅ Job created successfully despite HTML response!');
            console.log(`   Job Number: ${jobs[0].generated_job_id}`);
            console.log(`   Priority: ${jobs[0].job_priority}`);
            console.log(`   Queue: ${jobs[0].queue_uuid ? 'Assigned to TEE New Job' : 'No queue'}`);
          }
        }
      } else {
        const job = JSON.parse(retryText);
        console.log('✅ SUCCESS - Job created with High priority');
        console.log(`   Job Number: ${job.generated_job_id}`);
        console.log(`   UUID: ${job.uuid}`);
        console.log(`   Priority: ${job.job_priority}`);
        console.log(`   Queue: Assigned to TEE New Job (Critical queue)`);
      }

    } else {
      const job = JSON.parse(responseText);
      console.log('✅ SUCCESS - Job created with Critical priority!');
      console.log(`   Job Number: ${job.generated_job_id}`);
      console.log(`   UUID: ${job.uuid}`);
      console.log(`   Priority: ${job.job_priority}`);
      console.log(`   Queue: Assigned to TEE New Job (Critical queue)`);
    }

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }

  console.log('\n📊 PRIORITY FIELD ANALYSIS');
  console.log('==========================');
  console.log('Standard values: High, Normal, Low');
  console.log('Custom values: Testing if "Critical" is accepted');
  console.log('\nRECOMMENDATION:');
  console.log('• If "Critical" works: Use it directly');
  console.log('• If not: Use "High" + TEE New Job queue');
  console.log('• Mark as CRITICAL in job description for visibility');
}

// Run test
testCriticalPriority();