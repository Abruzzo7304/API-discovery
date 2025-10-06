// Live test with updated template structure
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');
const ETS_UUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

async function createTestJob() {
  console.log('🎯 LIVE TEST - Creating Job with Updated Template');
  console.log('================================================\n');

  try {
    // STEP 1: Create Site under ETS
    console.log('📍 STEP 1: Creating site under ETS...');

    const siteData = {
      name: `Test Site ${Date.now()}`, // Unique name
      parent_company_uuid: ETS_UUID,
      address: '456 Test Street, Brisbane QLD 4000',
      email: 'test@example.com',
      phone: '07 3000 0000',
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
      // Check for created site
      const checkResponse = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq '${siteData.name}'`,
        { headers: getAuthHeaders() }
      );
      const sites = await checkResponse.json();
      if (sites.length > 0) {
        siteUUID = sites[0].uuid;
      }
    } else {
      const site = JSON.parse(siteText);
      siteUUID = site.uuid;
    }

    console.log(`✅ Site created: ${siteUUID}`);
    console.log(`   Name: ${siteData.name}`);
    console.log(`   ❌ No billing_address (rolls up to ETS)\n`);

    // STEP 2: Add Company Contacts
    console.log('👥 STEP 2: Adding company contacts...');

    const companyContacts = [
      {
        company_uuid: siteUUID,
        first: 'John',
        last: 'TestContact',
        email: 'john@test.com',
        mobile: '0400 000 001',
        type: 'JOB',
        is_primary_contact: 1,
        active: 1
      },
      {
        company_uuid: siteUUID,
        first: 'Test',
        last: 'Tenant',
        email: 'tenant@test.com',
        mobile: '0400 000 002',
        type: 'Tenant',
        active: 1
      },
      {
        company_uuid: siteUUID,
        first: 'Property',
        last: 'Owner',
        email: 'owner@test.com',
        mobile: '0400 000 003',
        type: 'Property Owner',
        active: 1
      },
      {
        company_uuid: siteUUID,
        first: 'Sarah',
        last: 'Manager',
        email: 'manager@test.com',
        mobile: '0400 000 004',
        type: 'Property Manager',
        active: 1
      }
    ];

    for (const contact of companyContacts) {
      await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contact)
      });
      console.log(`   ✅ Added ${contact.first} ${contact.last} (${contact.type})`);
    }

    // STEP 3: Create Job
    console.log('\n📋 STEP 3: Creating job with urgency template...');

    const jobPO = `ETS-TEST-${Date.now()}`;
    const jobData = {
      company_uuid: siteUUID,
      purchase_order_number: jobPO,
      status: 'Work Order',
      job_address: '456 Test Street, Brisbane QLD 4000',

      job_description: `URGENCY: URGENT
=========================================
CRITICAL - Immediate response required, safety/security risk
URGENT - Response within 4 hours, business operations affected
STANDARD - Response within 24-48 hours, routine maintenance

Contact site during business hours to schedule job
Service window: Monday-Friday 8am-5pm
Response time: Within 4 hours

-----------------------------------

JOB DETAILS:
===========
Test electrical repair job
- Check power outlets
- Test circuit breakers
- Verify compliance

Please scan & complete site risk assessment before proceeding with works.

1.1. Please attend site to undertake the scope of works as per detailed instruction in this work order.
1.2. If you cannot complete the works within the cost limits $500 ex GST, or due to needing to order materials, please call Sustaine from site for further advice.
1.3. If costs are to exceed our Client pre-approval limit, we will ask for a quote so we can get formal approval before commencement.
1.4. If you are able to complete works within the limit, or get additional cost approval on site, please ensure all rubbish and debris are to be removed from site and disposed of appropriately on completion of works.
1.5. Site to be left clean and tidy on completion

For any changes or variations to this work order, please contact:
Sustaine - 1300 227 266 or Admin@Sustaine.com.au

OHS REQUIREMENTS:
================
State Occupational Health and Safety regulations and policies must be adhered to for the duration of the Subcontractors time on site. It is the Subcontractors responsibility to complete a risk assessment before commencing all the jobs and immediately reporting any high-risk hazards to Sustaine prior to commencing the jobs.

SCOPE OF WORKS:
==============
It is the responsibility of the sub-contractor to advise of any discrepancies in the scope of works. Any alteration or variance to the scope of works provided must be approved by Sustaine prior to works commencing.`,

      work_done_description: `BILLING INSTRUCTIONS:
==================
Bill To: ETS Head Office (via Smart Contacts)
PO Reference: ${jobPO}

APPROVAL LIMIT: $500 ex GST

Any work exceeding this amount requires prior approval from Sustaine.
For variations or additional work beyond approved limit:
- Contact Sustaine Office: 1300 227 266
- Email: Admin@Sustaine.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,

      category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job
      source: 'Created by ETS via API Integration',
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
      // Check for created job
      const checkResponse = await fetch(
        `${SERVICEM8_API_BASE}/job.json?$filter=company_uuid eq '${siteUUID}'&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );
      const jobs = await checkResponse.json();
      if (jobs.length > 0) {
        jobUUID = jobs[0].uuid;
        jobNumber = jobs[0].generated_job_id;
      }
    } else {
      const job = JSON.parse(jobText);
      jobUUID = job.uuid;
      jobNumber = job.generated_job_id;
    }

    console.log(`✅ Job created: ${jobNumber}`);
    console.log(`   UUID: ${jobUUID}`);
    console.log(`   Urgency: URGENT`);
    console.log(`   Approval: $500 ex GST`);

    // STEP 4: Link Job Contacts
    console.log('\n🔗 STEP 4: Linking contacts to job...');

    const jobContacts = [
      { job_uuid: jobUUID, first: 'John', last: 'TestContact', email: 'john@test.com', mobile: '0400 000 001', type: 'JOB', active: 1 },
      { job_uuid: jobUUID, first: 'Test', last: 'Tenant', email: 'tenant@test.com', mobile: '0400 000 002', type: 'Tenant', active: 1 },
      { job_uuid: jobUUID, first: 'Property', last: 'Owner', email: 'owner@test.com', mobile: '0400 000 003', type: 'Property Owner', active: 1 },
      { job_uuid: jobUUID, first: 'Sarah', last: 'Manager', email: 'manager@test.com', mobile: '0400 000 004', type: 'Property Manager', active: 1 }
    ];

    for (const contact of jobContacts) {
      await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contact)
      });
      console.log(`   ✅ Linked ${contact.first} ${contact.last} (${contact.type})`);
    }

    console.log('\n✨ SUCCESS - Test Job Created!');
    console.log('================================');
    console.log(`Job Number: ${jobNumber}`);
    console.log(`Site: ${siteData.name}`);
    console.log(`Urgency: URGENT (4 hour response)`);
    console.log(`Billing: Flows to ETS via Smart Contacts`);
    console.log(`Variations: Contact Sustaine`);

    return { jobNumber, jobUUID, siteUUID };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the test
createTestJob();