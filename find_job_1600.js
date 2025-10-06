// ServiceM8 Job Search - Find Job 1600
// Read-only operation to locate test job

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Function to search for job 1600
async function findJob1600() {
  try {
    console.log('🔍 Searching for Job 1600...');

    // Search by generated_job_id
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$filter=generated_job_id eq '1600'`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobs = await response.json();

    if (jobs.length > 0) {
      const job = jobs[0];
      console.log('✅ Found Job 1600!');
      console.log('\n📋 JOB DETAILS:');
      console.log('===============');
      console.log(`Job Number: ${job.generated_job_id}`);
      console.log(`UUID: ${job.uuid}`);
      console.log(`Status: ${job.status}`);
      console.log(`Date: ${job.date}`);
      console.log(`Address: ${job.job_address || 'No address'}`);
      console.log(`Description: ${job.job_description || 'No description'}`);
      console.log(`Edit Date: ${job.edit_date}`);
      console.log(`Active: ${job.active}`);

      return job;
    } else {
      console.log('❌ Job 1600 not found');

      // Try alternative search patterns
      console.log('\n🔍 Trying alternative search patterns...');

      // Search for jobs containing "1600" in description or other fields
      const altResponse = await fetch(`${SERVICEM8_API_BASE}/job.json?$filter=contains(job_description,'1600') or contains(job_address,'1600')&$top=10`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (altResponse.ok) {
        const altJobs = await altResponse.json();
        if (altJobs.length > 0) {
          console.log(`\n📋 Found ${altJobs.length} jobs containing "1600":`);
          altJobs.forEach(job => {
            console.log(`- Job ${job.generated_job_id}: ${job.job_description?.substring(0, 80)}...`);
          });
        }
      }

      return null;
    }

  } catch (error) {
    console.error('❌ Error searching for Job 1600:', error);
    throw error;
  }
}

// Function to check if job 1600 has any attachments
async function checkJob1600Attachments(jobUuid) {
  try {
    console.log('\n🔗 Checking for attachments on Job 1600...');

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?related_object_uuid=${jobUuid}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const attachments = await response.json();
      console.log(`📎 Found ${attachments.length} attachments on Job 1600`);

      if (attachments.length > 0) {
        console.log('\n📋 ATTACHMENTS:');
        attachments.forEach((attachment, index) => {
          console.log(`${index + 1}. ${attachment.attachment_name} (${attachment.file_type})`);
          console.log(`   Size: ${attachment.file_size || 'Unknown'} bytes`);
          console.log(`   Created: ${attachment.edit_date}`);
          console.log(`   Active: ${attachment.active}`);
        });
      }

      return attachments;
    } else {
      console.log('❌ Could not check attachments');
      return [];
    }

  } catch (error) {
    console.error('❌ Error checking attachments:', error);
    return [];
  }
}

// Main function
async function searchJob1600() {
  console.log('🎯 ServiceM8 Job 1600 Search');
  console.log('============================');

  try {
    const job = await findJob1600();

    if (job) {
      // Check for attachments
      await checkJob1600Attachments(job.uuid);

      console.log('\n✅ Job 1600 search complete!');
      console.log(`   UUID for testing: ${job.uuid}`);
    } else {
      console.log('\n❌ Job 1600 not found in your ServiceM8 system');
    }

  } catch (error) {
    console.error('❌ Search failed:', error);
  }
}

// Export for use in other scripts
module.exports = {
  findJob1600,
  checkJob1600Attachments,
  searchJob1600
};

// Run search if this script is executed directly
if (require.main === module) {
  searchJob1600();
}