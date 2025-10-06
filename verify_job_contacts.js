// Verify job contacts are actually linked to the job
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function verifyJobContacts(jobUuid) {
  try {
    console.log(`🔍 Verifying contacts for Job ${jobUuid}`);
    console.log('='.repeat(50));

    // Method 1: Get JobContact records with proper filtering
    console.log('\n📋 Method 1: JobContact Records');
    console.log('-------------------------------');

    const jobContactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (jobContactResponse.ok) {
      const jobContacts = await jobContactResponse.json();
      console.log(`Found ${jobContacts.length} JobContact records:`);

      for (let i = 0; i < jobContacts.length; i++) {
        const jc = jobContacts[i];
        console.log(`\n${i + 1}. JobContact UUID: ${jc.uuid}`);
        console.log(`   Job UUID: ${jc.job_uuid}`);
        console.log(`   Contact UUID: ${jc.contact_uuid || 'MISSING'}`);
        console.log(`   Type: ${jc.type}`);
        console.log(`   Active: ${jc.active}`);
        console.log(`   Created: ${jc.edit_date}`);

        // Try to get contact details if contact_uuid exists
        if (jc.contact_uuid) {
          try {
            const contactResponse = await fetch(`${SERVICEM8_API_BASE}/contact/${jc.contact_uuid}.json`, {
              headers: getAuthHeaders()
            });

            if (contactResponse.ok) {
              const contact = await contactResponse.json();
              console.log(`   Contact Name: ${contact.first || ''} ${contact.last || ''}`);
              console.log(`   Contact Phone: ${contact.mobile || contact.phone || 'N/A'}`);
              console.log(`   Contact Email: ${contact.email || 'N/A'}`);
            } else {
              console.log(`   Contact Details: Failed to fetch (${contactResponse.status})`);
            }
          } catch (err) {
            console.log(`   Contact Details: Error - ${err.message}`);
          }
        }
      }
    } else {
      console.log(`❌ Failed to get JobContact records: ${jobContactResponse.status}`);
    }

    // Method 2: Check the job record itself
    console.log('\n📋 Method 2: Job Record Fields');
    console.log('------------------------------');

    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
      headers: getAuthHeaders()
    });

    if (jobResponse.ok) {
      const job = await jobResponse.json();
      console.log('Job contact-related fields:');
      console.log(`   contact_first: ${job.contact_first || 'NULL'}`);
      console.log(`   contact_last: ${job.contact_last || 'NULL'}`);
      console.log(`   contact_phone: ${job.contact_phone || 'NULL'}`);
      console.log(`   contact_email: ${job.contact_email || 'NULL'}`);
      console.log(`   billing_contact_first: ${job.billing_contact_first || 'NULL'}`);
      console.log(`   billing_contact_last: ${job.billing_contact_last || 'NULL'}`);
      console.log(`   job_contact_uuid: ${job.job_contact_uuid || 'NULL'}`);
      console.log(`   account_contact_uuid: ${job.account_contact_uuid || 'NULL'}`);
    }

    // Method 3: Try alternative endpoints
    console.log('\n📋 Method 3: Alternative Contact Endpoints');
    console.log('------------------------------------------');

    // Try getting contacts via job relationship
    const altResponse = await fetch(`${SERVICEM8_API_BASE}/contact.json?$filter=job_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (altResponse.ok) {
      const contacts = await altResponse.json();
      console.log(`Found ${contacts.length} contacts via alternative method`);
    } else {
      console.log(`Alternative method failed: ${altResponse.status}`);
    }

  } catch (error) {
    console.error('Error verifying job contacts:', error.message);
  }
}

// Check the job we just created
const jobUuid = 'f79e5390-029c-4c63-951a-234d528fe5eb'; // Job 1607
verifyJobContacts(jobUuid);