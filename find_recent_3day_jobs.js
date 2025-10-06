// Find all jobs created in last 3 days
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Find all recent jobs
async function findRecentJobs() {
  console.log('🔍 SEARCHING FOR JOBS CREATED IN LAST 3 DAYS');
  console.log('=============================================\n');

  // Calculate 3 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const dateFilter = threeDaysAgo.toISOString().split('T')[0];

  console.log(`Searching from: ${dateFilter} to today\n`);

  try {
    // Get ALL jobs first (we'll filter by date after)
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const allJobs = await response.json();

      // Filter jobs created in last 3 days
      const recentJobs = allJobs.filter(job => {
        const jobDate = new Date(job.date);
        return jobDate >= threeDaysAgo;
      });

      console.log(`📊 Found ${recentJobs.length} jobs created in last 3 days\n`);

      if (recentJobs.length > 0) {
        // Sort by job number
        recentJobs.sort((a, b) => {
          const numA = parseInt(a.generated_job_id) || 0;
          const numB = parseInt(b.generated_job_id) || 0;
          return numA - numB;
        });

        // Group by company
        const etsJobs = [];
        const otherJobs = [];

        recentJobs.forEach(job => {
          if (job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb') {
            etsJobs.push(job);
          } else {
            otherJobs.push(job);
          }
        });

        // Display ETS jobs
        if (etsJobs.length > 0) {
          console.log('✅ EMERGENCY TRADE SERVICES JOBS:');
          console.log('==================================');
          etsJobs.forEach((job, index) => {
            console.log(`\n${index + 1}. Job ${job.generated_job_id}:`);
            console.log(`   UUID: ${job.uuid}`);
            console.log(`   Purchase Order: ${job.purchase_order_number || 'None'}`);
            console.log(`   Status: ${job.status}`);
            console.log(`   Address: ${job.job_address || 'No address'}`);
            console.log(`   Created: ${job.date}`);
            console.log(`   Active: ${job.active === 1 ? 'Yes' : 'No'}`);

            if (job.job_description) {
              const desc = job.job_description.substring(0, 150);
              console.log(`   Description: ${desc}${job.job_description.length > 150 ? '...' : ''}`);
            }

            // Check for test indicators
            const isTest = (job.job_address && job.job_address.toLowerCase().includes('test')) ||
                          (job.purchase_order_number && job.purchase_order_number.includes('TEST')) ||
                          (job.job_description && job.job_description.toLowerCase().includes('test'));

            if (isTest) {
              console.log(`   🧪 TEST JOB INDICATOR FOUND`);
            }
          });
        }

        // Display other jobs
        if (otherJobs.length > 0) {
          console.log('\n\n❌ OTHER COMPANY JOBS:');
          console.log('======================');
          otherJobs.forEach((job, index) => {
            console.log(`\n${index + 1}. Job ${job.generated_job_id}:`);
            console.log(`   UUID: ${job.uuid}`);
            console.log(`   Company UUID: ${job.company_uuid}`);
            console.log(`   Status: ${job.status}`);
            console.log(`   Address: ${job.job_address || 'No address'}`);
            console.log(`   Created: ${job.date}`);
            console.log(`   Active: ${job.active === 1 ? 'Yes' : 'No'}`);
          });
        }

        // Summary for deletion
        console.log('\n\n🗑️  JOBS READY FOR DELETION');
        console.log('============================');

        console.log('\n📝 Job Numbers List:');
        const jobNumbers = recentJobs.map(j => j.generated_job_id).join(', ');
        console.log(`All recent jobs: ${jobNumbers}`);

        if (etsJobs.length > 0) {
          console.log(`\nETS jobs: ${etsJobs.map(j => j.generated_job_id).join(', ')}`);
        }

        // List test jobs specifically
        const testJobs = recentJobs.filter(job => {
          return (job.job_address && job.job_address.toLowerCase().includes('test')) ||
                 (job.purchase_order_number && job.purchase_order_number.includes('TEST')) ||
                 (job.job_description && job.job_description.toLowerCase().includes('test'));
        });

        if (testJobs.length > 0) {
          console.log(`\n🧪 Test jobs detected: ${testJobs.map(j => j.generated_job_id).join(', ')}`);
        }

        return recentJobs;
      } else {
        console.log('❌ No jobs found in the last 3 days');
      }
    } else {
      console.log(`❌ Failed to fetch jobs: ${response.status}`);
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run search
findRecentJobs();