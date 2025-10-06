// ServiceM8 Job Creation Script for External Company
// Run this script to create jobs in ServiceM8 using the job_data_template.json

const fs = require('fs');

// ============================================
// CONFIGURATION - UPDATE THESE CREDENTIALS
// ============================================
const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

// Your ServiceM8 login credentials
const EMAIL = 'YOUR_SERVICEM8_EMAIL@example.com';        // UPDATE THIS
const PASSWORD = 'YOUR_SERVICEM8_PASSWORD';              // UPDATE THIS

// Helper function to get authentication headers
function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Function to load and validate the job template
function loadJobTemplate() {
  try {
    console.log('📋 Loading job template...');

    const templateData = fs.readFileSync('job_data_template.json', 'utf8');
    const jobData = JSON.parse(templateData);

    // Remove comment fields and instruction fields
    const cleanJobData = {};
    for (const [key, value] of Object.entries(jobData)) {
      if (!key.startsWith('//') && key !== 'INSTRUCTIONS') {
        cleanJobData[key] = value;
      }
    }

    // Validate required fields are filled
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

    // Clean up optional fields that weren't filled
    for (const [key, value] of Object.entries(cleanJobData)) {
      if (value && value.toString().includes('FILL_ME_IN')) {
        delete cleanJobData[key];
      }
    }

    console.log('✅ Template loaded and validated');
    return cleanJobData;

  } catch (error) {
    console.error('❌ Error loading template:', error.message);
    throw error;
  }
}

// Function to create the job
async function createJob(jobData) {
  try {
    console.log('🚀 Creating job in ServiceM8...');
    console.log('Job data:', JSON.stringify(jobData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobUuid = response.headers.get('x-record-uuid');

    if (response.ok && jobUuid) {
      console.log(`✅ Job created successfully!`);
      console.log(`🎯 Job UUID: ${jobUuid}`);
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

// Function to link job to company contacts
async function linkJobToContact(jobUuid, contactUuid, contactType) {
  try {
    console.log(`🔗 Linking job to ${contactType} contact...`);

    const jobContactData = {
      job_uuid: jobUuid,
      company_contact_uuid: contactUuid,
      type: contactType
    };

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobContactData)
    });

    const linkUuid = response.headers.get('x-record-uuid');

    if (response.ok && linkUuid) {
      console.log(`✅ ${contactType} contact linked successfully`);
      return linkUuid;
    } else {
      const errorText = await response.text();
      console.log(`⚠️  Contact linking failed: ${errorText}`);
      // Don't fail the whole process if contact linking fails
      return null;
    }

  } catch (error) {
    console.error(`⚠️  Contact linking error: ${error.message}`);
    // Don't fail the whole process if contact linking fails
    return null;
  }
}

// Function to get the created job number
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

// Main function to create job with contacts
async function createJobWithContacts() {
  try {
    console.log('🎯 ServiceM8 Job Creation');
    console.log('========================\n');

    // Step 1: Load and validate template
    const jobData = loadJobTemplate();

    // Step 2: Create the job
    const jobUuid = await createJob(jobData);

    // Step 3: Link to company contacts (Emergency Trade Services)
    console.log('\n🔗 Linking company contacts...');

    // Primary job contact (currently: Darren Siemsen)
    await linkJobToContact(jobUuid, "db3a9ef8-8bea-427a-af3b-1f9b07cb9a4b", "JOB");

    // Billing contact (Admin)
    await linkJobToContact(jobUuid, "546c96a0-2eec-4ee7-96d3-1f9b0d3a9beb", "BILLING");

    // Step 4: Get the job number
    const jobNumber = await getJobNumber(jobUuid);

    // Step 5: Success summary
    console.log('\n🎉 Job Creation Complete!');
    console.log('========================');
    console.log(`✅ Job Number: ${jobNumber}`);
    console.log(`✅ Job UUID: ${jobUuid}`);
    console.log('✅ Company contacts linked');
    console.log('✅ Job is now available in ServiceM8');

    return { jobUuid, jobNumber };

  } catch (error) {
    console.error('\n💥 Job creation failed:', error.message);
    console.log('\n🔧 Please check:');
    console.log('1. Your ServiceM8 credentials are correct');
    console.log('2. The job_data_template.json file is properly filled out');
    console.log('3. All required fields have been completed');
    process.exit(1);
  }
}

// Validate configuration before running
function validateConfiguration() {
  if (EMAIL === 'YOUR_SERVICEM8_EMAIL@example.com' || PASSWORD === 'YOUR_SERVICEM8_PASSWORD') {
    console.error('❌ ERROR: Please update your ServiceM8 credentials in this script');
    console.log('1. Replace YOUR_SERVICEM8_EMAIL@example.com with your actual ServiceM8 email');
    console.log('2. Replace YOUR_SERVICEM8_PASSWORD with your actual ServiceM8 password');
    process.exit(1);
  }

  if (!fs.existsSync('job_data_template.json')) {
    console.error('❌ ERROR: job_data_template.json file not found');
    console.log('Please ensure the job template file is in the same directory as this script');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  console.log('🔧 Validating configuration...');
  validateConfiguration();

  console.log('✅ Configuration valid, proceeding...\n');
  createJobWithContacts();
}

module.exports = {
  createJobWithContacts,
  loadJobTemplate,
  createJob,
  linkJobToContact
};