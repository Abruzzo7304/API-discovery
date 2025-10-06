// Debug checklist API response
const { getAuthHeaders } = require('./config');

async function debugChecklist() {
  console.log('🔍 Debugging Checklist API');
  console.log('===========================\n');

  try {
    // Get job 1604's checklist
    const jobUUID = '4e5eb6bd-86f4-4526-9aff-234d575e7d5b'; // Job 1604

    console.log('Fetching checklist for Job 1604...\n');
    const response = await fetch(
      `https://api.servicem8.com/api_1.0/jobchecklist.json?$filter=job_uuid eq '${jobUUID}'`,
      { headers: getAuthHeaders() }
    );

    const checklists = await response.json();
    console.log(`Found ${checklists.length} checklist items\n`);

    console.log('Raw API response for first 3 items:');
    console.log(JSON.stringify(checklists.slice(0, 3), null, 2));

    console.log('\nAll field names in first item:');
    if (checklists.length > 0) {
      console.log(Object.keys(checklists[0]));
    }

    console.log('\nChecklist items:');
    checklists.forEach((item, index) => {
      console.log(`${index + 1}. UUID: ${item.uuid}`);
      console.log(`   Job UUID: ${item.job_uuid}`);
      console.log(`   Text: ${item.text || item.item || item.description || item.name || 'NO TEXT FIELD FOUND'}`);
      console.log(`   Checked: ${item.checked}`);
      console.log(`   Sort Order: ${item.sort_order || 'none'}`);
      console.log(`   All fields: ${JSON.stringify(item)}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugChecklist();