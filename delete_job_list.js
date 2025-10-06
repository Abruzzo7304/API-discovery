// Delete multiple jobs from a provided list
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Delete a single job by UUID
async function deleteJob(jobUuid, jobInfo = '') {
  try {
    console.log(`🗑️  Deleting job: ${jobInfo || jobUuid}`);

    const response = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      console.log(`   ✅ Successfully deleted`);
      return { success: true, jobUuid, jobInfo };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed to delete: ${response.status} - ${errorText.substring(0, 100)}...`);
      return { success: false, jobUuid, jobInfo, error: `${response.status} - ${errorText}` };
    }

  } catch (error) {
    console.log(`   💥 Error deleting: ${error.message}`);
    return { success: false, jobUuid, jobInfo, error: error.message };
  }
}

// Find job UUID by job number if needed
async function findJobByNumber(jobNumber) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?generated_job_id=${jobNumber}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobs = await response.json();
      if (jobs.length > 0) {
        return jobs[0].uuid;
      }
    }
    return null;
  } catch (error) {
    console.log(`   💥 Error finding job ${jobNumber}: ${error.message}`);
    return null;
  }
}

// Main deletion function
async function deleteJobList(jobList) {
  console.log('🗑️  SERVICEM8 JOB DELETION');
  console.log('==========================');
  console.log(`📋 Jobs to delete: ${jobList.length}`);
  console.log('');

  const results = [];

  for (let i = 0; i < jobList.length; i++) {
    const jobItem = jobList[i];
    console.log(`[${i + 1}/${jobList.length}] Processing: ${jobItem.description || jobItem.uuid || jobItem.jobNumber || jobItem}`);

    let jobUuid = null;
    let jobInfo = '';

    // Handle different input formats
    if (typeof jobItem === 'string') {
      if (jobItem.includes('-')) {
        // Looks like a UUID
        jobUuid = jobItem;
        jobInfo = jobItem;
      } else {
        // Looks like a job number
        console.log(`   🔍 Looking up job number ${jobItem}...`);
        jobUuid = await findJobByNumber(jobItem);
        jobInfo = `Job ${jobItem}`;
        if (!jobUuid) {
          console.log(`   ❌ Job number ${jobItem} not found`);
          results.push({ success: false, jobNumber: jobItem, error: 'Job not found' });
          continue;
        }
      }
    } else if (jobItem.uuid) {
      jobUuid = jobItem.uuid;
      jobInfo = jobItem.description || `Job ${jobItem.jobNumber || 'Unknown'}`;
    } else if (jobItem.jobNumber) {
      console.log(`   🔍 Looking up job number ${jobItem.jobNumber}...`);
      jobUuid = await findJobByNumber(jobItem.jobNumber);
      jobInfo = `Job ${jobItem.jobNumber}`;
      if (!jobUuid) {
        console.log(`   ❌ Job number ${jobItem.jobNumber} not found`);
        results.push({ success: false, jobNumber: jobItem.jobNumber, error: 'Job not found' });
        continue;
      }
    }

    if (jobUuid) {
      const result = await deleteJob(jobUuid, jobInfo);
      results.push(result);
    }

    console.log(''); // Add spacing between jobs
  }

  // Summary
  console.log('🎯 DELETION SUMMARY');
  console.log('===================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successfully deleted: ${successful}`);
  console.log(`❌ Failed to delete: ${failed}`);
  console.log(`📊 Total processed: ${results.length}`);

  if (failed > 0) {
    console.log('\\nFailed deletions:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.jobInfo || result.jobUuid || result.jobNumber} - ${result.error}`);
    });
  }

  return results;
}

// EXAMPLE USAGE - Replace this list with your jobs to delete
const jobsToDelete = [
  // You can use any of these formats:

  // Format 1: Simple UUID strings
  // 'f79e5390-029c-4c63-951a-234d528fe5eb',

  // Format 2: Simple job numbers
  // '1607',
  // '1610',

  // Format 3: Objects with details
  // { uuid: 'f79e5390-029c-4c63-951a-234d528fe5eb', description: 'Test workflow job' },
  // { jobNumber: '1607', description: 'Badge test job' },

  // Add your jobs here:

];

// Uncomment the line below and add your jobs to the array above, then run the script
// deleteJobList(jobsToDelete);

console.log('📝 INSTRUCTIONS:');
console.log('================');
console.log('1. Edit this file and add the jobs you want to delete to the jobsToDelete array');
console.log('2. You can provide:');
console.log('   - Job UUIDs: "f79e5390-029c-4c63-951a-234d528fe5eb"');
console.log('   - Job numbers: "1607"');
console.log('   - Objects: { jobNumber: "1607", description: "My test job" }');
console.log('3. Uncomment the last line: deleteJobList(jobsToDelete);');
console.log('4. Run the script again');
console.log('\\nExample:');
console.log('const jobsToDelete = ["1607", "1608", "1610"];');