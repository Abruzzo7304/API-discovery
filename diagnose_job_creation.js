// Diagnostic script to check job creation issues
const { getAuthHeaders } = require('./config');
const ETS_UUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

async function diagnoseJobCreation() {
  console.log('🔍 DIAGNOSTIC: Job Creation Issues');
  console.log('====================================\n');

  try {
    // First, check if ETS exists
    console.log('1️⃣ Checking ETS company exists...');
    const etsResponse = await fetch(`https://api.servicem8.com/api_1.0/company/${ETS_UUID}.json`, {
      headers: getAuthHeaders()
    });

    if (etsResponse.ok) {
      const ets = await etsResponse.json();
      console.log(`✅ ETS found: ${ets.name}`);
      console.log(`   UUID: ${ets.uuid}`);
      console.log(`   Active: ${ets.active}`);
    } else {
      console.log('❌ ETS company not found!');
      return;
    }

    // Create a test site
    console.log('\n2️⃣ Creating test site under ETS...');
    const timestamp = Date.now();
    const siteData = {
      name: `Diagnostic Site ${timestamp}`,
      parent_company_uuid: ETS_UUID,
      address: '789 Test Ave, Brisbane QLD 4000',
      email: 'diagnostic@test.com',
      phone: '07 3000 9999',
      active: 1
    };

    console.log('   Site data:', JSON.stringify(siteData, null, 2));

    const siteResponse = await fetch('https://api.servicem8.com/api_1.0/company.json', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(siteData)
    });

    const siteResponseText = await siteResponse.text();
    console.log('   Response status:', siteResponse.status);

    let siteUUID;
    if (!siteResponseText.includes('<!DOCTYPE')) {
      try {
        const site = JSON.parse(siteResponseText);
        siteUUID = site.uuid;
        console.log(`   ✅ Site created with UUID: ${siteUUID}`);
      } catch (e) {
        console.log('   Response:', siteResponseText.substring(0, 200));
      }
    }

    // If no UUID from response, try to find the site
    if (!siteUUID) {
      console.log('   Searching for created site...');
      const searchResponse = await fetch(
        `https://api.servicem8.com/api_1.0/company.json?$filter=name eq '${siteData.name}'`,
        { headers: getAuthHeaders() }
      );
      const sites = await searchResponse.json();
      if (sites.length > 0) {
        siteUUID = sites[0].uuid;
        console.log(`   ✅ Found site: ${siteUUID}`);
        console.log(`   Parent UUID: ${sites[0].parent_company_uuid}`);
      }
    }

    if (!siteUUID) {
      console.log('❌ Failed to create site');
      return;
    }

    // Create a job
    console.log('\n3️⃣ Creating job for diagnostic site...');
    const jobData = {
      company_uuid: siteUUID,
      purchase_order_number: `DIAG-${timestamp}`,
      status: 'Work Order',
      job_address: '789 Test Ave, Brisbane QLD 4000',
      job_description: 'Diagnostic test job',
      work_done_description: 'Billing to ETS via Smart Contacts',
      active: 1
    };

    console.log('   Job data:', JSON.stringify(jobData, null, 2));

    const jobResponse = await fetch('https://api.servicem8.com/api_1.0/job.json', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobResponseText = await jobResponse.text();
    console.log('   Response status:', jobResponse.status);

    let jobUUID, jobNumber;
    if (!jobResponseText.includes('<!DOCTYPE')) {
      try {
        const job = JSON.parse(jobResponseText);
        jobUUID = job.uuid;
        jobNumber = job.generated_job_id;
        console.log(`   ✅ Job created: ${jobNumber} (${jobUUID})`);
      } catch (e) {
        console.log('   Response:', jobResponseText.substring(0, 200));
      }
    }

    // If no UUID, search for the job
    if (!jobUUID) {
      console.log('   Searching for created job...');
      const searchResponse = await fetch(
        `https://api.servicem8.com/api_1.0/job.json?$filter=company_uuid eq '${siteUUID}'&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );
      const jobs = await searchResponse.json();
      if (jobs.length > 0) {
        jobUUID = jobs[0].uuid;
        jobNumber = jobs[0].generated_job_id;
        console.log(`   ✅ Found job: ${jobNumber}`);
      }
    }

    // Check job details
    if (jobUUID) {
      console.log('\n4️⃣ Checking job details...');
      const jobCheckResponse = await fetch(
        `https://api.servicem8.com/api_1.0/job/${jobUUID}.json`,
        { headers: getAuthHeaders() }
      );
      const jobDetails = await jobCheckResponse.json();

      console.log(`   Job address: ${jobDetails.job_address}`);
      console.log(`   Billing address: ${jobDetails.billing_address}`);
      console.log(`   Are they the same? ${jobDetails.job_address === jobDetails.billing_address ? 'YES ⚠️' : 'NO ✅'}`);
      console.log(`   Company UUID: ${jobDetails.company_uuid}`);
    }

    // Try adding JobContact
    if (jobUUID) {
      console.log('\n5️⃣ Adding JobContact...');
      const contactData = {
        job_uuid: jobUUID,
        first: 'Test',
        last: 'Contact',
        email: 'test@contact.com',
        mobile: '0400 000 000',
        type: 'JOB',
        active: 1
      };

      console.log('   Contact data:', JSON.stringify(contactData, null, 2));

      const contactResponse = await fetch('https://api.servicem8.com/api_1.0/jobcontact.json', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contactData)
      });

      const contactResponseText = await contactResponse.text();
      console.log('   Response status:', contactResponse.status);

      if (!contactResponseText.includes('<!DOCTYPE')) {
        try {
          const contact = JSON.parse(contactResponseText);
          console.log('   ✅ Contact added:', contact.uuid);
        } catch (e) {
          console.log('   Response:', contactResponseText.substring(0, 200));
        }
      }

      // Check if contact was added
      console.log('   Checking JobContacts on job...');
      const checkContactsResponse = await fetch(
        `https://api.servicem8.com/api_1.0/jobcontact.json?$filter=job_uuid eq '${jobUUID}'`,
        { headers: getAuthHeaders() }
      );
      const contacts = await checkContactsResponse.json();
      console.log(`   Found ${contacts.length} contacts on job`);
      contacts.forEach(c => {
        console.log(`     - ${c.first} ${c.last} (${c.type})`);
      });
    }

    // Check CompanyContacts
    console.log('\n6️⃣ Adding CompanyContact to site...');
    const companyContactData = {
      company_uuid: siteUUID,
      first: 'Site',
      last: 'Manager',
      email: 'manager@site.com',
      mobile: '0411 111 111',
      type: 'JOB',
      is_primary_contact: 1,
      active: 1
    };

    console.log('   Company contact data:', JSON.stringify(companyContactData, null, 2));

    const companyContactResponse = await fetch('https://api.servicem8.com/api_1.0/companycontact.json', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(companyContactData)
    });

    const companyContactText = await companyContactResponse.text();
    console.log('   Response status:', companyContactResponse.status);

    if (!companyContactText.includes('<!DOCTYPE')) {
      try {
        const cc = JSON.parse(companyContactText);
        console.log('   ✅ Company contact added:', cc.uuid);
      } catch (e) {
        console.log('   Response:', companyContactText.substring(0, 200));
      }
    }

    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('======================');
    console.log(`Site created: ${siteUUID ? '✅' : '❌'}`);
    console.log(`Job created: ${jobUUID ? '✅' : '❌'}`);
    console.log(`Job billing = job address: ${jobUUID ? '⚠️ YES (this is the problem!)' : 'N/A'}`);
    console.log('\nNOTE: The billing_address field CANNOT be set differently from job_address');
    console.log('      at job creation time. This is a ServiceM8 limitation.');
    console.log('      Smart Contacts should handle billing routing to ETS automatically.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnoseJobCreation();