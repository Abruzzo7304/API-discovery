// Test script for job notes functionality
const fs = require('fs');

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

function loadTestTemplate() {
  try {
    console.log('📋 Loading job notes test template...');
    const templateData = fs.readFileSync('test_job_notes.json', 'utf8');
    const jobData = JSON.parse(templateData);

    // Remove comment fields
    const cleanJobData = {};
    for (const [key, value] of Object.entries(jobData)) {
      if (!key.startsWith('//') && key !== 'INSTRUCTIONS' && key !== '// Job Type categories: Category_UUID') {
        cleanJobData[key] = value;
      }
    }

    console.log('✅ Template loaded');
    console.log('\n📝 Job Notes Content:');
    console.log('=====================');
    console.log(cleanJobData.job_notes);
    console.log('=====================\n');

    return cleanJobData;

  } catch (error) {
    console.error('❌ Error loading template:', error.message);
    throw error;
  }
}

async function createJobWithNotes() {
  try {
    console.log('🧪 Testing Job Notes Creation');
    console.log('============================\n');

    const jobData = loadTestTemplate();

    console.log('🚀 Creating job with notes...');
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobUuid = response.headers.get('x-record-uuid');

    if (response.ok && jobUuid) {
      console.log(`✅ Job created with UUID: ${jobUuid}`);

      // Link contacts
      await linkContact(jobUuid, "db3a9ef8-8bea-427a-af3b-1f9b07cb9a4b", "JOB");
      await linkContact(jobUuid, "546c96a0-2eec-4ee7-96d3-1f9b0d3a9beb", "BILLING");

      // Get job details to verify notes
      console.log('\n🔍 Verifying job notes...');
      const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (jobResponse.ok) {
        const createdJob = await jobResponse.json();

        console.log('\n📋 Job Created Successfully!');
        console.log('===========================');
        console.log(`✅ Job Number: ${createdJob.generated_job_id}`);
        console.log(`✅ Job UUID: ${jobUuid}`);
        console.log(`✅ Status: ${createdJob.status}`);
        console.log(`✅ Address: ${createdJob.job_address}`);

        // Check if job_notes field exists in response
        if (createdJob.job_notes) {
          console.log('\n✅ JOB NOTES CONFIRMED IN RESPONSE:');
          console.log('==================================');
          console.log(createdJob.job_notes);
        } else {
          console.log('\n⚠️  job_notes field not found in response');
          console.log('Checking for alternative note fields...');

          // Check for other potential note fields
          const noteFields = ['notes', 'description', 'work_description', 'job_description'];
          for (const field of noteFields) {
            if (createdJob[field]) {
              console.log(`Found ${field}: ${createdJob[field]}`);
            }
          }
        }

        console.log('\n🎯 NOTES TEST RESULT:');
        console.log('=====================');
        console.log('✅ Job creation: SUCCESS');
        console.log(`✅ Job notes included: ${createdJob.job_notes ? 'YES' : 'CHECKING...'}`);

        return { success: true, jobUuid, jobNumber: createdJob.generated_job_id };

      } else {
        console.log('⚠️  Could not retrieve job details for verification');
      }

    } else {
      const errorText = await response.text();
      console.error(`❌ Job creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('\n💥 Notes test failed:', error.message);
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
    }
  } catch (error) {
    console.log(`⚠️  ${type} contact linking failed`);
  }
}

// Run the test
createJobWithNotes();