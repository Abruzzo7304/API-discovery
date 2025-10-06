// ServiceM8 Delete Test Jobs Script
// Deletes the three specific test jobs created by create_job_test.js

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// The three test job UUIDs to delete
const TEST_JOB_UUIDS = [
  '49c4a9a2-83e1-4600-9eb0-234c544f0deb', // Main test job
  '77987115-cd80-4aac-89cd-234c53d7980b', // Quote test
  '1f154add-6ae6-45c8-963e-234c5d712b7b'  // Work Order test
];

async function deleteJob(uuid) {
  try {
    console.log(`🗑️  Deleting job: ${uuid}`);

    const response = await fetch(`${SERVICEM8_API_BASE}/job/${uuid}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      console.log(`   ✅ Successfully deleted job ${uuid}`);
      return { success: true, uuid };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed to delete job ${uuid}: ${response.status} - ${errorText}`);
      return { success: false, uuid, error: errorText, status: response.status };
    }

  } catch (error) {
    console.log(`   💥 Error deleting job ${uuid}: ${error.message}`);
    return { success: false, uuid, error: error.message };
  }
}

async function deleteAllTestJobs() {
  console.log('🧹 ServiceM8 Test Job Cleanup');
  console.log('=============================');
  console.log(`📋 Deleting ${TEST_JOB_UUIDS.length} test jobs...\n`);

  const results = [];

  for (const uuid of TEST_JOB_UUIDS) {
    const result = await deleteJob(uuid);
    results.push(result);
  }

  console.log('\n📊 Cleanup Summary:');
  console.log('==================');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully deleted: ${successful.length} jobs`);
  if (successful.length > 0) {
    successful.forEach(job => console.log(`   - ${job.uuid}`));
  }

  if (failed.length > 0) {
    console.log(`❌ Failed to delete: ${failed.length} jobs`);
    failed.forEach(job => console.log(`   - ${job.uuid}: ${job.error}`));
  }

  console.log('\n🎯 Cleanup Complete!');
  return results;
}

// Run cleanup if called directly
if (require.main === module) {
  deleteAllTestJobs();
}

module.exports = {
  deleteJob,
  deleteAllTestJobs,
  TEST_JOB_UUIDS
};