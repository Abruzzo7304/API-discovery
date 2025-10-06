// Debug contact linking issues
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function debugContactIssues() {
  console.log('🔍 DEBUG: Contact Linking Issues');
  console.log('================================\n');

  // Test 1: Verify the contact UUIDs exist
  console.log('TEST 1: Verify Contact UUIDs Exist');
  console.log('-----------------------------------');

  const testContacts = [
    { name: 'Darren Siemsen', uuid: '02bd5c3e-e688-4f38-b744-230febe1549d' },
    { name: 'Admin', uuid: '0162c4eb-dd05-4df2-8a83-23184f9bc32d' }
  ];

  for (const contact of testContacts) {
    try {
      console.log(`\nChecking ${contact.name} (${contact.uuid})...`);

      const response = await fetch(`${SERVICEM8_API_BASE}/contact/${contact.uuid}.json`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const contactData = await response.json();
        console.log(`✅ Contact found:`);
        console.log(`   Name: ${contactData.first || ''} ${contactData.last || ''}`);
        console.log(`   Phone: ${contactData.mobile || contactData.phone || 'N/A'}`);
        console.log(`   Email: ${contactData.email || 'N/A'}`);
        console.log(`   Active: ${contactData.active}`);
      } else {
        console.log(`❌ Contact not found: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`💥 Error checking contact: ${error.message}`);
    }
  }

  // Test 2: Try creating JobContact with different structure
  console.log('\n\nTEST 2: Try Alternative JobContact Structure');
  console.log('---------------------------------------------');

  const jobUuid = 'f79e5390-029c-4c63-951a-234d528fe5eb'; // Job 1607
  const darrenUuid = '02bd5c3e-e688-4f38-b744-230febe1549d';

  // Method A: Try with contact_uuid field
  console.log('\nMethod A: Using contact_uuid field');
  const methodAData = {
    job_uuid: jobUuid,
    contact_uuid: darrenUuid,
    type: 'JOB',
    active: 1
  };

  console.log('Data:', JSON.stringify(methodAData, null, 2));

  try {
    const responseA = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(methodAData)
    });

    console.log(`Response: ${responseA.status}`);
    if (!responseA.ok) {
      const errorText = await responseA.text();
      console.log(`Error: ${errorText.substring(0, 200)}...`);
    } else {
      const jobContactUuid = responseA.headers.get('x-record-uuid');
      console.log(`✅ JobContact created: ${jobContactUuid}`);
    }
  } catch (error) {
    console.log(`💥 Method A failed: ${error.message}`);
  }

  // Method B: Try with different field names
  console.log('\nMethod B: Try different field structure');
  const methodBData = {
    job_uuid: jobUuid,
    related_object_uuid: darrenUuid,
    type: 'JOB',
    active: 1
  };

  console.log('Data:', JSON.stringify(methodBData, null, 2));

  try {
    const responseB = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(methodBData)
    });

    console.log(`Response: ${responseB.status}`);
    if (!responseB.ok) {
      const errorText = await responseB.text();
      console.log(`Error: ${errorText.substring(0, 200)}...`);
    } else {
      const jobContactUuid = responseB.headers.get('x-record-uuid');
      console.log(`✅ JobContact created: ${jobContactUuid}`);
    }
  } catch (error) {
    console.log(`💥 Method B failed: ${error.message}`);
  }

  // Test 3: Check what JobContact structure is expected
  console.log('\n\nTEST 3: Examine Existing JobContact Structure');
  console.log('----------------------------------------------');

  try {
    // Get a few existing JobContact records to see their structure
    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?$top=3`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobContacts = await response.json();
      console.log(`Found ${jobContacts.length} existing JobContact records:`);

      jobContacts.forEach((jc, index) => {
        console.log(`\n${index + 1}. JobContact UUID: ${jc.uuid}`);
        console.log(`   All fields:`, JSON.stringify(jc, null, 2));
      });
    } else {
      console.log(`Failed to get existing JobContact records: ${response.status}`);
    }
  } catch (error) {
    console.log(`Error examining JobContact structure: ${error.message}`);
  }
}

debugContactIssues();