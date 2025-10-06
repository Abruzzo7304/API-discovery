// Delete test jobs except 1609
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

// Delete test jobs (excluding 1609)
async function deleteTestJobs() {
  console.log('🧹 CLEANING UP TEST JOBS (EXCLUDING 1609)');
  console.log('==========================================');
  console.log('Deleting API test jobs, keeping Job 1609\n');

  // List of test jobs to delete (excluding 1609)
  const testJobs = [
    { uuid: '4e5eb6bd-86f4-4526-9aff-234d575e7d5b', number: '1604', description: 'Emergency electrical testing - API validation' },
    { uuid: '402742c0-6f50-4b88-9348-234d5db6cfab', number: '1605', description: 'Job notes testing - electrical safety check' },
    { uuid: '23b8965a-f742-4b7c-9b29-234d5af9535b', number: '1606', description: 'Job description with approval notes testing' },
    { uuid: 'f79e5390-029c-4c63-951a-234d528fe5eb', number: '1607', description: 'Complete workflow test job' },
    { uuid: '3183464a-8525-46c7-9c2f-234d5c923dbb', number: '1608', description: 'Fixed workflow test job with proper contacts' },
    { uuid: '2d489981-e341-4bcf-9bf6-234d5d55471b', number: '1610', description: 'Test job with correctly formatted badges' },
    { uuid: 'c4e0c93d-9253-4c94-85d9-234d5e7beb0b', number: '1611', description: 'Test job for Empty badges' }
  ];

  console.log(`Found ${testJobs.length} test jobs to delete:\n`);

  // Show what we're about to delete
  testJobs.forEach((job, index) => {
    console.log(`${index + 1}. Job ${job.number} - ${job.description}`);
    console.log(`   UUID: ${job.uuid}`);
  });

  console.log(`\n✅ KEEPING: Job 1609 (UUID: e194b965-7fe1-4194-a032-234d5a09e45b)`);
  console.log('\n🚨 WARNING: This will permanently delete the listed jobs!');
  console.log('Press Ctrl+C now if you want to cancel, or wait 3 seconds to proceed...\n');

  // Wait 3 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Proceeding with deletion...\n');

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
  console.log(`🛡️  Preserved: Job 1609`);

  if (failed > 0) {
    console.log('\n❌ Failed deletions:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.jobInfo} - ${result.error}`);
    });
  }

  if (successful === testJobs.length) {
    console.log('\n🎉 All specified test jobs successfully cleaned up!');
    console.log('✨ Job 1609 has been preserved as requested.');
  }

  return results;
}

// Run the cleanup
deleteTestJobs();