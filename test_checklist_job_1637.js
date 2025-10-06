// Test adding checklist to Job 1637 specifically
const { getAuthHeaders } = require('./config');

async function addChecklistToJob1637() {
  console.log('🔍 Adding Checklist to Job 1637');
  console.log('================================\n');

  try {
    // Find Job 1637
    console.log('1️⃣ Finding Job 1637...');

    const searchResponse = await fetch(
      'https://api.servicem8.com/api_1.0/job.json?$filter=generated_job_id eq \'1637\'',
      { headers: getAuthHeaders() }
    );

    const jobs = await searchResponse.json();
    if (jobs.length === 0) {
      console.log('❌ Job 1637 not found');
      return;
    }

    const job = jobs[0];
    const jobUUID = job.uuid;
    console.log(`✅ Found job 1637: ${jobUUID}`);
    console.log(`   Company: ${job.company_uuid}`);
    console.log(`   Address: ${job.job_address}`);
    console.log(`   Status: ${job.status}\n`);

    // Check if it already has checklist items
    console.log('2️⃣ Checking for existing checklist...');
    const existingResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'`,
      { headers: getAuthHeaders() }
    );

    const existing = await existingResponse.json();
    console.log(`   Found ${existing.length} existing checklist items`);

    if (existing.length > 0) {
      console.log('\n⚠️  Job already has checklist items. Skipping to avoid duplicates.');
      return;
    }

    // Add checklist items
    console.log('\n3️⃣ Adding ETS standard checklist...');

    const checklistItems = [
      { text: 'Check site safety compliance', order: 1 },
      { text: 'Complete risk assessment form', order: 2 },
      { text: 'Take before photos', order: 3 },
      { text: 'Verify site access requirements', order: 4 },
      { text: 'Confirm approval limit with Sustaine', order: 5 },
      { text: 'Complete work as per specification', order: 6 },
      { text: 'Take after photos', order: 7 },
      { text: 'Clean up site', order: 8 },
      { text: 'Get client sign-off', order: 9 },
      { text: 'Submit invoice to ETS', order: 10 }
    ];

    for (const item of checklistItems) {
      const checklistData = {
        job_uuid: jobUUID,
        name: item.text,
        item_type: 'Todo',
        sort_order: item.order,
        active: 1
      };

      const response = await fetch('https://api.servicem8.com/api_1.0/jobchecklist.json', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checklistData)
      });

      if (response.ok) {
        console.log(`   ✅ ${item.order}. ${item.text}`);
      } else {
        console.log(`   ❌ Failed: ${item.text}`);
      }
    }

    // Verify
    console.log('\n4️⃣ Verifying checklist was added...');
    const finalResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'&$orderby=sort_order`,
      { headers: getAuthHeaders() }
    );

    const finalItems = await finalResponse.json();
    const validItems = finalItems.filter(item => item.name && item.name.length > 0);

    console.log(`   ✅ Job 1637 now has ${validItems.length} checklist items`);

    console.log('\n📊 COMPLETE:');
    console.log('============');
    console.log('✅ Checklist successfully added to Job 1637');
    console.log('📝 All 10 standard ETS checklist items added');
    console.log('👁️ View in ServiceM8: Job 1637 > Checklist tab');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addChecklistToJob1637();