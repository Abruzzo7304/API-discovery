// Clean up all test jobs created during API testing
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
    console.log(`🗑️  Deleting: ${jobInfo}`);

    const response = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      console.log(`   ✅ Successfully deleted`);
      return { success: true, jobUuid, jobInfo };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${response.status}`);
      return { success: false, jobUuid, jobInfo, error: `${response.status}` };
    }

  } catch (error) {
    console.log(`   💥 Error: ${error.message}`);
    return { success: false, jobUuid, jobInfo, error: error.message };
  }
}

// Clean up all test jobs
async function cleanUpTestJobs() {
  console.log('🧹 CLEANING UP TEST JOBS');
  console.log('========================');
  console.log('Deleting all jobs created during API testing sessions\\n');

  // List of all test jobs created during our testing
  const testJobs = [
    // Job 1606 - Original test with notes
    { uuid: '23b8965a-f742-4b7c-9b29-234d5af9535b', number: '1606', description: 'Job with notes testing' },

    // Job 1607 - Complete workflow test
    { uuid: 'f79e5390-029c-4c63-951a-234d528fe5eb', number: '1607', description: 'Complete workflow test' },

    // Job 1608 - Fixed workflow test (with ETS badge)
    { uuid: '3183464a-8525-46c7-9c2f-234d5c923dbb', number: '1608', description: 'Fixed workflow test with ETS badge' },

    // Job 1610 - Badge test with Warranty and VIP badges
    { uuid: '2d489981-e341-4bcf-9bf6-234d5d55471b', number: '1610', description: 'Badge test (Warranty + VIP)' },

    // Job 1611 - Empty badges test
    { uuid: 'c4e0c93d-9253-4c94-85d9-234d5e7beb0b', number: '1611', description: 'Empty badges test' }
  ];

  console.log(`Found ${testJobs.length} test jobs to delete:\\n`);

  // Show what we're about to delete
  testJobs.forEach((job, index) => {
    console.log(`${index + 1}. Job ${job.number} - ${job.description}`);
    console.log(`   UUID: ${job.uuid}`);
  });

  console.log('\\n🚨 WARNING: This will permanently delete these jobs!');
  console.log('Press Ctrl+C now if you want to cancel, or wait 3 seconds to proceed...\\n');

  // Wait 3 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Proceeding with deletion...\\n');

  const results = [];

  for (let i = 0; i < testJobs.length; i++) {
    const job = testJobs[i];
    console.log(`[${i + 1}/${testJobs.length}]`);

    const result = await deleteJob(job.uuid, `Job ${job.number} - ${job.description}`);
    results.push(result);
    console.log('');
  }

  // Summary
  console.log('🎯 CLEANUP SUMMARY');
  console.log('==================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successfully deleted: ${successful} jobs`);
  console.log(`❌ Failed to delete: ${failed} jobs`);
  console.log(`📊 Total processed: ${results.length} jobs`);

  if (failed > 0) {
    console.log('\\n❌ Failed deletions:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.jobInfo} - ${result.error}`);
    });
  }

  if (successful === testJobs.length) {
    console.log('\\n🎉 All test jobs successfully cleaned up!');
    console.log('✨ Your ServiceM8 system is now clean of API test data.');
  }

  return results;
}

// Run the cleanup
cleanUpTestJobs();