// ServiceM8 Job Creation with Company Contacts
// Shows how to create a job and link it to existing company contacts

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Step 1: Create the job (basic info only)
async function createJob(jobData) {
  try {
    console.log('📋 Step 1: Creating job...');

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
      const error = await response.text();
      throw new Error(`Job creation failed: ${error}`);
    }
  } catch (error) {
    console.error('❌ Job creation error:', error);
    throw error;
  }
}

// Step 2: Link job to company contact
async function linkJobToContact(jobUuid, contactUuid, contactType = 'JOB') {
  try {
    console.log(`🔗 Step 2: Linking job to contact (${contactType})...`);

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
      console.log(`✅ Contact linked with UUID: ${linkUuid}`);
      return linkUuid;
    } else {
      const error = await response.text();
      throw new Error(`Contact linking failed: ${error}`);
    }
  } catch (error) {
    console.error('❌ Contact linking error:', error);
    throw error;
  }
}

// Complete job creation workflow
async function createJobWithContacts() {
  try {
    console.log('🚀 Creating Job with Company Contacts');
    console.log('====================================\n');

    // Job data (without individual contact fields)
    const jobData = {
      status: "Work Order",
      job_address: "23 Latrobe Street, East Brisbane QLD 4169",
      job_description: "Emergency electrical work - lightning damage repair",
      job_number: "PO1234-5678",
      company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb",
      billing_address: "223 Tweed Valley Way\nSouth Murwillumbah NSW 2484",
      job_notes: "Created via API with company contact linking",
      active: 1
    };

    // Step 1: Create the job
    const jobUuid = await createJob(jobData);

    // Step 2: Link to company contacts
    // Primary contact (Darren Siemsen - JOB contact)
    await linkJobToContact(jobUuid, "db3a9ef8-8bea-427a-af3b-1f9b07cb9a4b", "JOB");

    // Billing contact (Admin)
    await linkJobToContact(jobUuid, "546c96a0-2eec-4ee7-96d3-1f9b0d3a9beb", "BILLING");

    console.log('\n🎉 Job Creation Complete!');
    console.log('========================');
    console.log(`Job UUID: ${jobUuid}`);
    console.log('✅ Job created with company contacts linked');
    console.log('✅ Primary contact: Darren Siemsen (JOB)');
    console.log('✅ Billing contact: Admin (BILLING)');

    // Step 3: Verify by fetching job contacts
    console.log('\n🔍 Verifying job contacts...');
    await verifyJobContacts(jobUuid);

    return jobUuid;

  } catch (error) {
    console.error('\n💥 Job creation workflow failed:', error);
    throw error;
  }
}

// Verify contacts were linked correctly
async function verifyJobContacts(jobUuid) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?job_uuid=${jobUuid}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const contacts = await response.json();
      console.log(`📞 Found ${contacts.length} linked contacts:`);

      for (const contact of contacts) {
        // Get the company contact details
        const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact/${contact.company_contact_uuid}.json`, {
          headers: getAuthHeaders()
        });

        if (contactResponse.ok) {
          const contactDetails = await contactResponse.json();
          console.log(`   - ${contactDetails.first} ${contactDetails.last} (${contact.type})`);
          console.log(`     Email: ${contactDetails.email || 'N/A'}`);
          console.log(`     Mobile: ${contactDetails.mobile || 'N/A'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error verifying contacts:', error);
  }
}

// Updated template generator that shows the proper way
function generateUpdatedTemplate() {
  const template = {
    "// JOB BASICS": "Core job information",
    "status": "Work Order",
    "job_address": "23 Latrobe Street, East Brisbane QLD 4169",
    "job_description": "FILL_ME_IN - Description of work needed",
    "job_number": "PO1234-5678",
    "company_uuid": "971d644f-d6a8-479c-a901-1f9b0425d7bb",
    "billing_address": "FILL_ME_IN - Billing address",
    "job_notes": "FILL_ME_IN - Additional notes",
    "active": 1,

    "// CONTACT LINKING": "Available company contacts to link",
    "available_contacts": [
      {
        "uuid": "db3a9ef8-8bea-427a-af3b-1f9b07cb9a4b",
        "name": "Darren Siemsen (Primary)",
        "email": "darren@emergencytradeservices.com.au",
        "mobile": "0437 126237",
        "type": "JOB",
        "use_for_job": "true - Set to true to link this contact"
      },
      {
        "uuid": "546c96a0-2eec-4ee7-96d3-1f9b0d3a9beb",
        "name": "Admin",
        "email": "admin@emergencytradeservices.com.au",
        "mobile": "0418624603",
        "type": "BILLING",
        "use_for_job": "true - Set to true to link this contact"
      },
      {
        "uuid": "421c87e3-27e0-4574-90f3-20dfded5f94b",
        "name": "Mark Stephen",
        "mobile": "0409914022",
        "type": "Property Manager",
        "use_for_job": "false - Set to true to link this contact"
      }
    ],

    "// INSTRUCTIONS": {
      "1": "Fill in the FILL_ME_IN fields",
      "2": "Set 'use_for_job' to 'true' for contacts you want linked",
      "3": "Job will be created first, then contacts linked",
      "4": "Do not add individual contact fields to the job data"
    }
  };

  console.log('\n📝 Updated Template Structure:');
  console.log('=============================');
  console.log(JSON.stringify(template, null, 2));
}

// Run the example
if (require.main === module) {
  console.log('🎯 ServiceM8 Job + Contact Creation Example');
  console.log('===========================================\n');

  // Show the proper template structure
  generateUpdatedTemplate();

  console.log('\n🚀 Running live example...\n');

  // Run the actual creation
  createJobWithContacts().catch(console.error);
}

module.exports = {
  createJob,
  linkJobToContact,
  createJobWithContacts,
  verifyJobContacts
};