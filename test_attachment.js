// Test script for job attachments and notes
const fs = require('fs');
const path = require('path');

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test adding attachment to job
async function testJobAttachment(jobUuid, filePath, attachmentName = null) {
  try {
    console.log('📎 Testing Job Attachment');
    console.log('=========================');
    console.log(`🎯 Job UUID: ${jobUuid}`);
    console.log(`📄 File: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file info
    const fileStats = fs.statSync(filePath);
    const fileName = attachmentName || path.basename(filePath);
    const fileExtension = path.extname(filePath);

    console.log(`📊 File size: ${fileStats.size} bytes`);
    console.log(`📝 Attachment name: ${fileName}`);

    // Step 1: Create attachment record
    console.log('\n📋 Step 1: Creating attachment record...');

    const attachmentData = {
      related_object: "job",
      related_object_uuid: jobUuid,
      attachment_name: fileName,
      file_type: fileExtension,
      active: true
    };

    console.log('Request data:', JSON.stringify(attachmentData, null, 2));

    const attachmentResponse = await fetch(`${SERVICEM8_API_BASE}/attachment.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attachmentData)
    });

    console.log(`Response status: ${attachmentResponse.status}`);

    if (!attachmentResponse.ok) {
      const errorText = await attachmentResponse.text();
      throw new Error(`Attachment record creation failed: ${errorText}`);
    }

    const attachmentUuid = attachmentResponse.headers.get('x-record-uuid');
    console.log(`✅ Attachment record created with UUID: ${attachmentUuid}`);

    // Step 2: Upload file content
    console.log('\n📤 Step 2: Uploading file content...');

    const fileContent = fs.readFileSync(filePath);

    const uploadResponse = await fetch(`${SERVICEM8_API_BASE}/attachment/${attachmentUuid}.json`, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeaders().Authorization,
        'Content-Type': 'application/octet-stream'
      },
      body: fileContent
    });

    console.log(`Upload response status: ${uploadResponse.status}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${errorText}`);
    }

    console.log('✅ File uploaded successfully!');

    // Step 3: Verify attachment
    console.log('\n🔍 Step 3: Verifying attachment...');

    const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/attachment/${attachmentUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (verifyResponse.ok) {
      const attachment = await verifyResponse.json();
      console.log('✅ Attachment verified:');
      console.log(`   Name: ${attachment.attachment_name}`);
      console.log(`   Type: ${attachment.file_type}`);
      console.log(`   UUID: ${attachment.uuid}`);
      console.log(`   Related to: ${attachment.related_object} ${attachment.related_object_uuid}`);
      console.log(`   Active: ${attachment.active}`);
      console.log(`   Created: ${attachment.edit_date}`);
    }

    return {
      success: true,
      attachmentUuid,
      fileName
    };

  } catch (error) {
    console.error('\n💥 Attachment test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test adding JobNote to job
async function testJobNote(jobUuid, noteText, noteType = 'JOB') {
  try {
    console.log('\n📝 Testing Job Note API');
    console.log('=======================');
    console.log(`🎯 Job UUID: ${jobUuid}`);
    console.log(`📋 Note Type: ${noteType}`);

    const noteData = {
      job_uuid: jobUuid,
      note: noteText,
      note_type: noteType,
      active: 1
    };

    console.log('Note data:', JSON.stringify(noteData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/jobnote.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const noteUuid = response.headers.get('x-record-uuid');
      console.log(`✅ Job note created with UUID: ${noteUuid}`);

      // Verify the note
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/jobnote/${noteUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const note = await verifyResponse.json();
        console.log('✅ Note verified:');
        console.log(`   Note: ${note.note}`);
        console.log(`   Type: ${note.note_type}`);
        console.log(`   UUID: ${note.uuid}`);
        console.log(`   Job UUID: ${note.job_uuid}`);
        console.log(`   Created: ${note.edit_date}`);
      }

      return {
        success: true,
        noteUuid,
        noteText
      };

    } else {
      const errorText = await response.text();
      console.error(`❌ Job note creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }

  } catch (error) {
    console.error('\n💥 Job note test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get all job notes for verification
async function getJobNotes(jobUuid) {
  try {
    console.log(`\n📋 Getting all notes for job ${jobUuid}...`);

    const response = await fetch(`${SERVICEM8_API_BASE}/jobnote.json?job_uuid=${jobUuid}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const notes = await response.json();
      console.log(`✅ Found ${notes.length} notes:`);

      notes.forEach((note, index) => {
        console.log(`   ${index + 1}. [${note.note_type}] ${note.note}`);
        console.log(`      Created: ${note.edit_date}`);
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
async function runTests() {
  const jobUuid = '23b8965a-f742-4b7c-9b29-234d5af9535b'; // Job we just created
  const testFile = 'test_document.txt';
  const testNote = 'Follow-up note added via JobNote API: Customer requested additional safety checks. ETS to coordinate with site contact before arrival.';

  console.log('🧪 ServiceM8 Attachment & Note Testing');
  console.log('=====================================\n');

  // Test 1: Add attachment
  console.log('TEST 1: File Attachment');
  console.log('========================');
  const attachmentResult = await testJobAttachment(jobUuid, testFile, 'API Test Document');

  // Test 2: Add job note
  console.log('\nTEST 2: Job Note API');
  console.log('====================');
  const noteResult = await testJobNote(jobUuid, testNote, 'JOB');

  // Test 3: Verify all notes
  console.log('\nTEST 3: Verify Job Notes');
  console.log('========================');
  await getJobNotes(jobUuid);

  // Summary
  console.log('\n🎯 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Attachment: ${attachmentResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Job Note: ${noteResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests();