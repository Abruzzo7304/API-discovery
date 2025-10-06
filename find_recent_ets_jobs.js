// Find recent ETS jobs created in last 24 hours
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Find recent ETS jobs
async function findRecentETSJobs() {
  console.log('🔍 FINDING RECENT ETS JOBS');
  console.log('==========================');
  console.log('Searching for jobs with ETS company UUID created in last 24 hours\n');

  const etsCompanyUuid = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  // Calculate 24 hours ago
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  const dateFilter = twentyFourHoursAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

  console.log(`ETS Company UUID: ${etsCompanyUuid}`);
  console.log(`Searching from: ${dateFilter}\n`);

  try {
    // Search for jobs with ETS company UUID (all jobs, then filter by date)
    const url = `${SERVICEM8_API_BASE}/job.json?company_uuid=${etsCompanyUuid}`;
    console.log(`API URL: ${url}\n`);

    const response = await fetch(url, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const allJobs = await response.json();

      // Filter jobs created in last 24 hours
      const recentJobs = allJobs.filter(job => {
        const jobDate = new Date(job.date);
        return jobDate >= twentyFourHoursAgo;
      });

      console.log(`📊 Found ${allJobs.length} total ETS jobs, ${recentJobs.length} from last 24 hours:\n`);

      if (recentJobs.length > 0) {
        const jobs = recentJobs;
        jobs.forEach((job, index) => {
          console.log(`${index + 1}. Job ${job.generated_job_id}:`);
          console.log(`   UUID: ${job.uuid}`);
          console.log(`   Purchase Order: ${job.purchase_order_number || 'None'}`);
          console.log(`   Status: ${job.status}`);
          console.log(`   Address: ${job.job_address || 'No address'}`);
          console.log(`   Description: ${job.job_description ? job.job_description.substring(0, 150) + '...' : 'No description'}`);
          console.log(`   Source: ${job.source || 'Unknown'}`);
          console.log(`   Created: ${job.date}`);
          console.log(`   Active: ${job.active}`);
          console.log('');
        });

        // Show summary for deletion
        console.log('🗑️  JOBS READY FOR DELETION');
        console.log('============================');
        jobs.forEach((job, index) => {
          console.log(`${index + 1}. Job ${job.generated_job_id} - UUID: ${job.uuid}`);
        });

        return jobs;
      } else {
        console.log('❌ No ETS jobs found in the last 24 hours.');
        console.log('This could mean:');
        console.log('- The test jobs were created with a different company UUID');
        console.log('- The test jobs were created more than 24 hours ago');
        console.log('- The test jobs have already been deleted');
      }
    } else {
      console.log(`❌ API Error: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the search
findRecentETSJobs();