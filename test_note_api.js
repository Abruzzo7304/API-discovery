// Test the Note API for adding notes to jobs
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test adding Note to job
async function testJobNote(jobUuid, noteText, actionRequired = false) {
  try {
    console.log('📝 Testing Note API');
    console.log('==================');
    console.log(`🎯 Job UUID: ${jobUuid}`);

    const noteData = {
      related_object: "job",
      related_object_uuid: jobUuid,
      note: noteText,
      action_required: actionRequired ? 1 : 0,
      active: 1
    };

    console.log('Note data:', JSON.stringify(noteData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/note.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const noteUuid = response.headers.get('x-record-uuid');
      console.log(`✅ Note created with UUID: ${noteUuid}`);

      // Verify the note
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/note/${noteUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const note = await verifyResponse.json();
        console.log('✅ Note verified:');
        console.log(`   Note: ${note.note}`);
        console.log(`   UUID: ${note.uuid}`);
        console.log(`   Related to: ${note.related_object} ${note.related_object_uuid}`);
        console.log(`   Action required: ${note.action_required}`);
        console.log(`   Created: ${note.create_date}`);
      }

      return {
        success: true,
        noteUuid,
        noteText
      };

    } else {
      const errorText = await response.text();
      console.error(`❌ Note creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }

  } catch (error) {
    console.error('\n💥 Note test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get all notes for a job
async function getJobNotes(jobUuid) {
  try {
    console.log(`\n📋 Getting all notes for job ${jobUuid}...`);

    // Use $filter parameter for proper filtering
    const response = await fetch(`${SERVICEM8_API_BASE}/note.json?$filter=related_object eq 'job' and related_object_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const notes = await response.json();
      console.log(`✅ Found ${notes.length} notes for this job:`);

      notes.forEach((note, index) => {
        console.log(`   ${index + 1}. ${note.note}`);
        console.log(`      UUID: ${note.uuid}`);
        console.log(`      Action required: ${note.action_required ? 'YES' : 'NO'}`);
        console.log(`      Created: ${note.create_date}`);
        console.log('');
      });

      return notes;
    } else {
      console.log('⚠️  Could not retrieve job notes');
      return [];
    }

  } catch (error) {
    console.error('Error getting job notes:', error);
    return [];
  }
}

// Main test function
async function runNoteTests() {
  const jobUuid = '23b8965a-f742-4b7c-9b29-234d5af9535b'; // Job we created

  console.log('🧪 ServiceM8 Note API Testing');
  console.log('============================\n');

  // Test 1: Add regular note
  console.log('TEST 1: Regular Note');
  console.log('====================');
  const regularNote = 'Follow-up note added via Note API: Customer requested additional safety checks. ETS to coordinate with site contact before arrival.';
  const noteResult1 = await testJobNote(jobUuid, regularNote, false);

  // Test 2: Add action required note
  console.log('\nTEST 2: Action Required Note');
  console.log('============================');
  const actionNote = 'ACTION REQUIRED: Customer wants quote for additional power points in garage. Contact Darren before proceeding with quote.';
  const noteResult2 = await testJobNote(jobUuid, actionNote, true);

  // Test 3: Get all notes for the job
  console.log('\nTEST 3: Retrieve All Job Notes');
  console.log('==============================');
  await getJobNotes(jobUuid);

  // Summary
  console.log('\n🎯 NOTE API TEST SUMMARY');
  console.log('========================');
  console.log(`✅ Regular Note: ${noteResult1.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Action Note: ${noteResult2.success ? 'SUCCESS' : 'FAILED'}`);

  if (noteResult1.success && noteResult2.success) {
    console.log('\n🎉 Note API is working perfectly!');
    console.log('📝 Can add follow-up notes to jobs');
    console.log('⚠️  Can flag notes that require action');
  }
}

// Run the tests
runNoteTests();