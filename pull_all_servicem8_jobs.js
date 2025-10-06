// Pull all jobs from ServiceM8
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Pull all jobs and organize by company
async function pullAllJobs() {
  console.log('📊 PULLING ALL JOBS FROM SERVICEM8');
  console.log('===================================');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Pull ALL jobs (no limit)
    console.log('🔄 Fetching all jobs...\n');
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch jobs: ${response.status}`);
      return;
    }

    const allJobs = await response.json();
    console.log(`✅ Found ${allJobs.length} total jobs\n`);

    // Organize by various criteria
    const etsJobs = [];
    const recentJobs = [];
    const activeJobs = [];
    const queuedJobs = [];
    const networkJobs = [];

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Process all jobs
    allJobs.forEach(job => {
      // ETS jobs
      if (job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb') {
        etsJobs.push(job);
      }

      // Recent jobs (last 3 days)
      const jobDate = new Date(job.date);
      if (jobDate >= threeDaysAgo) {
        recentJobs.push(job);
      }

      // Active jobs
      if (job.active === 1) {
        activeJobs.push(job);
      }

      // Jobs with queue assignment
      if (job.queue_uuid) {
        queuedJobs.push(job);
      }

      // Jobs with network requests
      if (job.active_network_request_uuid) {
        networkJobs.push(job);
      }
    });

    // Display ETS Jobs
    console.log('🏢 EMERGENCY TRADE SERVICES JOBS');
    console.log('=================================');
    console.log(`Total: ${etsJobs.length} jobs\n`);

    if (etsJobs.length > 0) {
      // Sort by job number
      etsJobs.sort((a, b) => {
        const numA = parseInt(a.generated_job_id) || 0;
        const numB = parseInt(b.generated_job_id) || 0;
        return numB - numA; // Descending order
      });

      // Show recent ETS jobs
      const recentETSJobs = etsJobs.slice(0, 20);
      console.log('Recent ETS Jobs:');
      recentETSJobs.forEach(job => {
        console.log(`Job ${job.generated_job_id}:`);
        console.log(`   UUID: ${job.uuid}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Address: ${job.job_address || 'No address'}`);
        console.log(`   Date: ${job.date}`);
        console.log(`   Active: ${job.active === 1 ? 'Yes' : 'No'}`);
        if (job.queue_uuid) {
          console.log(`   Queue: Assigned`);
        }
        if (job.active_network_request_uuid) {
          console.log(`   Network Request: Active`);
        }
        console.log('');
      });
    }

    // Display Recent Jobs (All Companies)
    console.log('\n📅 RECENT JOBS (LAST 3 DAYS - ALL COMPANIES)');
    console.log('=============================================');
    console.log(`Total: ${recentJobs.length} jobs\n`);

    if (recentJobs.length > 0) {
      recentJobs.sort((a, b) => new Date(b.date) - new Date(a.date));

      recentJobs.forEach(job => {
        const isETS = job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb';
        console.log(`Job ${job.generated_job_id}: ${isETS ? '✅ ETS' : '❌ Other'}`);
        console.log(`   Date: ${job.date}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Address: ${job.job_address || 'No address'}`);
        console.log('');
      });
    }

    // Display Active Jobs Summary
    console.log('\n📊 JOB STATISTICS');
    console.log('=================');
    console.log(`Total Jobs: ${allJobs.length}`);
    console.log(`ETS Jobs: ${etsJobs.length}`);
    console.log(`Active Jobs: ${activeJobs.length}`);
    console.log(`Jobs in Queues: ${queuedJobs.length}`);
    console.log(`Jobs with Network Requests: ${networkJobs.length}`);
    console.log(`Recent Jobs (3 days): ${recentJobs.length}`);

    // Status breakdown
    const statusCounts = {};
    allJobs.forEach(job => {
      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
    });

    console.log('\n📈 STATUS BREAKDOWN:');
    Object.keys(statusCounts).forEach(status => {
      console.log(`   ${status}: ${statusCounts[status]}`);
    });

    // Find specific job numbers if they exist
    console.log('\n🔍 CHECKING FOR SPECIFIC JOBS:');
    const checkJobNumbers = ['1609', '1603', '1600'];

    checkJobNumbers.forEach(jobNum => {
      const found = allJobs.find(j => j.generated_job_id === jobNum);
      if (found) {
        console.log(`Job ${jobNum}: ✅ Found`);
        console.log(`   Company: ${found.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb' ? 'ETS' : 'Other'}`);
        console.log(`   UUID: ${found.uuid}`);
      } else {
        console.log(`Job ${jobNum}: ❌ Not found`);
      }
    });

    // Save summary to return
    return {
      total: allJobs.length,
      etsJobs: etsJobs.length,
      activeJobs: activeJobs.length,
      recentJobs: recentJobs.length,
      jobs: allJobs
    };

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the pull
pullAllJobs();