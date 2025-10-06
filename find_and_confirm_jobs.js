// Find and confirm jobs before deletion
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Find jobs with detailed information
async function findJobsWithDetails(jobNumbers) {
  console.log('🔍 FINDING JOBS WITH DETAILS');
  console.log('============================');
  console.log(`Looking for jobs: ${jobNumbers.join(', ')}\n`);

  const foundJobs = [];

  for (const jobNumber of jobNumbers) {
    console.log(`🔍 Searching for Job ${jobNumber}:`);

    try {
      // Search by generated_job_id
      const response = await fetch(`${SERVICEM8_API_BASE}/job.json?generated_job_id=${jobNumber}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const jobs = await response.json();

        if (jobs.length > 0) {
          const job = jobs[0];
          console.log(`   ✅ Found Job ${jobNumber}:`);
          console.log(`      UUID: ${job.uuid}`);
          console.log(`      Purchase Order: ${job.purchase_order_number || 'None'}`);
          console.log(`      Status: ${job.status}`);
          console.log(`      Address: ${job.job_address || 'No address'}`);
          console.log(`      Description: ${job.job_description ? job.job_description.substring(0, 100) + '...' : 'No description'}`);
          console.log(`      Company UUID: ${job.company_uuid}`);
          console.log(`      Created: ${job.date}`);
          console.log(`      Source: ${job.source || 'Unknown'}`);

          foundJobs.push({
            jobNumber,
            uuid: job.uuid,
            purchaseOrder: job.purchase_order_number,
            status: job.status,
            address: job.job_address,
            description: job.job_description,
            companyUuid: job.company_uuid,
            source: job.source,
            created: job.date
          });
        } else {
          console.log(`   ❌ Job ${jobNumber} not found`);
        }
      } else {
        console.log(`   ❌ Error searching for Job ${jobNumber}: ${response.status}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }

    console.log('');
  }

  return foundJobs;
}

// Show jobs and ask for confirmation
async function findAndShowJobs() {
  const jobNumbers = ['1606', '1607', '1608', '1610', '1611'];

  const foundJobs = await findJobsWithDetails(jobNumbers);

  console.log('📋 SEARCH RESULTS SUMMARY');
  console.log('=========================');
  console.log(`Found ${foundJobs.length} out of ${jobNumbers.length} requested jobs\n`);

  if (foundJobs.length > 0) {
    foundJobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ${job.jobNumber}:`);
      console.log(`   Purchase Order: ${job.purchaseOrder || 'None'}`);
      console.log(`   Address: ${job.address || 'No address'}`);
      console.log(`   Company: ${job.companyUuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb' ? 'ETS' : 'Other'}`);
      console.log(`   Source: ${job.source || 'Unknown'}`);
      console.log(`   UUID: ${job.uuid}`);
      console.log('');
    });

    console.log('🚨 IMPORTANT: Please review the jobs above carefully!');
    console.log('Are these the jobs you want to delete?');
    console.log('');
    console.log('If these look correct and you want to proceed with deletion:');
    console.log('1. Copy the UUIDs from above');
    console.log('2. Use the delete_job_list.js script');
    console.log('3. Or let me know and I can create a specific deletion script');
  } else {
    console.log('❌ No jobs found with the specified numbers.');
    console.log('This could mean:');
    console.log('- The jobs have already been deleted');
    console.log('- The job numbers are incorrect');
    console.log('- There was an issue with the search');
  }
}

// Run the search
findAndShowJobs();