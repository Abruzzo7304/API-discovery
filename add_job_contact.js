// ServiceM8 Job Contact Management Script
// Adds additional contacts to existing jobs

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

// Function to create a new company contact
async function createCompanyContact(contactData) {
  try {
    console.log('👤 Creating new company contact...');
    console.log('Contact data:', JSON.stringify(contactData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });

    const contactUuid = response.headers.get('x-record-uuid');

    if (response.ok && contactUuid) {
      console.log(`✅ Company contact created with UUID: ${contactUuid}`);
      return contactUuid;
    } else {
      const errorText = await response.text();
      throw new Error(`Contact creation failed: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Contact creation error:', error.message);
    throw error;
  }
}

// Function to link existing contact to job
async function linkContactToJob(jobUuid, contactUuid, contactType = 'JOB') {
  try {
    console.log(`🔗 Linking contact to job as ${contactType} contact...`);

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
      console.log(`✅ Contact linked to job with UUID: ${linkUuid}`);
      return linkUuid;
    } else {
      const errorText = await response.text();
      throw new Error(`Contact linking failed: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Contact linking error:', error.message);
    throw error;
  }
}

// Function to add new contact to job (create + link)
async function addNewContactToJob(jobUuid, contactInfo) {
  try {
    console.log('👤 Adding New Contact to Job');
    console.log('============================');
    console.log(`🎯 Job UUID: ${jobUuid}`);

    // Prepare contact data for company contact creation
    const contactData = {
      company_uuid: "971d644f-d6a8-479c-a901-1f9b0425d7bb", // ETS company UUID
      first: contactInfo.firstName || '',
      last: contactInfo.lastName || '',
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      mobile: contactInfo.mobile || '',
      type: contactInfo.type || 'JOB',
      active: 1,
      is_primary_contact: contactInfo.isPrimary ? '1' : '0'
    };

    // Step 1: Create company contact
    const contactUuid = await createCompanyContact(contactData);

    // Step 2: Link to job
    const linkUuid = await linkContactToJob(jobUuid, contactUuid, contactInfo.type || 'JOB');

    console.log('\n🎉 CONTACT ADDED SUCCESSFULLY!');
    console.log('==============================');
    console.log(`✅ Contact: ${contactInfo.firstName} ${contactInfo.lastName}`);
    console.log(`✅ Type: ${contactInfo.type || 'JOB'}`);
    console.log(`✅ Contact UUID: ${contactUuid}`);
    console.log(`✅ Link UUID: ${linkUuid}`);

    return {
      success: true,
      contactUuid,
      linkUuid,
      contactName: `${contactInfo.firstName} ${contactInfo.lastName}`
    };

  } catch (error) {
    console.error('\n💥 Adding contact failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to get existing job contacts
async function getJobContacts(jobUuid) {
  try {
    console.log(`📞 Getting existing contacts for job ${jobUuid}...`);

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?job_uuid=${jobUuid}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobContacts = await response.json();
      console.log(`📋 Found ${jobContacts.length} existing contacts:`);

      for (const jobContact of jobContacts) {
        // Get contact details
        const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact/${jobContact.company_contact_uuid}.json`, {
          headers: getAuthHeaders()
        });

        if (contactResponse.ok) {
          const contact = await contactResponse.json();
          console.log(`   - ${contact.first} ${contact.last} (${jobContact.type})`);
          console.log(`     Email: ${contact.email || 'N/A'}`);
          console.log(`     Phone: ${contact.phone || 'N/A'}`);
          console.log(`     Mobile: ${contact.mobile || 'N/A'}`);
        }
      }

      return jobContacts;
    } else {
      console.log('⚠️  Could not retrieve job contacts');
      return [];
    }

  } catch (error) {
    console.error('Error getting job contacts:', error);
    return [];
  }
}

// Function to add site contact from job description info
async function addSiteContactFromJobDescription(jobUuid, siteContactName, siteContactPhone) {
  const contactInfo = {
    firstName: siteContactName.split(' ')[0] || 'Site',
    lastName: siteContactName.split(' ').slice(1).join(' ') || 'Contact',
    phone: siteContactPhone,
    mobile: siteContactPhone,
    type: 'SITE',
    isPrimary: false
  };

  return await addNewContactToJob(jobUuid, contactInfo);
}

// Command line usage
function showUsage() {
  console.log('👤 ServiceM8 Job Contact Management Tool');
  console.log('=======================================');
  console.log('');
  console.log('Usage:');
  console.log('  node add_job_contact.js <command> <job_uuid> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  list <job_uuid>                           - List existing job contacts');
  console.log('  add <job_uuid> <first> <last> <phone>     - Add new contact to job');
  console.log('  site <job_uuid> <name> <phone>            - Add site contact');
  console.log('');
  console.log('Examples:');
  console.log('  node add_job_contact.js list 1234-5678-uuid');
  console.log('  node add_job_contact.js add 1234-5678-uuid John Smith 0412345678');
  console.log('  node add_job_contact.js site 1234-5678-uuid "John Smith" 0412345678');
}

// Validate configuration
function validateConfiguration() {
  if (EMAIL === 'YOUR_SERVICEM8_EMAIL@example.com' || PASSWORD === 'YOUR_SERVICEM8_PASSWORD') {
    console.error('❌ ERROR: Please update your ServiceM8 credentials in this script');
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

  const command = args[0];
  const jobUuid = args[1];

  switch (command) {
    case 'list':
      getJobContacts(jobUuid);
      break;

    case 'add':
      if (args.length < 5) {
        console.error('❌ Missing parameters for add command');
        showUsage();
        process.exit(1);
      }
      const contactInfo = {
        firstName: args[2],
        lastName: args[3],
        phone: args[4],
        mobile: args[4],
        type: 'JOB'
      };
      addNewContactToJob(jobUuid, contactInfo);
      break;

    case 'site':
      if (args.length < 4) {
        console.error('❌ Missing parameters for site command');
        showUsage();
        process.exit(1);
      }
      addSiteContactFromJobDescription(jobUuid, args[2], args[3]);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      showUsage();
      process.exit(1);
  }
}

module.exports = {
  addNewContactToJob,
  linkContactToJob,
  getJobContacts,
  addSiteContactFromJobDescription
};