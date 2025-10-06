// Fixed test for JobContact API - using existing contact UUIDs
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test linking existing contact to a job
async function testJobContactLink(jobUuid, contactUuid, contactType) {
  try {
    console.log('👤 Testing JobContact Link');
    console.log('==========================');
    console.log(`🎯 Job UUID: ${jobUuid}`);
    console.log(`👤 Contact UUID: ${contactUuid}`);
    console.log(`📋 Contact Type: ${contactType}`);

    const jobContactData = {
      job_uuid: jobUuid,
      contact_uuid: contactUuid,
      type: contactType,
      active: 1
    };

    console.log('JobContact data:', JSON.stringify(jobContactData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobContactData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const jobContactUuid = response.headers.get('x-record-uuid');
      console.log(`✅ JobContact link created with UUID: ${jobContactUuid}`);

      // Verify the job contact link
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact/${jobContactUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const jobContact = await verifyResponse.json();
        console.log('✅ JobContact link verified:');
        console.log(`   Job UUID: ${jobContact.job_uuid}`);
        console.log(`   Contact UUID: ${jobContact.contact_uuid}`);
        console.log(`   Type: ${jobContact.type}`);
        console.log(`   Active: ${jobContact.active}`);
        console.log(`   Created: ${jobContact.edit_date}`);
      }

      return {
        success: true,
        jobContactUuid,
        jobUuid,
        contactUuid
      };

    } else {
      const errorText = await response.text();
      console.error(`❌ JobContact link failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }

  } catch (error) {
    console.error('\\n💥 JobContact link test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test creating new contact and linking to job
async function testNewJobContact(jobUuid, contactData) {
  try {
    console.log('\\n👤 Testing New JobContact Creation');
    console.log('===================================');
    console.log(`🎯 Job UUID: ${jobUuid}`);

    // Step 1: Create the contact first
    console.log('\\n📋 Step 1: Creating contact...');
    const contactResponse = await fetch(`${SERVICEM8_API_BASE}/contact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });

    console.log(`Contact creation status: ${contactResponse.status}`);

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      throw new Error(`Contact creation failed: ${errorText}`);
    }

    const contactUuid = contactResponse.headers.get('x-record-uuid');
    console.log(`✅ Contact created with UUID: ${contactUuid}`);

    // Step 2: Link contact to job
    console.log('\\n🔗 Step 2: Linking contact to job...');
    const linkResult = await testJobContactLink(jobUuid, contactUuid, 'JOB');

    return {
      success: linkResult.success,
      contactUuid,
      jobContactUuid: linkResult.jobContactUuid,
      error: linkResult.error
    };

  } catch (error) {
    console.error('\\n💥 New JobContact test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get contacts for a job with proper filtering
async function getJobContactsFiltered(jobUuid) {
  try {
    console.log(`\\n👥 Getting contacts for job ${jobUuid}...`);

    // Use $filter parameter for proper filtering
    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${jobUuid}'`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobContacts = await response.json();
      console.log(`✅ Found ${jobContacts.length} contacts for this job:`);

      for (const jobContact of jobContacts) {
        console.log(`   JobContact UUID: ${jobContact.uuid}`);
        console.log(`   Contact UUID: ${jobContact.contact_uuid}`);
        console.log(`   Type: ${jobContact.type}`);

        // Get contact details
        if (jobContact.contact_uuid) {
          try {
            const contactResponse = await fetch(`${SERVICEM8_API_BASE}/contact/${jobContact.contact_uuid}.json`, {
              headers: getAuthHeaders()
            });

            if (contactResponse.ok) {
              const contact = await contactResponse.json();
              console.log(`   Name: ${contact.first || ''} ${contact.last || ''}`);
              console.log(`   Phone: ${contact.mobile || contact.phone || 'N/A'}`);
              console.log(`   Email: ${contact.email || 'N/A'}`);
            }
          } catch (err) {
            console.log(`   Contact details: Unable to fetch`);
          }
        }
        console.log('');
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

// Main test function
async function runJobContactTests() {
  const jobUuid = '23b8965a-f742-4b7c-9b29-234d5af9535b'; // Job 1606

  // ETS Contact UUIDs
  const darrenContactUuid = '02bd5c3e-e688-4f38-b744-230febe1549d'; // Darren Siemsen
  const adminContactUuid = '0162c4eb-dd05-4df2-8a83-23184f9bc32d'; // Admin billing

  console.log('🧪 ServiceM8 JobContact API Testing (Fixed)');
  console.log('===========================================\\n');

  // Test 1: Link existing ETS contact (Darren) to job
  console.log('TEST 1: Link Existing ETS Contact');
  console.log('==================================');
  const linkResult1 = await testJobContactLink(jobUuid, darrenContactUuid, 'JOB');

  // Test 2: Link existing admin contact to job
  console.log('\\nTEST 2: Link Admin Contact');
  console.log('===========================');
  const linkResult2 = await testJobContactLink(jobUuid, adminContactUuid, 'BILLING');

  // Test 3: Create new site contact
  console.log('\\nTEST 3: Create New Site Contact');
  console.log('================================');
  const newContactData = {
    first: 'Sarah',
    last: 'Testing',
    mobile: '0423 456 789',
    email: 'sarah.testing@example.com',
    active: 1
  };
  const newContactResult = await testNewJobContact(jobUuid, newContactData);

  // Test 4: Get all contacts for the job with proper filtering
  console.log('\\nTEST 4: Retrieve Job Contacts (Filtered)');
  console.log('========================================');
  await getJobContactsFiltered(jobUuid);

  // Summary
  console.log('\\n🎯 JOBCONTACT API TEST SUMMARY');
  console.log('=============================');
  console.log(`✅ Link ETS Contact: ${linkResult1.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Link Admin Contact: ${linkResult2.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ New Site Contact: ${newContactResult.success ? 'SUCCESS' : 'FAILED'}`);

  if (linkResult1.success || linkResult2.success || newContactResult.success) {
    console.log('\\n🎉 JobContact functionality is working!');
    console.log('👤 Can link existing contacts to jobs');
    if (newContactResult.success) {
      console.log('🆕 Can create and link new contacts to jobs');
    }
  }
}

// Run the tests
runJobContactTests();