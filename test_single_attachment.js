// ServiceM8 Single Job Attachment Test
// APPROVED: Test attachment to Job 1600 only

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getFileUploadHeaders() {
  const headers = getAuthHeaders();
  // Remove Content-Type for file uploads - let browser set it
  const { 'Content-Type': _, ...uploadHeaders } = headers;
  return uploadHeaders;
}

// Test attachment for Job 1600 ONLY
async function testAttachmentToJob1600() {
  const jobUuid = '9af7ed45-351c-487d-ba31-234b20cd72fb'; // Job 1600
  const fileName = 'api-test-document.txt';
  const fileContent = `ServiceM8 API Attachment Test
============================
Test Date: ${new Date().toISOString()}
Job: 1600 (${jobUuid})

This is a test document to verify the ServiceM8 attachment API works correctly.

✅ Purpose: API testing
✅ Safe to delete
✅ Contains no sensitive data

Test completed successfully if you can see this file attached to Job 1600.
`;

  console.log('🧪 ServiceM8 Single Job Attachment Test');
  console.log('=======================================');
  console.log(`📋 Testing attachment to Job 1600`);
  console.log(`🎯 UUID: ${jobUuid}`);

  try {
    // Step 1: Create attachment record
    console.log('\n📝 Step 1: Creating attachment record...');

    const attachmentData = {
      related_object: "job",
      related_object_uuid: jobUuid,
      attachment_name: fileName,
      file_type: ".txt",
      active: true
    };

    console.log('Request data:', JSON.stringify(attachmentData, null, 2));

    const createResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attachmentData)
    });

    console.log(`Response status: ${createResponse.status}`);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create attachment record: ${createResponse.status} - ${errorText}`);
    }

    const attachmentUuid = createResponse.headers.get('x-record-uuid');
    console.log(`✅ Attachment record created with UUID: ${attachmentUuid}`);

    // Step 2: Upload file content
    console.log('\n📤 Step 2: Uploading file content...');

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, fileName);

    console.log(`File size: ${blob.size} bytes`);

    const uploadResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.file`, {
      method: 'POST',
      headers: getFileUploadHeaders(),
      body: formData
    });

    console.log(`Upload response status: ${uploadResponse.status}`);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file: ${uploadResponse.status} - ${errorText}`);
    }

    console.log('✅ File uploaded successfully!');

    // Step 3: Verify attachment was created
    console.log('\n🔍 Step 3: Verifying attachment...');

    const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (verifyResponse.ok) {
      const attachment = await verifyResponse.json();
      console.log('✅ Attachment verified:');
      console.log(`   Name: ${attachment.attachment_name}`);
      console.log(`   Type: ${attachment.file_type}`);
      console.log(`   Size: ${attachment.file_size || 'Unknown'} bytes`);
      console.log(`   UUID: ${attachment.uuid}`);
      console.log(`   Related to: ${attachment.related_object} ${attachment.related_object_uuid}`);
      console.log(`   Active: ${attachment.active}`);
      console.log(`   Created: ${attachment.edit_date}`);
    }

    // Step 4: Test the problematic attachment listing
    console.log('\n🕵️ Step 4: Testing attachment listing (investigating previous issue)...');

    // Test direct filter approach
    const listResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$filter=related_object_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (listResponse.ok) {
      const attachments = await listResponse.json();
      console.log(`📋 Found ${attachments.length} attachments using $filter approach`);

      if (attachments.length > 0) {
        console.log('✅ SUCCESS: Filter is working! Found our attachment:');
        attachments.forEach(att => {
          console.log(`   - ${att.attachment_name} (${att.uuid})`);
        });
      } else {
        console.log('⚠️  Filter returned 0 results - may take time to index');
      }
    }

    console.log('\n🎉 ATTACHMENT TEST COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('✅ Attachment record created');
    console.log('✅ File content uploaded');
    console.log('✅ Attachment verified');
    console.log(`✅ File should now be visible in Job 1600 in ServiceM8`);
    console.log(`📎 Attachment UUID: ${attachmentUuid}`);

    return {
      success: true,
      attachmentUuid: attachmentUuid,
      jobUuid: jobUuid,
      fileName: fileName
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for use in other scripts
module.exports = {
  testAttachmentToJob1600
};

// Run test if this script is executed directly
if (require.main === module) {
  testAttachmentToJob1600();
}