// Test adding checklist to an EXISTING job
const { getAuthHeaders } = require('./config');

async function addChecklistToExistingJob() {
  console.log('🔍 Testing Checklist on Existing Job');
  console.log('=====================================\n');

  try {
    // Get a recent job from ETS
    console.log('1️⃣ Finding most recent ETS job...');

    const searchResponse = await fetch(
      'https://api.servicem8.com/api_1.0/job.json?$filter=company_uuid eq \'971d644f-d6a8-479c-a901-1f9b0425d7bb\'&$orderby=date desc&$top=1',
      { headers: getAuthHeaders() }
    );

    const jobs = await searchResponse.json();
    if (jobs.length === 0) {
      console.log('❌ No jobs found for ETS');
      return;
    }

    const job = jobs[0];
    const jobUUID = job.uuid;
    const jobNumber = job.generated_job_id;
    console.log(`✅ Found job: ${jobNumber} (${jobUUID})`);
    console.log(`   Address: ${job.job_address}`);
    console.log(`   Status: ${job.status}\n`);

    // Check existing checklist items
    console.log('2️⃣ Checking existing checklist items...');
    const existingResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'`,
      { headers: getAuthHeaders() }
    );

    const existing = await existingResponse.json();
    console.log(`   Found ${existing.length} existing checklist items`);

    if (existing.length > 0) {
      console.log('   Existing items:');
      const validItems = existing.filter(item => item.name && item.name.length > 0);
      validItems.forEach(item => {
        const isCompleted = item.completed_timestamp && item.completed_timestamp !== '0000-00-00 00:00:00';
        console.log(`   - ${item.name} (Completed: ${isCompleted ? 'Yes' : 'No'})`);
      });
    }

    // Add new checklist items
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

    let successCount = 0;
    let failCount = 0;

    for (const item of checklistItems) {
      const checklistData = {
        job_uuid: jobUUID,
        name: item.text,  // Use 'name' field for the text
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
        console.log(`   ✅ Added: ${item.text}`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`   ❌ Failed: ${item.text}`);
        console.log(`      Error: ${error.substring(0, 100)}`);
        failCount++;
      }
    }

    // Verify final state
    console.log('\n4️⃣ Verifying final checklist state...');
    const finalResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'&$orderby=sort_order`,
      { headers: getAuthHeaders() }
    );

    const finalItems = await finalResponse.json();
    const validFinalItems = finalItems.filter(item => item.name && item.name.length > 0);

    console.log(`   Total checklist items: ${finalItems.length}`);
    console.log(`   Items with text: ${validFinalItems.length}\n`);

    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`Job: ${jobNumber}`);
    console.log(`Successfully added: ${successCount} items`);
    console.log(`Failed to add: ${failCount} items`);
    console.log(`Total checklist items on job: ${validFinalItems.length}`);

    console.log('\n✅ Checklist items can be added to existing jobs');
    console.log('📝 Use this after job creation in production workflow');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addChecklistToExistingJob();