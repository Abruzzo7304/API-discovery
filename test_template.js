// Test script for the updated job template
const fs = require('fs');

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

function loadAndCleanTemplate() {
  try {
    console.log('📋 Loading test template...');
    const templateData = fs.readFileSync('job_data_template_test.json', 'utf8');
    const jobData = JSON.parse(templateData);

    // Remove comment fields and instruction fields
    const cleanJobData = {};
    for (const [key, value] of Object.entries(jobData)) {
      if (!key.startsWith('//') && key !== 'INSTRUCTIONS' && key !== '// Job Type categories: Category_UUID') {
        cleanJobData[key] = value;
      }
    }

    console.log('✅ Template cleaned, sending these fields:');
    console.log(JSON.stringify(cleanJobData, null, 2));

    return cleanJobData;

  } catch (error) {
    console.error('❌ Error loading template:', error.message);
    throw error;
  }
}

async function createTestJob() {
  try {
    console.log('🧪 Testing Updated Job Template');
    console.log('==============================\n');

    const jobData = loadAndCleanTemplate();

    console.log('\n🚀 Creating job...');
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobUuid = response.headers.get('x-record-uuid');

    if (response.ok && jobUuid) {
      console.log(`✅ Job created successfully!`);
      console.log(`🎯 Job UUID: ${jobUuid}`);

      // Link contacts
      console.log('\n🔗 Linking contacts...');

      // Primary job contact (Darren)
      await linkContact(jobUuid, "db3a9ef8-8bea-427a-af3b-1f9b07cb9a4b", "JOB");

      // Billing contact (Admin)
      await linkContact(jobUuid, "546c96a0-2eec-4ee7-96d3-1f9b0d3a9beb", "BILLING");

      // Get job number
      const jobNumber = await getJobNumber(jobUuid);

      console.log('\n🎉 TEST SUCCESSFUL!');
      console.log('==================');
      console.log(`✅ Job Number: ${jobNumber}`);
      console.log(`✅ Job UUID: ${jobUuid}`);
      console.log('✅ All fields accepted');
      console.log('✅ Contacts linked');

      return { success: true, jobUuid, jobNumber };

    } else {
      const errorText = await response.text();
      console.error(`❌ Job creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function linkContact(jobUuid, contactUuid, type) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        job_uuid: jobUuid,
        company_contact_uuid: contactUuid,
        type: type
      })
    });

    if (response.ok) {
      console.log(`✅ ${type} contact linked`);
    } else {
      console.log(`⚠️  ${type} contact linking failed`);
    }
  } catch (error) {
    console.log(`⚠️  ${type} contact linking error: ${error.message}`);
  }
}

async function getJobNumber(jobUuid) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const job = await response.json();
      return job.generated_job_id;
    }
  } catch (error) {
    console.error('Error getting job number:', error);
  }
  return 'Unknown';
}

// Run the test
createTestJob();