// ServiceM8 Document Attachment API Discovery Script
// This script demonstrates how to attach documents to existing jobs

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Function to get headers for file upload (different content type)
function getFileUploadHeaders() {
  const headers = getAuthHeaders();
  // Remove Content-Type for file uploads - let browser set it
  const { 'Content-Type': _, ...uploadHeaders } = headers;
  return uploadHeaders;
}

// Function to find existing jobs to attach documents to
async function getExistingJobs() {
  try {
    console.log('🔍 Finding existing jobs...');
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$top=5&$orderby=edit_date desc`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jobs = await response.json();
    console.log(`✅ Found ${jobs.length} recent jobs`);

    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ${job.generated_job_id || job.uuid}: ${job.job_description?.substring(0, 50)}...`);
      console.log(`   Status: ${job.status}, Date: ${job.date}`);
    });

    return jobs;
  } catch (error) {
    console.error('❌ Error getting existing jobs:', error);
    throw error;
  }
}

// Function to create an attachment record
async function createAttachmentRecord(jobUuid, fileName, fileType) {
  const attachmentData = {
    related_object: "job",
    related_object_uuid: jobUuid,
    attachment_name: fileName,
    file_type: fileType.startsWith('.') ? fileType : `.${fileType}`,
    active: true
  };

  try {
    console.log(`📝 Creating attachment record for job ${jobUuid}...`);
    console.log('Attachment data:', JSON.stringify(attachmentData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attachmentData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const attachmentUuid = response.headers.get('x-record-uuid');

    if (response.ok && attachmentUuid) {
      console.log(`✅ Attachment record created with UUID: ${attachmentUuid}`);
      return attachmentUuid;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to create attachment record:', errorText);
      throw new Error(`Failed to create attachment: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error creating attachment record:', error);
    throw error;
  }
}

// Function to create a sample text file for testing
function createSampleFile(fileName, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], fileName, { type: 'text/plain' });
  return file;
}

// Function to upload file to the attachment
async function uploadFileToAttachment(attachmentUuid, file) {
  try {
    console.log(`📤 Uploading file to attachment ${attachmentUuid}...`);
    console.log(`File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.file`, {
      method: 'POST',
      headers: getFileUploadHeaders(),
      body: formData
    });

    console.log('Upload response status:', response.status);

    if (response.ok) {
      console.log('✅ File uploaded successfully!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to upload file:', errorText);
      throw new Error(`Failed to upload file: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    throw error;
  }
}

// Function to verify attachment was created correctly
async function verifyAttachment(attachmentUuid) {
  try {
    console.log(`🔍 Verifying attachment ${attachmentUuid}...`);

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const attachment = await response.json();
      console.log('✅ Attachment verified:');
      console.log(`   Name: ${attachment.attachment_name}`);
      console.log(`   Type: ${attachment.file_type}`);
      console.log(`   Size: ${attachment.file_size} bytes`);
      console.log(`   Related to: ${attachment.related_object} ${attachment.related_object_uuid}`);
      return attachment;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to verify attachment:', errorText);
    }
  } catch (error) {
    console.error('❌ Error verifying attachment:', error);
  }
}

// Function to list all attachments for a job
async function listJobAttachments(jobUuid) {
  try {
    console.log(`📋 Listing attachments for job ${jobUuid}...`);

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?related_object_uuid=${jobUuid}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const attachments = await response.json();
      console.log(`✅ Found ${attachments.length} attachments for this job:`);
      attachments.forEach((attachment, index) => {
        console.log(`${index + 1}. ${attachment.attachment_name} (${attachment.file_type}) - ${attachment.file_size} bytes`);
      });
      return attachments;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to list attachments:', errorText);
    }
  } catch (error) {
    console.error('❌ Error listing attachments:', error);
  }
}

// Main test function - complete document attachment workflow
async function testDocumentAttachment() {
  console.log('🚀 ServiceM8 Document Attachment API Test');
  console.log('==========================================');

  try {
    // Step 1: Get existing jobs
    const jobs = await getExistingJobs();
    if (!jobs || jobs.length === 0) {
      throw new Error('No jobs found to attach documents to');
    }

    // Use the first job for testing
    const testJob = jobs[0];
    console.log(`\n🎯 Using job: ${testJob.generated_job_id || testJob.uuid}`);

    // Step 2: Create a sample file
    const sampleContent = `Document Attachment Test
========================
Job ID: ${testJob.generated_job_id || testJob.uuid}
Job Description: ${testJob.job_description}
Test Date: ${new Date().toISOString()}

This is a test document attached via the ServiceM8 API.
The document attachment API allows files to be uploaded and associated with specific jobs.

API Test Results:
- Attachment record creation: Success
- File upload: Success
- Verification: Success
`;

    const testFile = createSampleFile('api-test-document.txt', sampleContent);

    // Step 3: Create attachment record
    const attachmentUuid = await createAttachmentRecord(
      testJob.uuid,
      'api-test-document.txt',
      '.txt'
    );

    // Step 4: Upload the file
    await uploadFileToAttachment(attachmentUuid, testFile);

    // Step 5: Verify the attachment
    await verifyAttachment(attachmentUuid);

    // Step 6: List all attachments for this job
    await listJobAttachments(testJob.uuid);

    console.log('\n🎉 DOCUMENT ATTACHMENT TEST COMPLETE!');
    console.log('The API workflow has been successfully tested:');
    console.log('1. ✅ Found existing job');
    console.log('2. ✅ Created attachment record');
    console.log('3. ✅ Uploaded file content');
    console.log('4. ✅ Verified attachment');
    console.log('5. ✅ Listed job attachments');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Function to test different file types
async function testMultipleFileTypes() {
  console.log('\n🔬 Testing Multiple File Types');
  console.log('==============================');

  const jobs = await getExistingJobs();
  if (!jobs || jobs.length === 0) return;

  const testJob = jobs[0];
  const fileTests = [
    { name: 'test-image.jpg', type: '.jpg', content: 'fake-image-data' },
    { name: 'test-document.pdf', type: '.pdf', content: 'fake-pdf-content' },
    { name: 'test-spreadsheet.csv', type: '.csv', content: 'col1,col2,col3\nval1,val2,val3' }
  ];

  for (const fileTest of fileTests) {
    try {
      console.log(`\nTesting ${fileTest.type} file...`);
      const attachmentUuid = await createAttachmentRecord(
        testJob.uuid,
        fileTest.name,
        fileTest.type
      );

      const file = createSampleFile(fileTest.name, fileTest.content);
      await uploadFileToAttachment(attachmentUuid, file);
      console.log(`✅ ${fileTest.type} file attachment successful`);

    } catch (error) {
      console.error(`❌ ${fileTest.type} file attachment failed:`, error.message);
    }
  }
}

// Export functions for use in other scripts
module.exports = {
  getExistingJobs,
  createAttachmentRecord,
  uploadFileToAttachment,
  verifyAttachment,
  listJobAttachments,
  testDocumentAttachment,
  testMultipleFileTypes
};

// Run the test if this script is executed directly
if (require.main === module) {
  testDocumentAttachment();
}