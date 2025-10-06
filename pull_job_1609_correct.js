// Pull the correct Job 1609 by UUID
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Pull data for the correct Job 1609
async function pullCorrectJob1609() {
  console.log('📊 PULLING THE CORRECT JOB 1609');
  console.log('================================\n');

  // Use the correct UUID we found
  const correctUUID = 'e194b965-7fe1-4194-a032-234d5a09e45b';
  console.log(`Using UUID: ${correctUUID}\n`);

  try {
    // 1. Get the job by UUID directly
    console.log('1️⃣  FETCHING JOB BY UUID...');
    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job/${correctUUID}.json`, {
      headers: getAuthHeaders()
    });

    if (!jobResponse.ok) {
      console.log(`❌ Failed to fetch job: ${jobResponse.status}`);

      // Try searching by job number as backup
      console.log('\n🔄 Trying to search by job number 1609...');
      const searchResponse = await fetch(`${SERVICEM8_API_BASE}/job.json?generated_job_id=1609`, {
        headers: getAuthHeaders()
      });

      if (searchResponse.ok) {
        const jobs = await searchResponse.json();
        if (jobs.length > 0) {
          console.log('✅ Found job via search!\n');
          processJob(jobs[0]);
        } else {
          console.log('❌ No job found with number 1609');
        }
      }
      return;
    }

    const job = await jobResponse.json();
    console.log('✅ Job found!\n');

    await processJob(job);

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

async function processJob(job) {
  // Display all job fields
  console.log('📋 COMPLETE JOB DATA:');
  console.log('====================');
  Object.keys(job).forEach(key => {
    const value = job[key];
    if (value !== null && value !== '' && value !== undefined) {
      console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    }
  });

  console.log('\n📍 KEY INFORMATION SUMMARY:');
  console.log('===========================');
  console.log(`Job Number: ${job.generated_job_id}`);
  console.log(`UUID: ${job.uuid}`);
  console.log(`Status: ${job.status}`);
  console.log(`Active: ${job.active === 1 ? 'Yes' : 'No'}`);
  console.log(`Created: ${job.date}`);
  console.log(`Company UUID: ${job.company_uuid}`);
  console.log(`Company: ${job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb' ? 'Emergency Trade Services (ETS)' : 'Other Company'}`);
  console.log(`Purchase Order: ${job.purchase_order_number || 'None'}`);
  console.log(`Address: ${job.job_address || 'No address'}`);
  console.log(`Category UUID: ${job.category_uuid || 'None'}`);
  console.log(`Queue UUID: ${job.queue_uuid || 'None'}`);
  console.log(`Network Request: ${job.active_network_request_uuid || 'None'}`);
  console.log(`Badges: ${job.badges || 'None'}`);

  if (job.job_description) {
    console.log(`\n📝 JOB DESCRIPTION:`);
    console.log('==================');
    console.log(job.job_description);
  }

  // Get job contacts
  console.log('\n2️⃣  FETCHING JOB CONTACTS...');
  try {
    const contactsResponse = await fetch(
      `${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${job.uuid}'`,
      { headers: getAuthHeaders() }
    );

    if (contactsResponse.ok) {
      const contacts = await contactsResponse.json();
      if (contacts.length > 0) {
        console.log(`✅ Found ${contacts.length} contact(s):\n`);
        contacts.forEach((contact, index) => {
          console.log(`Contact ${index + 1}:`);
          console.log(`   Type: ${contact.type}`);
          console.log(`   Name: ${contact.first} ${contact.last || ''}`);
          console.log(`   Email: ${contact.email || 'None'}`);
          console.log(`   Mobile: ${contact.mobile || 'None'}`);
          console.log(`   Company Contact UUID: ${contact.company_contact_uuid || 'None'}`);
          console.log('');
        });
      } else {
        console.log('No contacts found for this job');
      }
    }
  } catch (error) {
    console.log(`Error fetching contacts: ${error.message}`);
  }

  // Get company details
  console.log('\n3️⃣  FETCHING COMPANY DETAILS...');
  try {
    const companyResponse = await fetch(
      `${SERVICEM8_API_BASE}/company/${job.company_uuid}.json`,
      { headers: getAuthHeaders() }
    );

    if (companyResponse.ok) {
      const company = await companyResponse.json();
      console.log('✅ Company details:');
      console.log(`   Name: ${company.name}`);
      console.log(`   UUID: ${company.uuid}`);
      console.log(`   Email: ${company.email || 'None'}`);
      console.log(`   Phone: ${company.phone || 'None'}`);
      console.log(`   Mobile: ${company.mobile || 'None'}`);
      console.log(`   Address: ${company.billing_address || 'None'}`);
      console.log(`   Active: ${company.active === 1 ? 'Yes' : 'No'}`);
    }
  } catch (error) {
    console.log(`Error fetching company: ${error.message}`);
  }

  console.log('\n✅ DATA PULL COMPLETE!');
}

// Run the pull
pullCorrectJob1609();