// Verify what's actually in Job 1637's checklist
const { getAuthHeaders } = require('./config');

async function verifyJob1637Checklist() {
  console.log('🔍 Verifying Job 1637 Checklist');
  console.log('================================\n');

  try {
    // Find Job 1637
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
    console.log(`Job 1637 UUID: ${jobUUID}\n`);

    // Get ALL checklist items
    console.log('Fetching ALL checklist items for this job...\n');
    const checklistResponse = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'`,
      { headers: getAuthHeaders() }
    );

    const checklists = await checklistResponse.json();
    console.log(`Total items found: ${checklists.length}\n`);

    if (checklists.length === 0) {
      console.log('❌ No checklist items found via API');
      console.log('   This means they were NOT created successfully\n');

      // Try creating one with minimal data
      console.log('Testing minimal checklist creation...\n');
      const minimalData = {
        job_uuid: jobUUID,
        name: 'Test Checklist Item'
      };

      console.log('Sending:', JSON.stringify(minimalData, null, 2));

      const testResponse = await fetch('https://api.servicem8.com/api_1.0/jobchecklist.json', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(minimalData)
      });

      const testResult = await testResponse.text();
      console.log('\nResponse status:', testResponse.status);
      console.log('Response:', testResult.substring(0, 500));

    } else {
      console.log('Raw checklist items:');
      console.log('===================\n');

      checklists.forEach((item, index) => {
        console.log(`Item ${index + 1}:`);
        console.log(`  UUID: ${item.uuid}`);
        console.log(`  Name: "${item.name}"`);
        console.log(`  Type: ${item.item_type}`);
        console.log(`  Sort: ${item.sort_order}`);
        console.log(`  Active: ${item.active}`);
        console.log(`  Completed: ${item.completed_timestamp !== '0000-00-00 00:00:00' ? item.completed_timestamp : 'No'}`);
        console.log('');
      });

      // Check for items with actual text
      const itemsWithText = checklists.filter(item => item.name && item.name.trim().length > 0);
      console.log(`Items with text: ${itemsWithText.length}`);

      if (itemsWithText.length > 0) {
        console.log('\nItems with text content:');
        itemsWithText.forEach(item => {
          console.log(`  - ${item.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyJob1637Checklist();