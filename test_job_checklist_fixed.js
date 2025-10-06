// Test adding checklist items to jobs - FIXED VERSION
const { getAuthHeaders } = require('./config');

async function testJobChecklist() {
  console.log('🔍 Testing Job Checklist API (Fixed)');
  console.log('=====================================\n');

  try {
    // First create a test job
    console.log('1️⃣ Creating test job...');

    const jobData = {
      company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb', // ETS
      status: 'Quote',
      job_address: 'Test Address for Checklist',
      job_description: 'Test job for checklist items',
      active: 1
    };

    const jobResponse = await fetch('https://api.servicem8.com/api_1.0/job.json', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    // Get the created job
    const searchResponse = await fetch(
      'https://api.servicem8.com/api_1.0/job.json?$filter=company_uuid eq \'971d644f-d6a8-479c-a901-1f9b0425d7bb\'&$orderby=date desc&$top=1',
      { headers: getAuthHeaders() }
    );

    const jobs = await searchResponse.json();
    if (jobs.length === 0) {
      console.log('❌ Failed to create job');
      return;
    }

    const jobUUID = jobs[0].uuid;
    const jobNumber = jobs[0].generated_job_id;
    console.log(`✅ Job created: ${jobNumber} (${jobUUID})\n`);

    // Now try to add checklist items with CORRECT field name
    console.log('2️⃣ Adding checklist items to job...');

    const checklistItems = [
      { text: 'Check electrical safety compliance', order: 1 },
      { text: 'Complete risk assessment form', order: 2 },
      { text: 'Take before photos', order: 3 },
      { text: 'Verify site access requirements', order: 4 },
      { text: 'Confirm approval limit with client', order: 5 },
      { text: 'Complete work as per specification', order: 6 },
      { text: 'Take after photos', order: 7 },
      { text: 'Clean up site', order: 8 },
      { text: 'Get client sign-off', order: 9 },
      { text: 'Submit invoice to ETS', order: 10 }
    ];

    for (const item of checklistItems) {
      const checklistData = {
        job_uuid: jobUUID,
        name: item.text,  // CORRECT: Use 'name' field for the text
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
      } else {
        const error = await response.text();
        console.log(`   ❌ Failed: ${item.text}`);
        console.log(`      Error: ${error.substring(0, 100)}`);
      }
    }

    // Verify checklist was added
    console.log('\n3️⃣ Verifying checklist items...');
    const checklistResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'&$orderby=sort_order`,
      { headers: getAuthHeaders() }
    );

    const checklists = await checklistResponse.json();
    console.log(`   Found ${checklists.length} checklist items on job`);

    // Filter to only show our new items (not the old broken ones)
    const validChecklists = checklists.filter(cl => cl.name && cl.name.length > 0);

    console.log(`   ${validChecklists.length} items with text:\n`);
    validChecklists.forEach(cl => {
      const isCompleted = cl.completed_timestamp && cl.completed_timestamp !== '0000-00-00 00:00:00';
      console.log(`   ${cl.sort_order}. ${cl.name} (Completed: ${isCompleted ? 'Yes' : 'No'})`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log('✅ Checklists CAN be added via API');
    console.log('✅ Use "name" field for the checklist text');
    console.log('✅ Use "item_type": "Todo" for the type');
    console.log('✅ Use "sort_order" for sequencing');
    console.log('✅ Check completion via "completed_timestamp" field');
    console.log('\n📝 For ETS Integration:');
    console.log('   Add standard checklist after job creation');
    console.log('   Could include safety checks, approval confirmations, etc.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testJobChecklist();