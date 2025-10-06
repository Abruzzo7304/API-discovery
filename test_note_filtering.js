// Test Note API filtering to ensure we only get job-specific notes
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test different filtering approaches for job notes
async function testNoteFiltering() {
  const jobUuid = '23b8965a-f742-4b7c-9b29-234d5af9535b'; // Job 1606

  console.log('🔍 Testing Note API Filtering');
  console.log('==============================');
  console.log(`🎯 Job UUID: ${jobUuid}\n`);

  // Test 1: Current method
  console.log('TEST 1: Current filtering method');
  console.log('================================');
  try {
    const response1 = await fetch(`${SERVICEM8_API_BASE}/note.json?related_object=job&related_object_uuid=${jobUuid}`, {
      headers: getAuthHeaders()
    });

    if (response1.ok) {
      const notes1 = await response1.json();
      console.log(`✅ Method 1: Found ${notes1.length} notes`);

      // Show first few notes to check if they're actually for our job
      notes1.slice(0, 3).forEach((note, index) => {
        console.log(`   ${index + 1}. Related to: ${note.related_object} ${note.related_object_uuid}`);
        console.log(`      Note: ${note.note?.substring(0, 50)}...`);
      });
    }
  } catch (error) {
    console.error('Method 1 failed:', error.message);
  }

  // Test 2: Try different parameter format
  console.log('\nTEST 2: Alternative parameter format');
  console.log('====================================');
  try {
    const response2 = await fetch(`${SERVICEM8_API_BASE}/note.json?$filter=related_object eq 'job' and related_object_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (response2.ok) {
      const notes2 = await response2.json();
      console.log(`✅ Method 2: Found ${notes2.length} notes`);
    } else {
      console.log(`❌ Method 2: Status ${response2.status}`);
    }
  } catch (error) {
    console.error('Method 2 failed:', error.message);
  }

  // Test 3: Get specific notes we created and verify they exist
  console.log('\nTEST 3: Verify our notes exist in the system');
  console.log('===========================================');
  try {
    const response3 = await fetch(`${SERVICEM8_API_BASE}/note.json`, {
      headers: getAuthHeaders()
    });

    if (response3.ok) {
      const allNotes = await response3.json();
      console.log(`📊 Total notes in system: ${allNotes.length}`);

      // Filter for our job manually
      const ourJobNotes = allNotes.filter(note =>
        note.related_object === 'job' &&
        note.related_object_uuid === jobUuid
      );

      console.log(`🎯 Notes for our job: ${ourJobNotes.length}`);

      ourJobNotes.forEach((note, index) => {
        console.log(`   ${index + 1}. ${note.note}`);
        console.log(`      UUID: ${note.uuid}`);
        console.log(`      Action required: ${note.action_required ? 'YES' : 'NO'}`);
        console.log(`      Created: ${note.create_date}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Method 3 failed:', error.message);
  }
}

// Run the filtering tests
testNoteFiltering();