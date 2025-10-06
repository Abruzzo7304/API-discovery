// Test JobContact API for linking contacts to jobs
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test adding a contact to a job
async function testJobContact(jobUuid, contactData) {
  try {
    console.log('👤 Testing JobContact API');
    console.log('=========================');
    console.log(`🎯 Job UUID: ${jobUuid}`);
    console.log('Contact data:', JSON.stringify(contactData, null, 2));

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });

    console.log(`Response status: ${response.status}`);

    if (response.ok) {
      const jobContactUuid = response.headers.get('x-record-uuid');
      console.log(`✅ JobContact created with UUID: ${jobContactUuid}`);

      // Verify the job contact
      const verifyResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact/${jobContactUuid}.json`, {
        headers: getAuthHeaders()
      });

      if (verifyResponse.ok) {
        const jobContact = await verifyResponse.json();
        console.log('✅ JobContact verified:');
        console.log(`   Name: ${jobContact.first} ${jobContact.last}`);
        console.log(`   Phone: ${jobContact.mobile || jobContact.phone}`);
        console.log(`   Email: ${jobContact.email}`);
        console.log(`   Type: ${jobContact.type}`);
        console.log(`   Job UUID: ${jobContact.job_uuid}`);
        console.log(`   Created: ${jobContact.edit_date}`);
      }

      return {
        success: true,
        jobContactUuid,
        contactData
      };

    } else {
      const errorText = await response.text();
      console.error(`❌ JobContact creation failed: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return {
        success: false,
        error: errorText
      };
    }

  } catch (error) {
    console.error('\n💥 JobContact test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get all contacts for a job
async function getJobContacts(jobUuid) {
  try {
    console.log(`\n👥 Getting all contacts for job ${jobUuid}...`);

    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?job_uuid=${jobUuid}`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const contacts = await response.json();
      console.log(`✅ Found ${contacts.length} contacts for this job:`);

      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.first} ${contact.last}`);
        console.log(`      Phone: ${contact.mobile || contact.phone || 'N/A'}`);
        console.log(`      Email: ${contact.email || 'N/A'}`);
        console.log(`      Type: ${contact.type}`);
        console.log(`      UUID: ${contact.uuid}`);
        console.log('');
      });

      return contacts;
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

  console.log('🧪 ServiceM8 JobContact API Testing');
  console.log('===================================\n');

  // Test 1: Add site contact
  console.log('TEST 1: Site Contact');
  console.log('====================');
  const siteContactData = {
    job_uuid: jobUuid,
    first: 'Sarah',
    last: 'Testing',
    mobile: '0423 456 789',
    email: 'sarah.testing@example.com',
    type: 'Site Contact',
    active: 1
  };

  const siteContactResult = await testJobContact(jobUuid, siteContactData);

  // Test 2: Add account contact
  console.log('\nTEST 2: Account Contact');
  console.log('=======================');
  const accountContactData = {
    job_uuid: jobUuid,
    first: 'David',
    last: 'Manager',
    mobile: '0412 345 678',
    email: 'david.manager@example.com',
    type: 'Account Contact',
    active: 1
  };

  const accountContactResult = await testJobContact(jobUuid, accountContactData);

  // Test 3: Get all contacts for the job
  console.log('\nTEST 3: Retrieve All Job Contacts');
  console.log('=================================');
  await getJobContacts(jobUuid);

  // Summary
  console.log('\n🎯 JOBCONTACT API TEST SUMMARY');
  console.log('=============================');
  console.log(`✅ Site Contact: ${siteContactResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Account Contact: ${accountContactResult.success ? 'SUCCESS' : 'FAILED'}`);

  if (siteContactResult.success && accountContactResult.success) {
    console.log('\n🎉 JobContact API is working perfectly!');
    console.log('👤 Can add site contacts to jobs');
    console.log('📞 Can add account contacts to jobs');
  }
}

// Run the tests
runJobContactTests();