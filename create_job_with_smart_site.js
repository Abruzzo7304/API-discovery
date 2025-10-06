// Create job with new site under ETS using Smart Contacts
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Create complete workflow with site and job
async function createJobWithSmartSite() {
  console.log('🏗️  CREATING JOB WITH SMART CONTACTS SITE');
  console.log('==========================================\n');

  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  try {
    // Step 1: Create Site under ETS
    console.log('1️⃣  CREATING SITE UNDER ETS...\n');

    const siteData = {
      name: 'Coles Supermarket - Fortitude Valley',
      parent_company_uuid: etsUUID, // Links to ETS
      billing_address: '1000 Ann Street\nFortitude Valley QLD 4006',
      email: 'manager.fortvalley@coles.com.au',
      phone: '07 3252 1000',
      mobile: '0412 789 456',
      active: 1
    };

    console.log('📍 Site Details:');
    console.log(`   Name: ${siteData.name}`);
    console.log(`   Parent: ETS`);
    console.log(`   Address: ${siteData.billing_address}`);

    const siteResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(siteData)
    });

    let siteUUID;
    const siteResponseText = await siteResponse.text();

    if (siteResponseText.includes('<!DOCTYPE')) {
      // HTML response - check if site was created
      console.log('   ⚠️  HTML response - checking if site was created...');

      const checkResponse = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'Coles Supermarket - Fortitude Valley'`,
        { headers: getAuthHeaders() }
      );

      if (checkResponse.ok) {
        const sites = await checkResponse.json();
        if (sites.length > 0) {
          siteUUID = sites[0].uuid;
          console.log(`   ✅ Site created: ${siteUUID}\n`);
        }
      }
    } else {
      const site = JSON.parse(siteResponseText);
      siteUUID = site.uuid;
      console.log(`   ✅ Site created: ${siteUUID}\n`);
    }

    if (!siteUUID) {
      console.log('   ❌ Failed to create site');
      return;
    }

    // Step 2: Create Site Contact
    console.log('2️⃣  CREATING SITE CONTACT...\n');

    const contactData = {
      company_uuid: siteUUID,
      first: 'Michael',
      last: 'Thompson',
      email: 'michael.thompson@coles.com.au',
      mobile: '0423 567 890',
      phone: '07 3252 1001',
      type: 'JOB',
      is_primary_contact: 1,
      active: 1
    };

    console.log('👤 Contact Details:');
    console.log(`   Name: ${contactData.first} ${contactData.last}`);
    console.log(`   Mobile: ${contactData.mobile}`);
    console.log(`   Email: ${contactData.email}`);

    const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(contactData)
    });

    if (contactResponse.ok || contactResponse.status === 200) {
      console.log('   ✅ Contact created\n');
    } else {
      console.log('   ⚠️  Contact creation status uncertain\n');
    }

    // Step 3: Create Job for the Site
    console.log('3️⃣  CREATING JOB FOR SITE...\n');

    const jobData = {
      company_uuid: siteUUID, // Job assigned to the SITE (which links to ETS)
      purchase_order_number: 'ETS-COLES-FV-001',
      status: 'Work Order',

      // Job address auto-populated from site
      job_address: '1000 Ann Street, Fortitude Valley QLD 4006',

      // Job description with urgency and instructions
      job_description: `URGENCY: STANDARD
Contact during business hours to schedule job
Service window: Monday-Friday 7am-5pm
Response time: Within 48 hours

-----------------------------------

JOB DETAILS:
Replace faulty emergency exit light in loading dock area
- Light fitting model: Clevertronics L10 Lithex
- Location: Loading dock emergency exit door 3
- Issue: Battery backup not functioning, indicator light red

For any changes or variations to this work order, please contact:
Sustaine Electrical - 1300 SUSTAINE (1300 787 824)

Site access: Loading dock manager has keys
Safety requirements: Hi-vis required in loading area`,

      // Work done description used for approval limits
      work_done_description: `APPROVAL LIMIT: $500 + GST

Any work exceeding this amount requires prior approval from ETS.
For variations or additional work beyond approved limit:
- Contact ETS Office: 1800 ETS HELP
- Email: approvals@emergencytradeservices.com.au
- Quote reference must include original PO number

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,

      category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
      active: 1
    };

    console.log('📋 Job Details:');
    console.log(`   Site: ${siteData.name}`);
    console.log(`   PO: ${jobData.purchase_order_number}`);
    console.log(`   Urgency: STANDARD`);
    console.log(`   Approval Limit: $500 + GST`);

    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobResponseText = await jobResponse.text();
    let jobUUID, jobNumber;

    if (jobResponseText.includes('<!DOCTYPE')) {
      // HTML response - check if job was created
      console.log('   ⚠️  HTML response - checking if job was created...');

      const checkJobResponse = await fetch(
        `${SERVICEM8_API_BASE}/job.json?company_uuid=${siteUUID}&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );

      if (checkJobResponse.ok) {
        const jobs = await checkJobResponse.json();
        if (jobs.length > 0) {
          jobUUID = jobs[0].uuid;
          jobNumber = jobs[0].generated_job_id;
          console.log(`   ✅ Job created: ${jobNumber}`);
          console.log(`   UUID: ${jobUUID}\n`);
        }
      }
    } else {
      const job = JSON.parse(jobResponseText);
      jobUUID = job.uuid;
      jobNumber = job.generated_job_id;
      console.log(`   ✅ Job created: ${jobNumber}`);
      console.log(`   UUID: ${jobUUID}\n`);
    }

    // Summary
    console.log('✅ WORKFLOW COMPLETE!');
    console.log('====================\n');

    console.log('📊 STRUCTURE CREATED:');
    console.log('ETS (Head Office)');
    console.log(`└── ${siteData.name} (Site)`);
    console.log(`    └── Job ${jobNumber || 'Created'}`);
    console.log(`        └── Contact: ${contactData.first} ${contactData.last}`);

    console.log('\n💡 KEY FEATURES:');
    console.log('• Site linked to ETS via parent_company_uuid');
    console.log('• Contact attached to site (not in job description)');
    console.log('• Urgency level: STANDARD (low priority)');
    console.log('• Approval limit in work_done_description: $500 + GST');
    console.log('• Change requests directed to Sustaine');
    console.log('• ETS contact for approval variations');

    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Send Network Request to Sustaine through ServiceM8 UI');
    console.log('2. Sustaine accepts and completes work');
    console.log('3. Billing flows: Sustaine → ETS → Coles (via Smart Contacts hierarchy)');

    return { siteUUID, jobUUID, jobNumber };

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the workflow
createJobWithSmartSite();