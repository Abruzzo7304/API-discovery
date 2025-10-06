// Verify jobs before deletion
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Find job by number and get details
async function findJobDetails(jobNumber) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?generated_job_id=${jobNumber}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobs = await response.json();
      if (jobs.length > 0) {
        return jobs[0];
      }
    }
    return null;
  } catch (error) {
    console.log(`   💥 Error finding job ${jobNumber}: ${error.message}`);
    return null;
  }
}

// Verify all jobs before deletion
async function verifyJobsBeforeDeletion() {
  console.log('🔍 VERIFYING JOBS BEFORE DELETION');
  console.log('==================================\n');

  const jobNumbers = ['1614', '1615', '1616', '1617', '1618', '1619', '1603', '1600'];
  console.log(`Jobs to verify: ${jobNumbers.join(', ')}\n`);

  const foundJobs = [];

  for (const jobNumber of jobNumbers) {
    console.log(`📋 Job ${jobNumber}:`);

    const job = await findJobDetails(jobNumber);

    if (job) {
      console.log(`   ✅ Found`);
      console.log(`   UUID: ${job.uuid}`);
      console.log(`   Purchase Order: ${job.purchase_order_number || 'None'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Address: ${job.job_address || 'No address'}`);
      console.log(`   Company UUID: ${job.company_uuid}`);
      console.log(`   Company: ${job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb' ? '✅ Emergency Trade Services' : '❌ Other company'}`);
      console.log(`   Created: ${job.date}`);
      console.log(`   Active: ${job.active}`);

      // Show first part of description
      if (job.job_description) {
        console.log(`   Description: ${job.job_description.substring(0, 100)}...`);
      }

      foundJobs.push({
        jobNumber,
        uuid: job.uuid,
        purchaseOrder: job.purchase_order_number,
        address: job.job_address,
        company: job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb' ? 'ETS' : 'Other',
        status: job.status,
        active: job.active
      });
    } else {
      console.log(`   ❌ Not found`);
    }

    console.log('');
  }

  // Summary
  console.log('📊 SUMMARY FOR DELETION');
  console.log('=======================');
  console.log(`Total jobs found: ${foundJobs.length} out of ${jobNumbers.length}\n`);

  const etsJobs = foundJobs.filter(j => j.company === 'ETS');
  const otherJobs = foundJobs.filter(j => j.company !== 'ETS');

  if (etsJobs.length > 0) {
    console.log('✅ ETS Jobs (Emergency Trade Services):');
    etsJobs.forEach(job => {
      console.log(`   Job ${job.jobNumber}: ${job.address || 'No address'}`);
      console.log(`      PO: ${job.purchaseOrder || 'None'}, Status: ${job.status}`);
    });
    console.log('');
  }

  if (otherJobs.length > 0) {
    console.log('⚠️  Non-ETS Jobs:');
    otherJobs.forEach(job => {
      console.log(`   Job ${job.jobNumber}: ${job.address || 'No address'}`);
      console.log(`      Status: ${job.status}`);
    });
    console.log('');
  }

  // Special check for Job 1600
  const job1600 = foundJobs.find(j => j.jobNumber === '1600');
  if (job1600) {
    console.log('🔍 Job 1600 Special Check:');
    console.log(`   Address: ${job1600.address}`);
    console.log(`   Is "Test Address"?: ${job1600.address && job1600.address.includes('Test Address') ? '✅ YES' : '❌ NO'}`);
    console.log('');
  }

  console.log('⚠️  PLEASE CONFIRM:');
  console.log('===================');
  console.log('Are these the correct jobs to delete?');
  console.log('Type "yes" to proceed with deletion or "no" to cancel.');

  return foundJobs;
}

// Run verification
verifyJobsBeforeDeletion();