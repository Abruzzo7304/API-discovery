// Check job 1625 details and contacts
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function checkJob1625() {
  console.log('🔍 CHECKING JOB 1625 DETAILS');
  console.log('============================\n');

  try {
    // First find the job
    console.log('📋 Searching for Job 1625...\n');
    
    const searchResponse = await fetch(
      `${SERVICEM8_API_BASE}/job.json?$filter=generated_job_id eq '1625'`,
      { headers: getAuthHeaders() }
    );

    if (!searchResponse.ok) {
      console.log('❌ Failed to search for job');
      return;
    }

    const jobs = await searchResponse.json();
    
    if (jobs.length === 0) {
      console.log('❌ Job 1625 not found');
      return;
    }

    const job = jobs[0];
    const jobUUID = job.uuid;

    console.log('✅ FOUND JOB 1625');
    console.log('================\n');
    
    console.log('📍 ADDRESS DETAILS:');
    console.log(`   Job Address: ${job.job_address}`);
    console.log(`   Billing Address: ${job.billing_address}`);
    console.log(`   Addresses Match? ${job.job_address === job.billing_address ? '❌ YES' : '✅ NO (Different!)'}\n`);

    console.log('🏢 COMPANY DETAILS:');
    console.log(`   Company UUID: ${job.company_uuid}`);
    
    // Get company details
    if (job.company_uuid) {
      const companyResponse = await fetch(
        `${SERVICEM8_API_BASE}/company/${job.company_uuid}.json`,
        { headers: getAuthHeaders() }
      );
      
      if (companyResponse.ok) {
        const company = await companyResponse.json();
        console.log(`   Company Name: ${company.name}`);
        console.log(`   Parent UUID: ${company.parent_company_uuid || 'None (Head Office)'}`);
        
        if (company.parent_company_uuid) {
          const parentResponse = await fetch(
            `${SERVICEM8_API_BASE}/company/${company.parent_company_uuid}.json`,
            { headers: getAuthHeaders() }
          );
          
          if (parentResponse.ok) {
            const parent = await parentResponse.json();
            console.log(`   Parent Company: ${parent.name}`);
          }
        }
      }
    }

    console.log('\n📋 JOB DETAILS:');
    console.log(`   Job Number: ${job.generated_job_id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   PO Number: ${job.purchase_order_number || 'None'}`);
    console.log(`   Category: ${job.category_uuid || 'None'}`);
    console.log(`   Badges: ${job.badges || 'None'}`);

    // Check for JobContacts
    console.log('\n👥 CHECKING JOBCONTACTS...');
    
    const contactsResponse = await fetch(
      `${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${jobUUID}'`,
      { headers: getAuthHeaders() }
    );

    let contacts = [];
    if (!contactsResponse.ok) {
      console.log('❌ Failed to fetch job contacts');
    } else {
      contacts = await contactsResponse.json();

      if (contacts.length === 0) {
        console.log('\n❌ NO JOB CONTACTS FOUND!');
        console.log('   This job has no contacts attached\n');
      } else {
        console.log(`\n✅ Found ${contacts.length} contact(s):\n`);

        contacts.forEach((contact, index) => {
          console.log(`   Contact ${index + 1}:`);
          console.log(`   - Name: ${contact.first || '[Empty]'} ${contact.last || '[Empty]'}`);
          console.log(`   - Type: ${contact.type}`);
          console.log(`   - Mobile: ${contact.mobile || 'None'}`);
          console.log(`   - Email: ${contact.email || 'None'}`);
          console.log(`   - UUID: ${contact.uuid}`);
          console.log('');
        });
      }
    }

    // Check company contacts
    console.log('🏢 CHECKING COMPANY CONTACTS...');
    
    const companyContactsResponse = await fetch(
      `${SERVICEM8_API_BASE}/companycontact.json?$filter=company_uuid eq '${job.company_uuid}'`,
      { headers: getAuthHeaders() }
    );

    if (companyContactsResponse.ok) {
      const companyContacts = await companyContactsResponse.json();
      
      if (companyContacts.length === 0) {
        console.log('   No company contacts found\n');
      } else {
        console.log(`   Found ${companyContacts.length} company contact(s)`);
        companyContacts.forEach(contact => {
          console.log(`   - ${contact.first} ${contact.last} (${contact.type || 'No type'})`);
        });
        console.log('');
      }
    }

    // Analyze the issue
    console.log('🔍 ANALYSIS:');
    console.log('============');
    
    if (job.job_address !== job.billing_address) {
      console.log('✅ SUCCESS: Addresses are different!');
      console.log('   This suggests job was created through Smart Contacts structure');
      console.log('   where site has different billing address from job location\n');
    }
    
    if (contacts.length === 0) {
      console.log('⚠️  ISSUE: No JobContacts attached');
      console.log('   Possible reasons:');
      console.log('   1. JobContacts were not added after job creation');
      console.log('   2. API calls to add contacts failed silently');
      console.log('   3. Contacts may have been added but with wrong job_uuid\n');
      
      console.log('💡 SOLUTION:');
      console.log('   Need to add JobContacts AFTER job creation using:');
      console.log('   - Type "JOB" for Site Contacts');
      console.log('   - Type "Property Manager" for property managers');
      console.log('   - Type "BILLING" for billing contacts\n');
    }

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run check
checkJob1625();