// Delete specific jobs: 1600, 1603, 1604, 1605
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Find job UUID by job number
async function findJobByNumber(jobNumber) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?generated_job_id=${jobNumber}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobs = await response.json();
      if (jobs.length > 0) {
        return {
          uuid: jobs[0].uuid,
          purchase_order: jobs[0].purchase_order_number,
          address: jobs[0].job_address
        };
      }
    }
    return null;
  } catch (error) {
    console.log(`   💥 Error finding job ${jobNumber}: ${error.message}`);
    return null;
  }
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

// Delete the specified jobs
async function deleteSpecificJobs() {
  console.log('🗑️  DELETING SPECIFIC JOBS');
  console.log('==========================');

  const jobNumbers = ['1600', '1603', '1604', '1605'];
  console.log(`Jobs to delete: ${jobNumbers.join(', ')}\n`);

  const results = [];

  for (let i = 0; i < jobNumbers.length; i++) {
    const jobNumber = jobNumbers[i];
    console.log(`[${i + 1}/${jobNumbers.length}] Processing Job ${jobNumber}:`);

    // Find the job UUID
    console.log(`   🔍 Looking up job ${jobNumber}...`);
    const jobData = await findJobByNumber(jobNumber);

    if (!jobData) {
      console.log(`   ❌ Job ${jobNumber} not found`);
      results.push({ success: false, jobNumber, error: 'Job not found' });
      console.log('');
      continue;
    }

    console.log(`   📋 Found: ${jobData.purchase_order || 'No PO'}`);
    console.log(`   📍 Address: ${jobData.address || 'No address'}`);
    console.log(`   🆔 UUID: ${jobData.uuid}`);

    // Delete the job
    const result = await deleteJob(jobData.uuid, `Job ${jobNumber}`);
    results.push({ ...result, jobNumber });
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

  if (failed > 0) {
    console.log('\n❌ Failed deletions:');
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`${index + 1}. Job ${result.jobNumber} - ${result.error}`);
    });
  }

  if (successful === jobNumbers.length) {
    console.log('\n🎉 All requested jobs successfully deleted!');
  }

  return results;
}

// Run the deletion
deleteSpecificJobs();