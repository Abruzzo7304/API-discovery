// ServiceM8 Job 1598 Attachment Check
// Test to see if we're getting job-specific attachments or all system attachments

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Function to find Job 1598 first
async function findJob1598() {
  try {
    console.log('🔍 Searching for Job 1598...');

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$filter=generated_job_id eq '1598'`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobs = await response.json();

    if (jobs.length > 0) {
      const job = jobs[0];
      console.log('✅ Found Job 1598!');
      console.log(`UUID: ${job.uuid}`);
      console.log(`Status: ${job.status}`);
      console.log(`Description: ${job.job_description || 'No description'}`);
      return job;
    } else {
      console.log('❌ Job 1598 not found');
      return null;
    }

  } catch (error) {
    console.error('❌ Error searching for Job 1598:', error);
    throw error;
  }
}

// Function to get attachment count for Job 1598
async function getJob1598AttachmentCount(jobUuid) {
  try {
    console.log('\n🔢 Getting attachment count for Job 1598...');

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?related_object_uuid=${jobUuid}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const attachments = await response.json();
      console.log(`📊 Job 1598 attachment count: ${attachments.length}`);
      return attachments.length;
    } else {
      console.log('❌ Could not get attachment count');
      return 0;
    }

  } catch (error) {
    console.error('❌ Error getting attachment count:', error);
    return 0;
  }
}

// Function to test different API calls to understand the issue
async function testAttachmentAPICalls() {
  console.log('\n🧪 Testing different attachment API calls...');

  try {
    // Test 1: Get ALL attachments (no filter)
    console.log('\n1. Testing: All attachments in system (no filter)');
    const allResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$top=5`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (allResponse.ok) {
      const allAttachments = await allResponse.json();
      console.log(`   Result: ${allAttachments.length} attachments found`);
      console.log(`   Sample related_object_uuid: ${allAttachments[0]?.related_object_uuid}`);
    }

    // Test 2: Filter by Job 1600 UUID
    console.log('\n2. Testing: Filter by Job 1600 UUID');
    const job1600Response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$filter=related_object_uuid eq '9af7ed45-351c-487d-ba31-234b20cd72fb'&$top=5`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (job1600Response.ok) {
      const job1600Attachments = await job1600Response.json();
      console.log(`   Result: ${job1600Attachments.length} attachments found for Job 1600`);
    }

    // Test 3: Filter by Job 1598 UUID (when we find it)
    const job1598 = await findJob1598();
    if (job1598) {
      console.log('\n3. Testing: Filter by Job 1598 UUID');
      const job1598Response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$filter=related_object_uuid eq '${job1598.uuid}'&$top=5`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (job1598Response.ok) {
        const job1598Attachments = await job1598Response.json();
        console.log(`   Result: ${job1598Attachments.length} attachments found for Job 1598`);
      }
    }

    // Test 4: Check what related_object_uuid values exist
    console.log('\n4. Testing: Check related_object_uuid diversity');
    const sampleResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$select=related_object_uuid&$top=10`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (sampleResponse.ok) {
      const sampleAttachments = await sampleResponse.json();
      const uniqueUuids = [...new Set(sampleAttachments.map(a => a.related_object_uuid))];
      console.log(`   Found ${uniqueUuids.length} unique related_object_uuids in first 10 records`);
      uniqueUuids.forEach(uuid => console.log(`   - ${uuid}`));
    }

  } catch (error) {
    console.error('❌ Error testing API calls:', error);
  }
}

// Main function
async function investigateAttachmentAPI() {
  console.log('🕵️ ServiceM8 Attachment API Investigation');
  console.log('=========================================');

  try {
    // First find Job 1598
    const job1598 = await findJob1598();

    if (job1598) {
      // Get its attachment count
      const attachmentCount = await getJob1598AttachmentCount(job1598.uuid);

      // Compare with Job 1600 count
      console.log('\n📊 COMPARISON:');
      console.log(`Job 1598 attachments: ${attachmentCount}`);
      console.log(`Job 1600 attachments: 20,654 (from previous check)`);

      if (attachmentCount === 20654) {
        console.log('🚨 PROBLEM DETECTED: Both jobs show same attachment count!');
        console.log('   This suggests we\'re seeing ALL system attachments, not job-specific ones.');
      } else {
        console.log('✅ Different counts - API filtering appears to be working correctly');
      }
    }

    // Run detailed API tests
    await testAttachmentAPICalls();

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

// Export for use in other scripts
module.exports = {
  findJob1598,
  getJob1598AttachmentCount,
  testAttachmentAPICalls,
  investigateAttachmentAPI
};

// Run investigation if this script is executed directly
if (require.main === module) {
  investigateAttachmentAPI();
}