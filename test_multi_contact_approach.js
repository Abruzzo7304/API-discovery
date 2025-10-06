// Test multiple contact roles approach for ETS jobs
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Create job with multiple contact roles
async function createJobWithMultipleContacts() {
  console.log('🏗️  TESTING MULTI-CONTACT JOB APPROACH');
  console.log('======================================');
  console.log('Creating ETS job with different contact roles:\n');

  // Step 1: Create the job under ETS company
  const jobData = {
    // ETS Company UUID - this makes ETS the job owner
    company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb',

    // Job details from ETS
    purchase_order_number: 'ETS-MULTI-CONTACT-TEST-001',
    status: 'Work Order',
    job_address: '123 Test Site Street, Brisbane QLD 4000',
    job_description: `Multi-contact test job - electrical maintenance

Site Contact: John Smith (Site Manager)
Contact Phone: 0412 345 678
Site Address: 123 Test Site Street, Brisbane QLD 4000

Work Required: General electrical maintenance and safety check

Approved up to: $500 + GST
For any changes please contact ETS office`,

    category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
    badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
    active: 1
    // Removed source and billing_address as they cause issues
  };

  console.log('📝 Step 1: Creating job under ETS company...');

  try {
    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      console.log(`❌ Failed to create job: ${errorText}`);
      return;
    }

    const responseText = await jobResponse.text();
    let job;

    // Check if response is HTML (even with 200 OK, job might be created)
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.log(`⚠️  HTML response received - checking if job was still created...`);

      // Get the latest job to see if it was created
      const checkResponse = await fetch(
        `${SERVICEM8_API_BASE}/job.json?company_uuid=971d644f-d6a8-479c-a901-1f9b0425d7bb&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );

      if (checkResponse.ok) {
        const jobs = await checkResponse.json();
        if (jobs.length > 0) {
          job = jobs[0];
          // Check if this is our job by looking at the purchase order
          if (job.purchase_order_number === 'ETS-MULTI-CONTACT-TEST-001') {
            console.log('✅ Job was created despite HTML response!');
          } else {
            console.log('⚠️  Latest job is not our test job');
            return;
          }
        }
      }
    } else {
      try {
        job = JSON.parse(responseText);
      } catch (e) {
        console.log(`❌ Failed to parse JSON: ${responseText.substring(0, 200)}`);
        return;
      }
    }
    console.log(`✅ Job created: ${job.generated_job_id}`);
    console.log(`   UUID: ${job.uuid}\n`);

    // Step 2: Add different contact roles
    console.log('📋 Step 2: Adding contact roles...\n');

    // Job Contact - Site Contact (who ETS deals with on-site)
    const jobContact = {
      job_uuid: job.uuid,
      first: 'John',
      last: 'Smith',
      email: 'john.smith@testsite.com',
      mobile: '0412 345 678',
      type: 'JOB', // Job contact type
      active: 1
    };

    console.log('👤 Adding Job Contact (Site Contact):');
    const jobContactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobContact)
    });

    if (jobContactResponse.ok) {
      console.log('   ✅ Added: John Smith (Site Contact)');
    } else {
      console.log('   ❌ Failed to add job contact');
    }

    // Property Contact - Sustaine contact
    const propertyContact = {
      job_uuid: job.uuid,
      first: 'Sustaine',
      last: 'Electrical',
      email: 'service@sustaineelectrical.com.au',
      mobile: '0400 000 000',
      type: 'PROPERTY', // Property contact type
      active: 1
    };

    console.log('🏢 Adding Property Contact (Sustaine):');
    const propertyContactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(propertyContact)
    });

    if (propertyContactResponse.ok) {
      console.log('   ✅ Added: Sustaine Electrical (Property Contact)');
    } else {
      console.log('   ❌ Failed to add property contact');
    }

    // Invoice Contact - Sustaine Invoicing
    const invoiceContact = {
      job_uuid: job.uuid,
      first: 'Accounts',
      last: 'Payable',
      email: 'accounts@sustaineelectrical.com.au',
      mobile: '0400 000 001',
      type: 'INVOICE', // Invoice contact type
      active: 1
    };

    console.log('💰 Adding Invoice Contact (Sustaine Invoicing):');
    const invoiceContactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invoiceContact)
    });

    if (invoiceContactResponse.ok) {
      console.log('   ✅ Added: Sustaine Accounts (Invoice Contact)\n');
    } else {
      console.log('   ❌ Failed to add invoice contact\n');
    }

    // Step 3: Verify all contacts
    console.log('🔍 Step 3: Verifying job contacts...\n');

    const verifyResponse = await fetch(
      `${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${job.uuid}'`,
      { headers: getAuthHeaders() }
    );

    if (verifyResponse.ok) {
      const contacts = await verifyResponse.json();
      console.log(`📊 Total contacts on job: ${contacts.length}\n`);

      contacts.forEach(contact => {
        console.log(`Contact Type: ${contact.type}`);
        console.log(`   Name: ${contact.first} ${contact.last}`);
        console.log(`   Email: ${contact.email}`);
        console.log(`   Mobile: ${contact.mobile}`);
        console.log('');
      });
    }

    // Analysis
    console.log('📊 ANALYSIS OF THIS APPROACH');
    console.log('============================');
    console.log('✅ ADVANTAGES:');
    console.log('   • ETS maintains job ownership and control');
    console.log('   • Clear separation of contact responsibilities');
    console.log('   • Site contact for on-site coordination');
    console.log('   • Sustaine contacts for service delivery and invoicing');
    console.log('   • All trackable within single job record');
    console.log('');
    console.log('⚠️  CONSIDERATIONS:');
    console.log('   • Invoicing: Job is owned by ETS, not Sustaine');
    console.log('   • Reporting: Jobs appear under ETS company');
    console.log('   • Permissions: Sustaine may need access to view/update');
    console.log('   • Workflow: May need custom fields to track who does the work');
    console.log('');
    console.log('💡 TRACKING SUGGESTIONS:');
    console.log('   • Use job badges to identify Sustaine-assigned work');
    console.log('   • Add custom fields for actual service provider');
    console.log('   • Use job notes to track assignment details');
    console.log('   • Consider queue assignment for workflow management');

    return job.uuid;

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Test the approach
createJobWithMultipleContacts();