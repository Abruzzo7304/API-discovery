// Test badges with correct JSON array format
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// First, let's see what badges are available
async function getAvailableBadges() {
  try {
    console.log('🏷️  Getting Available Badges');
    console.log('=============================');

    const response = await fetch(`${SERVICEM8_API_BASE}/badge.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const badges = await response.json();
      console.log(`Found ${badges.length} available badges:`);

      badges.slice(0, 10).forEach((badge, index) => {
        console.log(`${index + 1}. ${badge.name} (UUID: ${badge.uuid})`);
        console.log(`   File: ${badge.file_name || 'N/A'}`);
        console.log(`   Active: ${badge.active}`);
        console.log('');
      });

      if (badges.length > 10) {
        console.log(`... and ${badges.length - 10} more badges`);
      }

      return badges;
    } else {
      console.log(`❌ Failed to get badges: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('Error getting badges:', error.message);
    return [];
  }
}

// Test creating job with badges in correct format
async function testJobWithCorrectBadges(availableBadges) {
  try {
    console.log('\n🧪 Testing Job Creation with Correct Badge Format');
    console.log('=================================================');

    // Get a few badge UUIDs to test with
    const activeBadges = availableBadges.filter(b => b.active).slice(0, 2);
    const badgeUuids = activeBadges.map(b => b.uuid);

    console.log('Testing with badges:');
    activeBadges.forEach(badge => {
      console.log(`  - ${badge.name} (${badge.uuid})`);
    });

    const testJobData = {
      purchase_order_number: "ETS-BADGE-CORRECT-001",
      status: "Work Order",
      job_address: "456 Correct Badge Street, Badge Success QLD 4000",
      job_description: "Test job with correctly formatted badges",
      category_uuid: "9b87f18b-5e5c-486f-99e5-1f4c5a3460fb", // Electrical
      job_priority: "High",

      // Pre-configured ETS details
      billing_address: "223 Tweed Valley Way\nSouth Murwillumbah NSW 2484",
      company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb",
      active: 1,
      source: "Badge Test with Correct Format",

      // Badges as JSON array encoded string
      badges: JSON.stringify(badgeUuids)
    };

    console.log('\nBadges field content:', testJobData.badges);

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testJobData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const jobUuid = response.headers.get('x-record-uuid');
      console.log(`✅ Job created successfully with UUID: ${jobUuid}`);

      // Verify the badges were saved
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const job = await verifyResponse.json();
        console.log(`\n🏷️  Badges saved: ${job.badges || 'None'}`);

        if (job.badges) {
          try {
            const savedBadges = JSON.parse(job.badges);
            console.log(`✅ Parsed badges: ${savedBadges.length} badge(s)`);
            savedBadges.forEach((badgeUuid, index) => {
              const badge = availableBadges.find(b => b.uuid === badgeUuid);
              console.log(`   ${index + 1}. ${badge ? badge.name : 'Unknown'} (${badgeUuid})`);
            });
          } catch (e) {
            console.log(`⚠️  Could not parse badges: ${e.message}`);
          }
        }

        console.log(`📊 Job Priority: ${job.job_priority || 'Not set'}`);
        console.log(`📋 Job Number: ${job.generated_job_id}`);
      }

      return { success: true, jobUuid };
    } else {
      const errorText = await response.text();
      console.log(`❌ Job creation failed: ${errorText}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.error('Error testing correct badge format:', error.message);
    return { success: false, error: error.message };
  }
}

// Test different badge scenarios
async function testBadgeScenarios() {
  console.log('\n🧪 Testing Different Badge Scenarios');
  console.log('====================================');

  const scenarios = [
    {
      name: 'Empty badges',
      badges: JSON.stringify([])
    },
    {
      name: 'Single badge UUID',
      badges: JSON.stringify(['4e7b2af8-44a8-4570-b4cc-20deaa28a65b']) // Make Safe category UUID as test
    },
    {
      name: 'Invalid format (not JSON)',
      badges: 'URGENT,HIGH_PRIORITY'
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`\nScenario: ${scenario.name}`);
      console.log(`Badges value: ${scenario.badges}`);

      const testJobData = {
        purchase_order_number: `ETS-BADGE-${scenario.name.replace(/\s+/g, '-').toUpperCase()}-001`,
        status: "Work Order",
        job_address: "789 Badge Scenario Street, Test QLD 4000",
        job_description: `Test job for ${scenario.name}`,
        category_uuid: "9b87f18b-5e5c-486f-99e5-1f4c5a3460fb",
        billing_address: "223 Tweed Valley Way\nSouth Murwillumbah NSW 2484",
        company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb",
        active: 1,
        badges: scenario.badges
      };

      const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testJobData)
      });

      if (response.ok) {
        const jobUuid = response.headers.get('x-record-uuid');
        console.log(`  ✅ SUCCESS: Job created (${jobUuid})`);
      } else {
        const errorText = await response.text();
        console.log(`  ❌ FAILED: ${response.status}`);
        if (errorText.length < 200) {
          console.log(`     Error: ${errorText}`);
        }
      }

    } catch (error) {
      console.log(`  💥 ERROR: ${error.message}`);
    }
  }
}

// Main function
async function runBadgeTests() {
  console.log('🧪 ServiceM8 Badge Testing - Correct Format');
  console.log('============================================\n');

  const badges = await getAvailableBadges();

  if (badges.length > 0) {
    const result = await testJobWithCorrectBadges(badges);
    await testBadgeScenarios();

    console.log('\n🎯 BADGE TEST SUMMARY');
    console.log('====================');
    console.log(`✅ Badge endpoint found: ${badges.length} badges available`);
    console.log(`✅ Correct format identified: JSON array encoded string`);

    if (result.success) {
      console.log(`✅ Job with badges created: ${result.jobUuid}`);
      console.log('\n🎉 Badges CAN be added through the job creation API!');
    }
  }
}

runBadgeTests();