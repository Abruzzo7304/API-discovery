// ServiceM8 Complete Job Creation Script
// Creates job, adds attachments, and manages contacts all in one

const fs = require('fs');
const { addJobAttachment } = require('./add_job_attachment');
const { addNewContactToJob, getJobContacts } = require('./add_job_contact');

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

// Load and clean job template
function loadJobTemplate() {
  try {
    const templateData = fs.readFileSync('job_data_template.json', 'utf8');
    const jobData = JSON.parse(templateData);

    // Remove comment fields
    const cleanJobData = {};
    for (const [key, value] of Object.entries(jobData)) {
      if (!key.startsWith('//') && key !== 'INSTRUCTIONS' && key !== '// Job Type categories: Category_UUID') {
        cleanJobData[key] = value;
      }
    }

    // Validate required fields
    const requiredFields = ['status', 'job_address', 'job_description'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!cleanJobData[field] || cleanJobData[field].toString().includes('FILL_ME_IN')) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Clean up optional fields
    for (const [key, value] of Object.entries(cleanJobData)) {
      if (value && value.toString().includes('FILL_ME_IN')) {
        delete cleanJobData[key];
      }
    }

    return cleanJobData;

  } catch (error) {
    console.error('❌ Error loading template:', error.message);
    throw error;
  }
}

// Create job
async function createJob(jobData) {
  try {
    console.log('🚀 Creating job in ServiceM8...');

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobUuid = response.headers.get('x-record-uuid');

    if (response.ok && jobUuid) {
      console.log(`✅ Job created with UUID: ${jobUuid}`);
      return jobUuid;
    } else {
      const errorText = await response.text();
      throw new Error(`Job creation failed: ${response.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Job creation error:', error.message);
    throw error;
  }
}

// Link default ETS contacts
async function linkDefaultContacts(jobUuid) {
  try {
    console.log('🔗 Linking default ETS contacts...');

    // Primary job contact (Darren)
    await linkContact(jobUuid, "db3a9ef8-8bea-427a-af3b-1f9b07cb9a4b", "JOB");

    // Billing contact (Admin)
    await linkContact(jobUuid, "546c96a0-2eec-4ee7-96d3-1f9b0d3a9beb", "BILLING");

    console.log('✅ Default contacts linked');

  } catch (error) {
    console.error('⚠️  Default contact linking failed:', error.message);
  }
}

async function linkContact(jobUuid, contactUuid, type) {
  const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      job_uuid: jobUuid,
      company_contact_uuid: contactUuid,
      type: type
    })
  });

  if (response.ok) {
    console.log(`✅ ${type} contact linked`);
  } else {
    console.log(`⚠️  ${type} contact linking failed`);
  }
}

// Get job number
async function getJobNumber(jobUuid) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const job = await response.json();
      return job.generated_job_id;
    }
  } catch (error) {
    console.error('Error getting job number:', error);
  }
  return 'Unknown';
}

// Parse attachments from command line
function parseAttachments(args) {
  const attachments = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--attach' && i + 1 < args.length) {
      attachments.push(args[i + 1]);
      i++; // Skip the next argument as it's the file path
    }
  }

  return attachments;
}

// Parse additional contacts from command line
function parseContacts(args) {
  const contacts = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--contact' && i + 3 < args.length) {
      contacts.push({
        firstName: args[i + 1],
        lastName: args[i + 2],
        phone: args[i + 3],
        type: 'JOB'
      });
      i += 3; // Skip the next 3 arguments
    }
  }

  return contacts;
}

// Main comprehensive job creation
async function createCompleteJob() {
  try {
    console.log('🎯 ServiceM8 Complete Job Creation');
    console.log('==================================\n');

    // Step 1: Create the job
    const jobData = loadJobTemplate();
    const jobUuid = await createJob(jobData);

    // Step 2: Link default contacts
    await linkDefaultContacts(jobUuid);

    // Step 3: Get job number
    const jobNumber = await getJobNumber(jobUuid);

    console.log('\n🎉 JOB CREATION COMPLETE!');
    console.log('=========================');
    console.log(`✅ Job Number: ${jobNumber}`);
    console.log(`✅ Job UUID: ${jobUuid}`);

    // Step 4: Add attachments if specified
    const args = process.argv.slice(2);
    const attachments = parseAttachments(args);

    if (attachments.length > 0) {
      console.log(`\n📎 Adding ${attachments.length} attachments...`);

      for (const filePath of attachments) {
        if (fs.existsSync(filePath)) {
          const result = await addJobAttachment(jobUuid, filePath);
          if (result.success) {
            console.log(`✅ Attached: ${result.fileName}`);
          } else {
            console.log(`❌ Failed to attach: ${filePath}`);
          }
        } else {
          console.log(`❌ File not found: ${filePath}`);
        }
      }
    }

    // Step 5: Add additional contacts if specified
    const contacts = parseContacts(args);

    if (contacts.length > 0) {
      console.log(`\n👤 Adding ${contacts.length} additional contacts...`);

      for (const contact of contacts) {
        const result = await addNewContactToJob(jobUuid, contact);
        if (result.success) {
          console.log(`✅ Added contact: ${result.contactName}`);
        } else {
          console.log(`❌ Failed to add contact: ${contact.firstName} ${contact.lastName}`);
        }
      }
    }

    console.log('\n🎯 COMPLETE JOB SETUP FINISHED!');
    console.log('==============================');
    console.log(`📋 Job Number: ${jobNumber}`);
    console.log(`🎯 Job UUID: ${jobUuid}`);
    console.log('✅ Job is ready in ServiceM8');

    return { jobNumber, jobUuid };

  } catch (error) {
    console.error('\n💥 Complete job creation failed:', error.message);
    process.exit(1);
  }
}

// Show usage
function showUsage() {
  console.log('🎯 ServiceM8 Complete Job Creation Tool');
  console.log('======================================');
  console.log('');
  console.log('Creates a job and optionally adds attachments and contacts');
  console.log('');
  console.log('Usage:');
  console.log('  node create_job_with_attachments_contacts.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --attach <file_path>                    Add file attachment');
  console.log('  --contact <first> <last> <phone>        Add additional contact');
  console.log('');
  console.log('Examples:');
  console.log('  node create_job_with_attachments_contacts.js');
  console.log('  node create_job_with_attachments_contacts.js --attach photo.jpg');
  console.log('  node create_job_with_attachments_contacts.js --attach photo.jpg --attach report.pdf');
  console.log('  node create_job_with_attachments_contacts.js --contact John Smith 0412345678');
  console.log('  node create_job_with_attachments_contacts.js --attach photo.jpg --contact John Smith 0412345678');
  console.log('');
  console.log('Note: job_data_template.json must be filled out first');
}

// Validate configuration
function validateConfiguration() {
  if (EMAIL === 'YOUR_SERVICEM8_EMAIL@example.com' || PASSWORD === 'YOUR_SERVICEM8_PASSWORD') {
    console.error('❌ ERROR: Please update your ServiceM8 credentials');
    process.exit(1);
  }

  if (!fs.existsSync('job_data_template.json')) {
    console.error('❌ ERROR: job_data_template.json file not found');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  validateConfiguration();
  createCompleteJob();
}

module.exports = {
  createCompleteJob,
  createJob,
  linkDefaultContacts
};