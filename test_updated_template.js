// Test Job Creation with Updated Template Structure
const https = require('https');
const querystring = require('querystring');
const { API_KEY, SERVICEM8_API_BASE } = require('./config');

const ETS_UUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

function makeAPIRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SERVICEM8_API_BASE}${endpoint}`);
    const credentials = Buffer.from(`${API_KEY}:x`).toString('base64');

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({ ok: res.statusCode < 400, text: responseData, status: res.statusCode });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createTestJob() {
  try {
    // STEP 1: Create Site under ETS
    console.log('🏢 Creating test site under ETS...');

    const siteData = {
      name: 'Test Retail Store - Brisbane CBD',
      parent_company_uuid: ETS_UUID,
      address: '123 Queen Street, Brisbane QLD 4000',
      email: 'admin@testretail.com.au',
      phone: '07 3000 1234',
      active: 1
    };

    const siteResponse = await makeAPIRequest('POST', '/company.json', siteData);
    const siteText = siteResponse.text;
    let siteUUID;

    if (siteText.includes('<!DOCTYPE')) {
      // Re-check for created site
      const recheck = await makeAPIRequest('GET', `/company.json?$filter=name eq '${siteData.name}'`);
      if (recheck.ok) {
        const sites = JSON.parse(recheck.text);
        if (sites.length > 0) {
          siteUUID = sites[0].uuid;
          console.log(`✅ Site created: ${siteUUID}`);
        }
      }
    } else {
      const site = JSON.parse(siteText);
      siteUUID = site.uuid;
      console.log(`✅ Site created: ${siteUUID}`);
    }

    // STEP 2: Add Company Contacts
    console.log('\n👥 Adding Company Contacts to Site...');

    const companyContacts = [
      {
        company_uuid: siteUUID,
        first: 'John',
        last: 'Smith',
        email: 'john.smith@testretail.com.au',
        mobile: '0412 345 678',
        type: 'JOB', // Site Contact
        is_primary_contact: 1,
        active: 1
      },
      {
        company_uuid: siteUUID,
        first: 'Sarah',
        last: 'Johnson',
        email: 'sarah@propertygroup.com.au',
        mobile: '0423 456 789',
        type: 'Property Manager',
        is_primary_contact: 0,
        active: 1
      },
      {
        company_uuid: siteUUID,
        first: 'Test Retail',
        last: 'Pty Ltd',
        email: 'accounts@testretail.com.au',
        mobile: '0434 567 890',
        type: 'Tenant',
        is_primary_contact: 0,
        active: 1
      }
    ];

    for (const contact of companyContacts) {
      const response = await makeAPIRequest('POST', '/companycontact.json', contact);

      if (response.ok) {
        console.log(`   ✅ Added ${contact.first} ${contact.last} as ${contact.type}`);
      }
    }

    // STEP 3: Create Job
    console.log('\n📋 Creating job...');

    const jobData = {
      company_uuid: siteUUID,
      purchase_order_number: 'ETS-TEST-2024-001',
      status: 'Work Order',
      job_address: '123 Queen Street, Brisbane QLD 4000',

      job_description: `URGENCY: URGENT
=========================================
CRITICAL - Immediate response required, safety/security risk
URGENT - Response within 4 hours, business operations affected
STANDARD - Response within 24-48 hours, routine maintenance

Contact site during business hours to schedule job
Service window: Monday-Friday 7am-6pm
Response time: Within 4 hours

-----------------------------------

JOB DETAILS:
===========
Electrical fault in main retail area - Multiple power outlets not working
- Investigate power failure affecting 6 outlets on eastern wall
- Check circuit breakers and RCD protection
- Test and repair faulty outlets as required
- Ensure all outlets comply with current electrical standards
- Test and tag all repaired equipment

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
PO Reference: ETS-TEST-2024-001

APPROVAL LIMIT: $500 ex GST

Any work exceeding this amount requires prior approval from Sustaine.
For variations or additional work beyond approved limit:
- Contact Sustaine Office: 1300 227 266
- Email: Admin@Sustaine.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,

      category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
      source: 'Created by ETS via API Integration',
      scheduled_start: '2024-01-20 09:00:00',
      scheduled_duration: 120,
      active: 1
    };

    const jobResponse = await makeAPIRequest('POST', '/job.json', jobData);
    const jobText = jobResponse.text;
    let jobUUID, jobNumber;

    if (jobText.includes('<!DOCTYPE')) {
      const checkJob = await makeAPIRequest('GET', `/job.json?company_uuid=${siteUUID}&$orderby=date desc&$top=1`);
      if (checkJob.ok) {
        const jobs = JSON.parse(checkJob.text);
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

    console.log(`✅ Job created: ${jobNumber}`);
    console.log(`   Job UUID: ${jobUUID}`);

    // STEP 4: Add Job Contacts
    console.log('\n🔗 Linking contacts to job...');

    const jobContacts = [
      {
        job_uuid: jobUUID,
        first: 'John',
        last: 'Smith',
        email: 'john.smith@testretail.com.au',
        mobile: '0412 345 678',
        type: 'JOB', // Site Contact
        active: 1
      },
      {
        job_uuid: jobUUID,
        first: 'Sarah',
        last: 'Johnson',
        email: 'sarah@propertygroup.com.au',
        mobile: '0423 456 789',
        type: 'Property Manager',
        active: 1
      },
      {
        job_uuid: jobUUID,
        first: 'Test Retail',
        last: 'Pty Ltd',
        email: 'accounts@testretail.com.au',
        mobile: '0434 567 890',
        type: 'Tenant',
        active: 1
      }
    ];

    for (const contact of jobContacts) {
      const response = await makeAPIRequest('POST', '/jobcontact.json', contact);

      if (response.ok) {
        console.log(`   ✅ Linked ${contact.first} ${contact.last} as ${contact.type}`);
      }
    }

    console.log('\n✨ SUCCESS - Test Job Created!');
    console.log('================================');
    console.log(`Site: Test Retail Store - Brisbane CBD`);
    console.log(`Job Number: ${jobNumber}`);
    console.log(`Urgency: URGENT`);
    console.log(`Category: Electrical`);
    console.log(`Approval Limit: $500 ex GST`);
    console.log('\nContacts added:');
    console.log('- John Smith (Site Contact)');
    console.log('- Sarah Johnson (Property Manager)');
    console.log('- Test Retail Pty Ltd (Tenant)');
    console.log('\nBilling: Flows to ETS Head Office via Smart Contacts');

    return { jobNumber, jobUUID, siteUUID };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the test
createTestJob();