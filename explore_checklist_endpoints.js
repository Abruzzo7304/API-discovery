// Explore different checklist-related endpoints
const { getAuthHeaders } = require('./config');

async function exploreChecklistEndpoints() {
  console.log('🔍 Exploring Checklist Endpoints');
  console.log('=================================\n');

  const jobUUID = '2da02036-6edd-4218-9e30-234f7646bccb'; // Job 1637

  try {
    // Try different endpoints
    const endpoints = [
      '/jobchecklist.json',
      '/JobChecklist.json',
      '/jobtemplatechecklist.json',
      '/checklist.json',
      '/todo.json',
      '/jobtodo.json'
    ];

    for (const endpoint of endpoints) {
      console.log(`Testing: ${endpoint}`);

      try {
        const response = await fetch(
          `https://api.servicem8.com/api_1.0${endpoint}?$filter=job_uuid eq '${jobUUID}'&$top=1`,
          { headers: getAuthHeaders() }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Success - Found ${data.length} items`);

          if (data.length > 0) {
            console.log(`  Sample structure:`);
            const fields = Object.keys(data[0]);
            console.log(`  Fields: ${fields.slice(0, 10).join(', ')}${fields.length > 10 ? '...' : ''}`);

            // Check for name/text fields
            const textFields = fields.filter(f =>
              f.includes('name') ||
              f.includes('text') ||
              f.includes('title') ||
              f.includes('description') ||
              f.includes('item')
            );

            if (textFields.length > 0) {
              console.log(`  Text fields found: ${textFields.join(', ')}`);
              textFields.forEach(field => {
                if (data[0][field]) {
                  console.log(`    ${field}: "${data[0][field]}"`);
                }
              });
            }
          }
        } else {
          console.log(`  ❌ Failed - Status ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
      console.log('');
    }

    // Check if Job has a checklist field
    console.log('Checking Job object for checklist field...');
    const jobResponse = await fetch(
      `https://api.servicem8.com/api_1.0/job/${jobUUID}.json`,
      { headers: getAuthHeaders() }
    );

    if (jobResponse.ok) {
      const job = await jobResponse.json();
      const jobFields = Object.keys(job);

      const checklistFields = jobFields.filter(f =>
        f.toLowerCase().includes('checklist') ||
        f.toLowerCase().includes('todo')
      );

      if (checklistFields.length > 0) {
        console.log(`  Found checklist-related fields in job: ${checklistFields.join(', ')}`);
        checklistFields.forEach(field => {
          console.log(`    ${field}: ${JSON.stringify(job[field])}`);
        });
      } else {
        console.log('  No checklist-related fields found in job object');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exploreChecklistEndpoints();