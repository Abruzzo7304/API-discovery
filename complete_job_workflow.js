// Complete ServiceM8 Job Workflow - Creation, Contacts, Attachments, Notes
// This script demonstrates the full workflow for external companies creating jobs in ETS system

const fs = require('fs');
const path = require('path');

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// ETS Contact UUIDs (pre-configured for external company use)
const ETS_CONTACTS = {
  DARREN_SIEMSEN: '02bd5c3e-e688-4f38-b744-230febe1549d', // Job contact
  ADMIN_BILLING: '0162c4eb-dd05-4df2-8a83-23184f9bc32d'   // Billing contact
};

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
  };
}

// Step 1: Create Job
async function createJob(jobData) {
  try {
    console.log('🏗️  STEP 1: Creating Job');
    console.log('========================');
    console.log('Job data:', JSON.stringify(jobData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const jobUuid = response.headers.get('x-record-uuid');
      console.log(`✅ Job created successfully!`);
      console.log(`📋 Job UUID: ${jobUuid}`);

      // Get job details
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const job = await verifyResponse.json();
        console.log(`📄 Job Number: ${job.generated_job_id}`);
        console.log(`🎯 Purchase Order: ${job.purchase_order_number}`);
        console.log(`📍 Address: ${job.job_address}`);
        console.log(`📊 Status: ${job.status}`);
      }

      return {
        success: true,
        jobUuid,
        jobData
      };
    } else {
      const errorText = await response.text();
      console.error(`❌ Job creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }

  } catch (error) {
    console.error('💥 Job creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Step 2: Link ETS Contacts to Job
async function linkETSContacts(jobUuid) {
  try {
    console.log('\\n👥 STEP 2: Linking ETS Contacts');
    console.log('================================');

    const results = [];

    // Link Darren Siemsen as Job Contact
    console.log('🔗 Linking Darren Siemsen (Job Contact)...');
    const darrenLink = await linkContact(jobUuid, ETS_CONTACTS.DARREN_SIEMSEN, 'JOB');
    results.push({ name: 'Darren Siemsen', type: 'JOB', ...darrenLink });

    // Link Admin as Billing Contact
    console.log('🔗 Linking Admin (Billing Contact)...');
    const adminLink = await linkContact(jobUuid, ETS_CONTACTS.ADMIN_BILLING, 'BILLING');
    results.push({ name: 'Admin', type: 'BILLING', ...adminLink });

    const successCount = results.filter(r => r.success).length;
    console.log(`\\n✅ ${successCount}/2 ETS contacts linked successfully`);

    return {
      success: successCount > 0,
      results
    };

  } catch (error) {
    console.error('💥 Contact linking failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to link individual contact
async function linkContact(jobUuid, contactUuid, contactType) {
  try {
    const jobContactData = {
      job_uuid: jobUuid,
      contact_uuid: contactUuid,
      type: contactType,
      active: 1
    };

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobContactData)
    });

    if (response.ok) {
      const jobContactUuid = response.headers.get('x-record-uuid');
      console.log(`   ✅ ${contactType} contact linked (UUID: ${jobContactUuid})`);
      return { success: true, jobContactUuid };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${contactType} contact link failed: ${response.status}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.log(`   💥 ${contactType} contact link error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Step 3: Upload Job Attachment
async function uploadJobAttachment(jobUuid, filePath, attachmentName) {
  try {
    console.log('\\n📎 STEP 3: Uploading Job Attachment');
    console.log('====================================');
    console.log(`📄 File: ${filePath}`);
    console.log(`📝 Name: ${attachmentName}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);
    const fileExtension = path.extname(filePath);

    console.log(`📊 File size: ${fileStats.size} bytes`);

    // Step 3a: Create attachment record
    console.log('\\n📋 Creating attachment record...');
    const attachmentData = {
      related_object: "job",
      related_object_uuid: jobUuid,
      attachment_name: attachmentName,
      file_type: fileExtension,
      active: true
    };

    const attachmentResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(attachmentData)
    });

    if (!attachmentResponse.ok) {
      const errorText = await attachmentResponse.text();
      throw new Error(`Attachment record creation failed: ${errorText}`);
    }

    const attachmentUuid = attachmentResponse.headers.get('x-record-uuid');
    console.log(`✅ Attachment record created (UUID: ${attachmentUuid})`);

    // Step 3b: Upload file content
    console.log('📤 Uploading file content...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, attachmentName);

    const uploadResponse = await fetch(`${SERVICEM8_API_BASE}/Attachment/${attachmentUuid}.file`, {
      method: 'POST',
      headers: getFileUploadHeaders(),
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`File upload failed: ${errorText}`);
    }

    console.log('✅ File uploaded successfully!');
    console.log(`📎 Attachment UUID: ${attachmentUuid}`);

    return {
      success: true,
      attachmentUuid,
      fileName: attachmentName
    };

  } catch (error) {
    console.error('💥 Attachment upload failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Step 4: Add Finance Approval Note
async function addFinanceNote(jobUuid, approvedAmount = 300, contactPerson = "Darren Siemsen", contactPhone = "0437 126237", contactEmail = "darren@emergencytradeservices.com.au") {
  try {
    console.log('\\n💰 STEP 4: Adding Finance Approval Note');
    console.log('=========================================');

    const financeNote = `FINANCE APPROVAL & AUTHORIZATION
=======================================

APPROVED: Work approved up to $${approvedAmount} + GST maximum.

IMPORTANT: For any changes to scope, variations, or costs exceeding approved amount, MUST contact ETS immediately before proceeding.

Contact for approvals:
- ${contactPerson}: ${contactPhone}
- Email: ${contactEmail}

DO NOT EXCEED approved amount without written authorization.

This job has been created via API by external contractor with pre-approved spending limits.`;

    console.log('Finance note content:');
    console.log('--------------------');
    console.log(financeNote);

    const noteData = {
      related_object: "job",
      related_object_uuid: jobUuid,
      note: financeNote,
      action_required: 1, // Mark as action required for visibility
      active: 1
    };

    const response = await fetch(`${SERVICEM8_API_BASE}/note.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      const noteUuid = response.headers.get('x-record-uuid');
      console.log(`\\n✅ Finance note created successfully!`);
      console.log(`📝 Note UUID: ${noteUuid}`);
      console.log(`⚠️  Marked as ACTION REQUIRED for visibility`);

      return {
        success: true,
        noteUuid,
        noteContent: financeNote
      };
    } else {
      const errorText = await response.text();
      console.error(`❌ Finance note creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }

  } catch (error) {
    console.error('💥 Finance note creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Complete Workflow Function
async function runCompleteJobWorkflow(jobData, attachmentFile, attachmentName, approvedAmount = 300) {
  console.log('🚀 COMPLETE SERVICEM8 JOB WORKFLOW');
  console.log('===================================');
  console.log('This demonstrates the full process for external companies\\n');

  const results = {
    job: null,
    contacts: null,
    attachment: null,
    financeNote: null
  };

  try {
    // Step 1: Create Job
    results.job = await createJob(jobData);
    if (!results.job.success) {
      throw new Error('Job creation failed');
    }

    const jobUuid = results.job.jobUuid;

    // Step 2: Link ETS Contacts
    results.contacts = await linkETSContacts(jobUuid);

    // Step 3: Upload Attachment
    results.attachment = await uploadJobAttachment(jobUuid, attachmentFile, attachmentName);

    // Step 4: Add Finance Note
    results.financeNote = await addFinanceNote(jobUuid, approvedAmount);

    // Final Summary
    console.log('\\n🎯 WORKFLOW COMPLETION SUMMARY');
    console.log('==============================');
    console.log(`✅ Job Creation: ${results.job.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ ETS Contacts: ${results.contacts.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Attachment: ${results.attachment.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Finance Note: ${results.financeNote.success ? 'SUCCESS' : 'FAILED'}`);

    const successCount = Object.values(results).filter(r => r && r.success).length;

    if (successCount === 4) {
      console.log('\\n🎉 COMPLETE SUCCESS!');
      console.log('====================');
      console.log('✅ Job fully configured with:');
      console.log('   📋 Job record created');
      console.log('   👥 ETS contacts linked');
      console.log('   📎 Document attached');
      console.log('   💰 Finance approval noted');
      console.log(`\\n📋 Job UUID: ${jobUuid}`);
      console.log('🔗 Ready for ETS team to review and schedule!');
    } else {
      console.log(`\\n⚠️  PARTIAL SUCCESS (${successCount}/4 steps completed)`);
      console.log('Some steps failed - check logs above for details');
    }

    return {
      success: successCount === 4,
      jobUuid,
      results,
      successCount
    };

  } catch (error) {
    console.error(`\\n💥 WORKFLOW FAILED: ${error.message}`);
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

// Example usage with test data
async function runExample() {
  // Example job data (external company would fill this template)
  const exampleJobData = {
    purchase_order_number: "ETS-WORKFLOW-TEST-001",
    status: "Work Order",
    job_address: "456 Complete Workflow Street, Test City QLD 4000",
    job_description: `Complete workflow test job - electrical safety inspection and certification

Site Contact: Sarah Wilson
Contact Phone: 0423 456 789
Site Address: 456 Complete Workflow Street, Test City QLD 4000

Work Required:
- Complete electrical safety inspection
- Issue safety certificate
- Test all safety switches and RCDs
- Check and tag portable equipment

APPROVAL & AUTHORIZATION REQUIRED - See finance note for approved limits.

API TEST JOB - Created via complete workflow demonstration.`,
    category_uuid: "9b87f18b-5e5c-486f-99e5-1f4c5a3460fb", // Electrical
    job_priority: "Normal",
    job_location_name: "Complete Workflow Test Site",

    // Pre-configured ETS details
    billing_address: "223 Tweed Valley Way\\nSouth Murwillumbah NSW 2484",
    company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb",
    active: 1,
    source: "Generated automatically by ETS using API Services - Complete Workflow Test"
  };

  const testFile = 'test_document.txt';
  const attachmentName = 'Electrical Inspection Requirements - Workflow Test.txt';
  const approvedAmount = 500; // $500 + GST approved limit

  await runCompleteJobWorkflow(exampleJobData, testFile, attachmentName, approvedAmount);
}

// Export functions for use in other scripts
module.exports = {
  createJob,
  linkETSContacts,
  uploadJobAttachment,
  addFinanceNote,
  runCompleteJobWorkflow,
  ETS_CONTACTS
};

// Run example if script is executed directly
if (require.main === module) {
  runExample();
}