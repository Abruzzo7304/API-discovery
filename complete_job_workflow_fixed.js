// Complete ServiceM8 Job Workflow - FIXED VERSION
// Creates jobs with embedded contact details in JobContact records

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

// Step 2: Create JobContact records with embedded contact details
async function createJobContacts(jobUuid) {
  try {
    console.log('\\n👥 STEP 2: Creating Job Contacts');
    console.log('=================================');

    const results = [];

    // Create Darren Siemsen as Job Contact
    console.log('🔗 Creating Darren Siemsen (Job Contact)...');
    const darrenContact = {
      job_uuid: jobUuid,
      first: 'Darren',
      last: 'Siemsen',
      email: 'darren@emergencytradeservices.com.au',
      mobile: '0437 126237',
      type: 'JOB',
      active: 1
    };

    const darrenResult = await createJobContact(darrenContact);
    results.push({ name: 'Darren Siemsen', type: 'JOB', ...darrenResult });

    // Create Admin as Billing Contact
    console.log('🔗 Creating Admin (Billing Contact)...');
    const adminContact = {
      job_uuid: jobUuid,
      first: 'Admin',
      last: '',
      email: 'admin@emergencytradeservices.com.au',
      mobile: '0418624603',
      type: 'BILLING',
      active: 1
    };

    const adminResult = await createJobContact(adminContact);
    results.push({ name: 'Admin', type: 'BILLING', ...adminResult });

    const successCount = results.filter(r => r.success).length;
    console.log(`\\n✅ ${successCount}/2 ETS contacts created successfully`);

    return {
      success: successCount > 0,
      results
    };

  } catch (error) {
    console.error('💥 Contact creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to create individual JobContact
async function createJobContact(contactData) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });

    if (response.ok) {
      const jobContactUuid = response.headers.get('x-record-uuid');
      console.log(`   ✅ ${contactData.type} contact created (UUID: ${jobContactUuid})`);
      return { success: true, jobContactUuid };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${contactData.type} contact creation failed: ${response.status}`);
      return { success: false, error: errorText };
    }

  } catch (error) {
    console.log(`   💥 ${contactData.type} contact creation error: ${error.message}`);
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

    const financeNote = `FINANCE APPROVAL & AUTHORISATION
=======================================

APPROVED: Work approved up to $${approvedAmount} + GST maximum.

IMPORTANT: For any changes to scope, variations, or costs exceeding approved amount, MUST contact ETS immediately before proceeding.

Contact for approvals:
- ${contactPerson}: ${contactPhone}
- Email: ${contactEmail}

DO NOT EXCEED approved amount without written authorisation.

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

// Step 5: Verify contacts are visible on job
async function verifyJobContacts(jobUuid) {
  try {
    console.log('\\n🔍 STEP 5: Verifying Job Contacts');
    console.log('===================================');

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobContacts = await response.json();
      console.log(`✅ Found ${jobContacts.length} contacts for this job:`);

      jobContacts.forEach((contact, index) => {
        console.log(`\\n${index + 1}. ${contact.first} ${contact.last}`);
        console.log(`   Type: ${contact.type}`);
        console.log(`   Phone: ${contact.mobile || contact.phone || 'N/A'}`);
        console.log(`   Email: ${contact.email || 'N/A'}`);
        console.log(`   UUID: ${contact.uuid}`);
        console.log(`   Active: ${contact.active ? 'YES' : 'NO'}`);
      });

      return {
        success: true,
        contactCount: jobContacts.length,
        contacts: jobContacts
      };
    } else {
      console.log('⚠️  Could not retrieve job contacts');
      return {
        success: false,
        contactCount: 0
      };
    }

  } catch (error) {
    console.error('Error verifying job contacts:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Complete Workflow Function
async function runCompleteJobWorkflow(jobData, attachmentFile, attachmentName, approvedAmount = 300) {
  console.log('🚀 COMPLETE SERVICEM8 JOB WORKFLOW (FIXED)');
  console.log('===========================================');
  console.log('This demonstrates the full process for external companies\\n');

  const results = {
    job: null,
    contacts: null,
    attachment: null,
    financeNote: null,
    verification: null
  };

  try {
    // Step 1: Create Job
    results.job = await createJob(jobData);
    if (!results.job.success) {
      throw new Error('Job creation failed');
    }

    const jobUuid = results.job.jobUuid;

    // Step 2: Create Job Contacts
    results.contacts = await createJobContacts(jobUuid);

    // Step 3: Upload Attachment
    results.attachment = await uploadJobAttachment(jobUuid, attachmentFile, attachmentName);

    // Step 4: Add Finance Note
    results.financeNote = await addFinanceNote(jobUuid, approvedAmount);

    // Step 5: Verify contacts are visible
    results.verification = await verifyJobContacts(jobUuid);

    // Final Summary
    console.log('\\n🎯 WORKFLOW COMPLETION SUMMARY');
    console.log('==============================');
    console.log(`✅ Job Creation: ${results.job.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Job Contacts: ${results.contacts.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Attachment: ${results.attachment.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Finance Note: ${results.financeNote.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Contact Verification: ${results.verification.success ? `SUCCESS (${results.verification.contactCount} contacts)` : 'FAILED'}`);

    const successCount = Object.values(results).filter(r => r && r.success).length;

    if (successCount === 5) {
      console.log('\\n🎉 COMPLETE SUCCESS!');
      console.log('====================');
      console.log('✅ Job fully configured with:');
      console.log('   📋 Job record created');
      console.log('   👥 ETS contacts created and visible');
      console.log('   📎 Document attached');
      console.log('   💰 Finance approval noted');
      console.log(`\\n📋 Job UUID: ${jobUuid}`);
      console.log('🔗 Ready for ETS team to review and schedule!');
    } else {
      console.log(`\\n⚠️  PARTIAL SUCCESS (${successCount}/5 steps completed)`);
      console.log('Some steps failed - check logs above for details');
    }

    return {
      success: successCount === 5,
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
    purchase_order_number: "ETS-FIXED-WORKFLOW-001",
    status: "Work Order",
    job_address: "789 Fixed Workflow Avenue, Success City QLD 4000",
    job_description: `Fixed workflow test job - electrical safety inspection with proper contacts

Site Contact: Sarah Wilson
Contact Phone: 0423 456 789
Site Address: 789 Fixed Workflow Avenue, Success City QLD 4000

Work Required:
- Complete electrical safety inspection
- Issue safety certificate
- Test all safety switches and RCDs
- Check and tag portable equipment

APPROVAL & AUTHORISATION REQUIRED - See finance note for approved limits.

API TEST JOB - Created via FIXED complete workflow demonstration.`,
    category_uuid: "9b87f18b-5e5c-486f-99e5-1f4c5a3460fb", // Electrical
    job_priority: "Normal",
    job_location_name: "Fixed Workflow Test Site",

    // Pre-configured ETS details
    billing_address: "223 Tweed Valley Way\\nSouth Murwillumbah NSW 2484",
    company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb",
    active: 1,
    source: "Generated automatically by ETS using API Services - FIXED Complete Workflow Test"
  };

  const testFile = 'test_document.txt';
  const attachmentName = 'Electrical Inspection Requirements - FIXED Workflow.txt';
  const approvedAmount = 750; // $750 + GST approved limit

  await runCompleteJobWorkflow(exampleJobData, testFile, attachmentName, approvedAmount);
}

// Export functions for use in other scripts
module.exports = {
  createJob,
  createJobContacts,
  uploadJobAttachment,
  addFinanceNote,
  verifyJobContacts,
  runCompleteJobWorkflow
};

// Run example if script is executed directly
if (require.main === module) {
  runExample();
}