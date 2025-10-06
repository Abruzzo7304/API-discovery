// Test if jobs inherit contacts from Smart Contacts structure
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

async function testSmartContactsInheritance() {
  console.log('🔍 TESTING SMART CONTACTS INHERITANCE');
  console.log('=====================================\n');

  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  try {
    // Step 1: Create a site with a company contact
    console.log('1️⃣  CREATING TEST SITE WITH CONTACT...\n');

    const siteData = {
      name: 'TEST - Contact Inheritance Site',
      parent_company_uuid: etsUUID,
      billing_address: 'Test Billing Address',
      address: '123 Test Street, Test City QLD 4000',
      email: 'test@example.com',
      phone: '1300 000 000',
      active: 1
    };

    const siteResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(siteData)
    });

    let siteUUID;
    const siteText = await siteResponse.text();

    if (siteText.includes('<!DOCTYPE')) {
      // Check if created
      const checkSite = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'TEST - Contact Inheritance Site'`,
        { headers: getAuthHeaders() }
      );
      if (checkSite.ok) {
        const sites = await checkSite.json();
        if (sites.length > 0) {
          siteUUID = sites[0].uuid;
          console.log(`✅ Site created: ${siteUUID}\n`);
        }
      }
    } else {
      const site = JSON.parse(siteText);
      siteUUID = site.uuid;
      console.log(`✅ Site created: ${siteUUID}\n`);
    }

    if (!siteUUID) {
      console.log('❌ Failed to create site');
      return;
    }

    // Step 2: Add company contact to the site
    console.log('2️⃣  ADDING COMPANY CONTACT TO SITE...\n');

    const companyContact = {
      company_uuid: siteUUID,
      first: 'Jane',
      last: 'Site Manager',
      email: 'jane.manager@test.com',
      mobile: '0400 111 222',
      type: 'JOB',
      is_primary_contact: 1,
      active: 1
    };

    console.log('👤 Company Contact:');
    console.log(`   Name: ${companyContact.first} ${companyContact.last}`);
    console.log(`   Role: Primary Site Contact\n`);

    const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(companyContact)
    });

    if (contactResponse.ok) {
      console.log('✅ Company contact added\n');
    }

    // Step 3: Create a job WITHOUT adding any JobContacts
    console.log('3️⃣  CREATING JOB (NO JOBCONTACTS)...\n');

    const jobData = {
      company_uuid: siteUUID,
      status: 'Work Order',
      job_address: '123 Test Street, Test City QLD 4000',
      job_description: 'Test job to check contact inheritance',
      active: 1
    };

    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    let jobUUID, jobNumber;
    const jobText = await jobResponse.text();

    if (jobText.includes('<!DOCTYPE')) {
      const checkJob = await fetch(
        `${SERVICEM8_API_BASE}/job.json?company_uuid=${siteUUID}&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );
      if (checkJob.ok) {
        const jobs = await checkJob.json();
        if (jobs.length > 0) {
          jobUUID = jobs[0].uuid;
          jobNumber = jobs[0].generated_job_id;
        }
      }
    } else {
      const job = JSON.parse(jobText);
      jobUUID = job.uuid;
      jobNumber = job.generated_job_id;
    }

    if (!jobUUID) {
      console.log('❌ Failed to create job');
      // Clean up
      await fetch(`${SERVICEM8_API_BASE}/company/${siteUUID}.json`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return;
    }

    console.log(`✅ Job created: ${jobNumber}\n`);

    // Step 4: Check what contacts the job has
    console.log('4️⃣  CHECKING JOB CONTACTS...\n');

    // Get job details
    const jobDetailsResponse = await fetch(
      `${SERVICEM8_API_BASE}/job/${jobUUID}.json`,
      { headers: getAuthHeaders() }
    );

    if (jobDetailsResponse.ok) {
      const job = await jobDetailsResponse.json();
      console.log('📋 Job Details:');
      console.log(`   Company UUID: ${job.company_uuid}`);
      console.log(`   Company Name: ${job.company_name || 'N/A'}`);
      console.log(`   Contact: ${job.contact_first || ''} ${job.contact_last || ''}`);
      console.log(`   Contact Email: ${job.contact_email || 'N/A'}`);
      console.log(`   Contact Mobile: ${job.contact_mobile || 'N/A'}\n`);
    }

    // Check JobContacts
    const jobContactsResponse = await fetch(
      `${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${jobUUID}'`,
      { headers: getAuthHeaders() }
    );

    if (jobContactsResponse.ok) {
      const jobContacts = await jobContactsResponse.json();
      
      if (jobContacts.length === 0) {
        console.log('📊 JobContacts: NONE\n');
        console.log('⚠️  No JobContact records created automatically\n');
      } else {
        console.log(`📊 JobContacts: ${jobContacts.length} found\n`);
        jobContacts.forEach(contact => {
          console.log(`   - ${contact.first} ${contact.last} (Type: ${contact.type})`);
        });
      }
    }

    // Step 5: Clean up
    console.log('5️⃣  CLEANING UP...\n');

    // Delete job
    await fetch(`${SERVICEM8_API_BASE}/job/${jobUUID}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    console.log('✅ Test job deleted');

    // Delete site
    await fetch(`${SERVICEM8_API_BASE}/company/${siteUUID}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    console.log('✅ Test site deleted\n');

    // Analysis
    console.log('📈 ANALYSIS:');
    console.log('============');
    console.log('1. Company contacts are created at the SITE level');
    console.log('2. Jobs may show contact info in job fields (contact_first, contact_email, etc.)');
    console.log('3. JobContact records are separate and must be explicitly created');
    console.log('4. Smart Contacts provides the hierarchy but contacts need explicit linking');
    console.log('\n💡 RECOMMENDATION:');
    console.log('- Add Site Contact as CompanyContact (at site level)');
    console.log('- Only add JobContacts for additional people specific to that job');
    console.log('- This avoids confusion about who is the site contact');

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run test
testSmartContactsInheritance();