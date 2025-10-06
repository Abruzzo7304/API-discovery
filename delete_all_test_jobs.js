// Delete all test jobs from ServiceM8
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

// Delete all identified test jobs
async function deleteTestJobs() {
  console.log('🧹 DELETING ALL TEST JOBS');
  console.log('=========================');
  console.log('Deleting all test jobs from recent API testing\n');

  // List of test jobs to delete (excluding 1609 which we're keeping)
  const testJobs = [
    // Test jobs that contain "test" in address or purchase order
    { uuid: '4e5eb6bd-86f4-4526-9aff-234d575e7d5b', number: '1604', description: 'Emergency electrical testing - API validation' },
    { uuid: '402742c0-6f50-4b88-9348-234d5db6cfab', number: '1605', description: 'Job notes testing' },
    { uuid: '23b8965a-f742-4b7c-9b29-234d5af9535b', number: '1606', description: 'Job description with approval notes testing' },
    { uuid: 'f79e5390-029c-4c63-951a-234d528fe5eb', number: '1607', description: 'Complete workflow test job' },
    { uuid: '3183464a-8525-46c7-9c2f-234d5c923dbb', number: '1608', description: 'Fixed workflow test job' },
    { uuid: '2d489981-e341-4bcf-9bf6-234d5d55471b', number: '1610', description: 'Badge test job' },
    { uuid: 'c4e0c93d-9253-4c94-85d9-234d5e7beb0b', number: '1611', description: 'Empty badges test' },
    { uuid: 'a82cfd16-0835-4963-a0b1-234e5aa1656b', number: '1614', description: 'Multi-contact test job' },
    { uuid: '9e710b9f-7ff3-45f2-93da-234e5d1b4e6b', number: '1615', description: 'Multi-contact test job' },
    { uuid: '3c05dbad-2e8c-419c-b4e6-234e5aa41f0b', number: '1616', description: 'Multi-contact test job' },
    { uuid: '8d441f2e-230e-4fd7-aa44-234e536801bb', number: '1617', description: 'Multi-contact test job' },
    { uuid: '812a55e8-6b2b-443c-9593-234e5d389dcb', number: '1618', description: 'Multi-contact test job' },
    { uuid: '01dcb571-b07c-4ffd-b625-234e5ee94e5b', number: '1619', description: 'Multi-contact test job' },
    { uuid: '5a47e3a1-3b30-479f-95f1-234e566d7d1b', number: '1621', description: 'Critical emergency test' },
    { uuid: '35db7add-5d6a-4f73-a33f-234e558685eb', number: '1622', description: 'Critical test job' }
  ];

  console.log(`Found ${testJobs.length} test jobs to delete:\n`);

  // Show what we're about to delete
  testJobs.forEach((job, index) => {
    console.log(`${index + 1}. Job ${job.number} - ${job.description}`);
  });

  console.log(`\n✅ KEEPING: Job 1609 (as previously requested)`);
  console.log('❓ Job 1603 (Latrobe Street) - Not marked as test, skipping\n');

  console.log('🚨 Starting deletion in 3 seconds...\n');

  // Wait 3 seconds
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
  console.log('🎯 DELETION SUMMARY');
  console.log('===================');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successfully deleted: ${successful} jobs`);
  console.log(`❌ Failed to delete: ${failed} jobs`);
  console.log(`📊 Total processed: ${results.length} jobs`);
  console.log(`🛡️  Preserved: Job 1609, Job 1603`);

  if (failed > 0) {
    console.log('\n❌ Failed deletions:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`${index + 1}. ${result.jobInfo} - ${result.error}`);
    });
  }

  if (successful === testJobs.length) {
    console.log('\n🎉 All test jobs successfully deleted!');
    console.log('✨ Your ServiceM8 is now clean of test data.');
  }

  return results;
}

// Run the cleanup
deleteTestJobs();