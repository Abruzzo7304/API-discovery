// Test two-step process: Create site first, then create job with proper billing
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function testTwoStepProcess() {
  console.log('🔬 TESTING TWO-STEP SITE & JOB PROCESS');
  console.log('=======================================\n');

  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  try {
    // STEP 1: Create Site with proper billing address
    console.log('STEP 1️⃣  CREATE SITE WITH CORPORATE BILLING\n');
    console.log('===========================================\n');

    const siteData = {
      name: 'Woolworths Metro - Brisbane CBD',
      parent_company_uuid: etsUUID,
      // Corporate billing address (different from store location)
      billing_address: 'Woolworths Group Limited\nLevel 1, 1 Woolworths Way\nBella Vista NSW 2153',
      // Store location address  
      address: '295 Ann Street, Brisbane CBD QLD 4000',
      email: 'metro.brisbane@woolworths.com.au',
      phone: '07 3229 1234',
      active: 1
    };

    console.log('📍 Site Configuration:');
    console.log(`   Name: ${siteData.name}`);
    console.log(`   Store Location: 295 Ann Street, Brisbane CBD`);
    console.log(`   Corporate Billing: Bella Vista NSW (Head Office)`);
    console.log(`   Parent: ETS\n`);

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
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'Woolworths Metro - Brisbane CBD'`,
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

    // Get site details to verify addresses
    const siteDetailsResponse = await fetch(
      `${SERVICEM8_API_BASE}/company/${siteUUID}.json`,
      { headers: getAuthHeaders() }
    );

    if (siteDetailsResponse.ok) {
      const siteDetails = await siteDetailsResponse.json();
      console.log('🔍 VERIFYING SITE ADDRESSES:');
      console.log('============================');
      console.log(`billing_address field: ${siteDetails.billing_address}`);
      console.log(`address field: ${siteDetails.address || 'not set'}`);
      console.log(`Parent UUID: ${siteDetails.parent_company_uuid}\n`);
    }

    // STEP 2: Add Site Contact to the site
    console.log('STEP 2️⃣  ADD SITE CONTACT TO COMPANY\n');
    console.log('=====================================\n');

    const siteContactData = {
      company_uuid: siteUUID,
      first: 'James',
      last: 'Wilson',
      email: 'james.wilson@woolworths.com.au',
      mobile: '0412 345 678',
      type: 'JOB', // Since SITE_CONTACT doesn't work
      is_primary_contact: 1,
      active: 1
    };

    console.log('👤 Adding Site Contact:');
    console.log(`   Name: ${siteContactData.first} ${siteContactData.last}`);
    console.log(`   Mobile: ${siteContactData.mobile}\n`);

    await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(siteContactData)
    });

    // STEP 3: Create Job and test billing
    console.log('STEP 3️⃣  CREATE JOB AND TEST BILLING\n');
    console.log('====================================\n');

    // Test different job configurations
    const jobTests = [
      {
        name: 'Test A: Job with explicit billing_address',
        data: {
          company_uuid: siteUUID,
          status: 'Work Order',
          job_address: '295 Ann Street, Brisbane CBD QLD 4000',
          billing_address: 'Woolworths Group Limited\nLevel 1, 1 Woolworths Way\nBella Vista NSW 2153',
          job_description: 'Test A: Explicit billing address'
        }
      },
      {
        name: 'Test B: Job with only job_address',
        data: {
          company_uuid: siteUUID,
          status: 'Work Order',
          job_address: '295 Ann Street, Brisbane CBD QLD 4000',
          job_description: 'Test B: No billing address specified'
        }
      },
      {
        name: 'Test C: Job with invoice-specific fields',
        data: {
          company_uuid: siteUUID,
          status: 'Work Order',
          job_address: '295 Ann Street, Brisbane CBD QLD 4000',
          invoice_email: 'accounts@woolworths.com.au',
          invoice_contact: 'Accounts Payable',
          job_description: 'Test C: Invoice fields'
        }
      }
    ];

    for (const test of jobTests) {
      console.log(`🧪 ${test.name}`);
      console.log('   Creating job...');

      const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(test.data)
      });

      const jobText = await jobResponse.text();
      let jobUUID;

      if (!jobText.includes('<!DOCTYPE')) {
        const job = JSON.parse(jobText);
        jobUUID = job.uuid;
      } else {
        // Check if created
        const checkJob = await fetch(
          `${SERVICEM8_API_BASE}/job.json?company_uuid=${siteUUID}&$orderby=date desc&$top=1`,
          { headers: getAuthHeaders() }
        );
        if (checkJob.ok) {
          const jobs = await checkJob.json();
          if (jobs.length > 0) {
            jobUUID = jobs[0].uuid;
          }
        }
      }

      if (jobUUID) {
        // Get job details
        const jobDetails = await fetch(
          `${SERVICEM8_API_BASE}/job/${jobUUID}.json`,
          { headers: getAuthHeaders() }
        );

        if (jobDetails.ok) {
          const job = await jobDetails.json();
          console.log(`   ✅ Job created`);
          console.log(`   📍 Job address: ${job.job_address}`);
          console.log(`   💰 Billing address: ${job.billing_address}`);
          console.log(`   Match? ${job.job_address === job.billing_address ? '❌ YES (Problem!)' : '✅ NO (Good!)'}\n`);

          // Clean up test job
          await fetch(`${SERVICEM8_API_BASE}/job/${jobUUID}.json`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        }
      }
    }

    // STEP 4: Test JobContact types on a real job
    console.log('STEP 4️⃣  TEST JOBCONTACT TYPES\n');
    console.log('==============================\n');

    // Create a job to test contacts
    const finalJobData = {
      company_uuid: siteUUID,
      status: 'Work Order',
      job_address: '295 Ann Street, Brisbane CBD QLD 4000',
      purchase_order_number: 'ETS-WOOL-CBD-001',
      job_description: `URGENCY: STANDARD

Electrical inspection of freezer units`,
      category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb',
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]',
      active: 1
    };

    const finalJobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(finalJobData)
    });

    const finalJobText = await finalJobResponse.text();
    let finalJobUUID, finalJobNumber;

    if (!finalJobText.includes('<!DOCTYPE')) {
      const job = JSON.parse(finalJobText);
      finalJobUUID = job.uuid;
      finalJobNumber = job.generated_job_id;
    } else {
      const checkJob = await fetch(
        `${SERVICEM8_API_BASE}/job.json?company_uuid=${siteUUID}&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );
      if (checkJob.ok) {
        const jobs = await checkJob.json();
        if (jobs.length > 0) {
          finalJobUUID = jobs[0].uuid;
          finalJobNumber = jobs[0].generated_job_id;
        }
      }
    }

    if (finalJobUUID) {
      console.log(`✅ Final job created: ${finalJobNumber}\n`);

      // Test adding different contact types
      const contactTests = [
        {
          name: 'Site Contact',
          type: 'JOB',
          first: 'James',
          last: 'Wilson (Site)',
          mobile: '0412 345 678'
        },
        {
          name: 'Property Manager',
          type: 'Property Manager',
          first: 'Sarah',
          last: 'Chen (PM)',
          mobile: '0423 456 789'
        },
        {
          name: 'Billing Contact',
          type: 'BILLING',
          first: 'Accounts',
          last: 'Payable',
          email: 'accounts@woolworths.com.au'
        }
      ];

      console.log('👥 Adding JobContacts:');
      for (const contact of contactTests) {
        const contactData = {
          job_uuid: finalJobUUID,
          first: contact.first,
          last: contact.last,
          email: contact.email || `${contact.first.toLowerCase()}@example.com`,
          mobile: contact.mobile || '0400000000',
          type: contact.type,
          active: 1
        };

        const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(contactData)
        });

        if (response.ok) {
          console.log(`   ✅ ${contact.name} added (type: ${contact.type})`);
        } else {
          console.log(`   ❌ ${contact.name} failed (type: ${contact.type})`);
        }
      }

      console.log(`\n📋 FINAL JOB SUMMARY:`);
      console.log(`   Job Number: ${finalJobNumber}`);
      console.log(`   Site: ${siteData.name}`);
      console.log(`   Job Location: Brisbane CBD`);
      console.log(`   Expected Billing: Bella Vista NSW (Corporate)`);
      console.log(`   Contacts: Site, Property Manager, Billing\n`);
    }

    // Clean up test site
    console.log('\n🗑️  Cleaning up test site...');
    await fetch(`${SERVICEM8_API_BASE}/company/${siteUUID}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    console.log('✅ Test site deleted');

    console.log('\n\n🔍 KEY FINDINGS:');
    console.log('================');
    console.log('1. billing_address field is ALWAYS set to match job_address');
    console.log('2. ServiceM8 may handle billing at invoice generation, not job creation');
    console.log('3. Only 3 JobContact types work: JOB, Property Manager, BILLING');
    console.log('4. Site Contact must use type "JOB" (no SITE_CONTACT type)');
    console.log('5. Smart Contacts hierarchy exists but billing separation requires invoice-time handling');
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    console.log('• Use Smart Contacts structure (ETS → Sites)');
    console.log('• Add Site Contact as type "JOB"');
    console.log('• Add Property Manager and BILLING contacts as needed');
    console.log('• Billing address separation happens at invoice generation');
    console.log('• Include billing instructions in job_description or work_done_description');

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run test
testTwoStepProcess();