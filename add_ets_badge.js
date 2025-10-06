// Add ETS Job badge to the last job created
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function addETSBadgeToLastJob() {
  try {
    console.log('🏷️  Adding ETS Job Badge to Last Created Job');
    console.log('=============================================');

    const lastJobUuid = '3183464a-8525-46c7-9c2f-234d5c923dbb'; // Job 1608 from fixed workflow
    const etsBadgeUuid = '7e6e49bc-2c47-4df5-a83f-234d5003d4eb'; // ETS Job badge

    console.log(`🎯 Job UUID: ${lastJobUuid}`);
    console.log(`🏷️  Badge: ETS Job (${etsBadgeUuid})`);

    // Step 1: Get current job data to see existing badges
    console.log('\\n📋 Step 1: Getting current job data...');
    const getResponse = await fetch(`${SERVICEM8_API_BASE}/job/${lastJobUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to get job: ${getResponse.status}`);
    }

    const job = await getResponse.json();
    console.log(`✅ Job found: ${job.generated_job_id} - ${job.purchase_order_number}`);
    console.log(`📍 Address: ${job.job_address}`);
    console.log(`🏷️  Current badges: ${job.badges || 'None'}`);

    // Step 2: Add ETS Job badge to existing badges
    let currentBadges = [];
    if (job.badges) {
      try {
        currentBadges = JSON.parse(job.badges);
        console.log(`   Parsed ${currentBadges.length} existing badge(s)`);
      } catch (e) {
        console.log(`   Warning: Could not parse existing badges: ${e.message}`);
      }
    }

    // Add ETS Job badge if not already present
    if (!currentBadges.includes(etsBadgeUuid)) {
      currentBadges.push(etsBadgeUuid);
      console.log(`✅ Added ETS Job badge to list`);
    } else {
      console.log(`⚠️  ETS Job badge already exists`);
      return { success: true, alreadyExists: true };
    }

    // Step 3: Update job with new badges
    console.log('\\n📝 Step 2: Updating job with ETS Job badge...');
    const updateData = {
      badges: JSON.stringify(currentBadges)
    };

    console.log(`New badges value: ${updateData.badges}`);

    const updateResponse = await fetch(`${SERVICEM8_API_BASE}/job/${lastJobUuid}.json`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    console.log(`Update response: ${updateResponse.status}`);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Job update failed: ${updateResponse.status} - ${errorText}`);
    }

    // Step 4: Verify the badge was added
    console.log('\\n🔍 Step 3: Verifying badge was added...');
    const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/job/${lastJobUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (verifyResponse.ok) {
      const updatedJob = await verifyResponse.json();
      console.log(`✅ Updated badges: ${updatedJob.badges}`);

      if (updatedJob.badges) {
        try {
          const verifiedBadges = JSON.parse(updatedJob.badges);
          console.log(`🎉 Success! Job now has ${verifiedBadges.length} badge(s):`);
          verifiedBadges.forEach((badgeUuid, index) => {
            const badgeName = badgeUuid === etsBadgeUuid ? 'ETS Job' :
                             badgeUuid === '34448ab7-8ed0-4bc7-a608-1f47c5c91a1b' ? 'Warranty' :
                             badgeUuid === '73a12107-64de-4e3f-985f-1f47cf77985b' ? 'VIP' : 'Unknown';
            console.log(`   ${index + 1}. ${badgeName} (${badgeUuid})`);
          });
        } catch (e) {
          console.log(`⚠️  Could not parse verified badges: ${e.message}`);
        }
      }
    }

    console.log('\\n🎯 ETS BADGE UPDATE SUMMARY');
    console.log('===========================');
    console.log(`✅ Job: ${job.generated_job_id} (${lastJobUuid})`);
    console.log(`✅ ETS Job badge successfully added`);
    console.log(`🏷️  Badge UUID: ${etsBadgeUuid}`);

    return {
      success: true,
      jobUuid: lastJobUuid,
      jobNumber: job.generated_job_id,
      badgeAdded: etsBadgeUuid
    };

  } catch (error) {
    console.error('💥 Failed to add ETS Job badge:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the badge addition
addETSBadgeToLastJob();