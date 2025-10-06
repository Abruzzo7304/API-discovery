// ServiceM8 Job Attachment Script
// Adds file attachments to existing jobs

const fs = require('fs');
const path = require('path');

const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

// Authentication - external company will update these
const EMAIL = 'YOUR_SERVICEM8_EMAIL@example.com';
const PASSWORD = 'YOUR_SERVICEM8_PASSWORD';

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Function to add attachment to job
async function addJobAttachment(jobUuid, filePath, attachmentName = null) {
  try {
    console.log('📎 Adding Job Attachment');
    console.log('=======================');
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

    console.log('\n🎉 ATTACHMENT ADDED SUCCESSFULLY!');
    console.log('=================================');
    console.log(`✅ File "${fileName}" attached to job`);
    console.log(`📎 Attachment UUID: ${attachmentUuid}`);
    console.log('✅ File should now be visible in ServiceM8 job');

    return {
      success: true,
      attachmentUuid,
      fileName,
      jobUuid
    };

  } catch (error) {
    console.error('\n💥 Attachment failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to add multiple attachments
async function addMultipleAttachments(jobUuid, filePaths) {
  console.log(`📎 Adding ${filePaths.length} attachments to job ${jobUuid}`);

  const results = [];

  for (let i = 0; i < filePaths.length; i++) {
    console.log(`\n--- Attachment ${i + 1} of ${filePaths.length} ---`);
    const result = await addJobAttachment(jobUuid, filePaths[i]);
    results.push(result);

    // Small delay between uploads
    if (i < filePaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successful = results.filter(r => r.success).length;
  console.log(`\n📊 Upload Summary: ${successful}/${filePaths.length} files attached successfully`);

  return results;
}

// Command line usage
function showUsage() {
  console.log('📎 ServiceM8 Job Attachment Tool');
  console.log('==============================');
  console.log('');
  console.log('Usage:');
  console.log('  node add_job_attachment.js <job_uuid> <file_path> [attachment_name]');
  console.log('');
  console.log('Examples:');
  console.log('  node add_job_attachment.js 1234-5678-uuid photo.jpg');
  console.log('  node add_job_attachment.js 1234-5678-uuid report.pdf "Site Report"');
  console.log('');
  console.log('Note: Update EMAIL and PASSWORD variables before use');
}

// Validate configuration
function validateConfiguration() {
  if (EMAIL === 'YOUR_SERVICEM8_EMAIL@example.com' || PASSWORD === 'YOUR_SERVICEM8_PASSWORD') {
    console.error('❌ ERROR: Please update your ServiceM8 credentials in this script');
    console.log('1. Replace YOUR_SERVICEM8_EMAIL@example.com with your actual ServiceM8 email');
    console.log('2. Replace YOUR_SERVICEM8_PASSWORD with your actual ServiceM8 password');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    showUsage();
    process.exit(1);
  }

  validateConfiguration();

  const jobUuid = args[0];
  const filePath = args[1];
  const attachmentName = args[2]; // optional

  addJobAttachment(jobUuid, filePath, attachmentName);
}

module.exports = {
  addJobAttachment,
  addMultipleAttachments
};