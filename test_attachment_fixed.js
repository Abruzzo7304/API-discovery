// Fixed test script for job attachments - using working method
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

function getFileUploadHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    // Don't set Content-Type for file uploads - let browser set it
  };
}

// Test adding attachment to job - FIXED VERSION
async function testJobAttachmentFixed(jobUuid, filePath, attachmentName = null) {
  try {
    console.log('📎 Testing Job Attachment (Fixed Method)');
    console.log('========================================');
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

    // Use capital A in "Attachment" - this was the working endpoint
    const attachmentResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment.json`, {
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

    // Step 2: Upload file content - FIXED METHOD
    console.log('\n📤 Step 2: Uploading file content...');

    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Create FormData with Blob (working method)
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, fileName);

    console.log(`File size: ${blob.size} bytes`);

    // Use the working endpoint: /Attachment/{uuid}.file
    const uploadResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.file`, {
      method: 'POST',
      headers: getFileUploadHeaders(),
      body: formData
    });

    console.log(`Upload response status: ${uploadResponse.status}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${errorText}`);
    }

    console.log('✅ File uploaded successfully!');

    // Step 3: Verify attachment
    console.log('\n🔍 Step 3: Verifying attachment...');

    const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.json`, {
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

    console.log('\n🎉 ATTACHMENT TEST SUCCESSFUL!');
    console.log('==============================');
    console.log(`✅ File "${fileName}" attached to job`);
    console.log(`📎 Attachment UUID: ${attachmentUuid}`);

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

// Check what note-related endpoints are available
async function exploreNoteEndpoints(jobUuid) {
  console.log('\n🔍 Exploring Note-Related Endpoints');
  console.log('===================================');

  const endpoints = [
    'jobnote',
    'JobNote',
    'note',
    'Note',
    'jobactivity',
    'JobActivity'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}.json?job_uuid=${jobUuid}`, {
        headers: getAuthHeaders()
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS: Found ${data.length} records`);
        if (data.length > 0) {
          console.log(`  Sample fields: ${Object.keys(data[0]).join(', ')}`);
        }
      } else if (response.status === 404) {
        console.log(`  ❌ Not found`);
      } else {
        const error = await response.text();
        console.log(`  ⚠️  Error: ${error.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`  💥 Error: ${error.message}`);
    }
  }
}

// Main test function
async function runFixedTests() {
  const jobUuid = '23b8965a-f742-4b7c-9b29-234d5af9535b'; // Job we created
  const testFile = 'test_document.txt';

  console.log('🧪 ServiceM8 Fixed Attachment Testing');
  console.log('====================================\n');

  // Test 1: Add attachment with fixed method
  const attachmentResult = await testJobAttachmentFixed(jobUuid, testFile, 'API Test Document Fixed');

  // Test 2: Explore note endpoints
  await exploreNoteEndpoints(jobUuid);

  // Summary
  console.log('\n🎯 FIXED TEST SUMMARY');
  console.log('====================');
  console.log(`✅ Attachment: ${attachmentResult.success ? 'SUCCESS' : 'FAILED'}`);

  if (attachmentResult.success) {
    console.log('🎉 Attachment functionality is working!');
    console.log('📎 Files can be successfully attached to jobs');
  }
}

// Run the tests
runFixedTests();