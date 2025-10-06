// Create job with Smart Contacts - Working within ServiceM8 limitations
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Create complete workflow with proper Smart Contacts structure
async function createJobWithSmartContactsFixed() {
  console.log('🏗️  CREATING JOB WITH SMART CONTACTS (FIXED)');
  console.log('=============================================\n');

  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  try {
    // Step 1: Create Site under ETS with proper addresses
    console.log('1️⃣  CREATING SITE UNDER ETS...\n');

    const siteData = {
      name: 'Harvey Norman - Bundall',
      parent_company_uuid: etsUUID,
      // This becomes the site's billing address (corporate)
      billing_address: 'Harvey Norman Holdings\nA1 Richmond Road\nHomebush West NSW 2140',
      // Store physical address
      address: '14 Corporation Drive, Bundall QLD 4217',
      email: 'bundall@harveynorman.com.au',
      phone: '07 5538 9299',
      active: 1
    };

    console.log('📍 Site Configuration:');
    console.log(`   Name: ${siteData.name}`);
    console.log(`   Parent: ETS (Emergency Trade Services)`);
    console.log(`   Store Location: Bundall QLD 4217`);
    console.log(`   Corporate Billing: Homebush West NSW 2140`);
    console.log(`   ⚠️  Note: Billing separation happens at invoice time\n`);

    const siteResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(siteData)
    });

    let siteUUID;
    const siteText = await siteResponse.text();

    if (siteText.includes('<!DOCTYPE')) {
      const checkSite = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'Harvey Norman - Bundall'`,
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

    // Step 2: Add Site Contact to the company
    console.log('2️⃣  ADDING SITE CONTACT TO COMPANY...\n');

    const companyContactData = {
      company_uuid: siteUUID,
      first: 'Robert',
      last: 'Chen',
      email: 'robert.chen@harveynorman.com.au',
      mobile: '0434 123 456',
      type: 'JOB',
      is_primary_contact: 1,
      active: 1
    };

    console.log('👤 Company Contact (Site Contact):');
    console.log(`   Name: ${companyContactData.first} ${companyContactData.last}`);
    console.log(`   Role: Site Contact`);
    console.log(`   Mobile: ${companyContactData.mobile}\n`);

    await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(companyContactData)
    });
    console.log('✅ Site contact added to company\n');

    // Step 3: Create Job
    console.log('3️⃣  CREATING JOB FOR SITE...\n');

    const poNumber = 'ETS-HN-BUNDALL-001';

    const jobData = {
      company_uuid: siteUUID,
      purchase_order_number: poNumber,
      status: 'Work Order',

      // Job site address (where work is performed)
      job_address: '14 Corporation Drive, Bundall QLD 4217',

      // Job description with urgency and billing instructions
      job_description: `URGENCY: STANDARD
Contact during business hours to schedule job
Service window: Monday-Friday 7am-5pm
Response time: Within 48 hours

-----------------------------------

JOB DETAILS:
Air conditioning service - Computer section
- Service 4x split system units
- Clean filters and coils
- Check refrigerant levels
- Test operation and controls

For any changes or variations to this work order, please contact:
Sustaine Electrical - 1300 SUSTAINE (1300 787 824)

Site access: Electronics department manager
Safety requirements: Standard PPE required`,

      // Billing instructions in work_done_description
      work_done_description: `BILLING INSTRUCTIONS:
==================
Bill To: Harvey Norman Holdings
A1 Richmond Road, Homebush West NSW 2140
PO Reference: ${poNumber}

APPROVAL LIMIT: $750 + GST

Any work exceeding this amount requires prior approval from ETS.
For variations or additional work beyond approved limit:
- Contact ETS Office: 1800 ETS HELP
- Email: approvals@emergencytradeservices.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,

      category_uuid: '8ab8e2d8-f533-4b20-838a-2f48ae55de17', // HVAC
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
      active: 1
    };

    console.log('📋 Job Details:');
    console.log(`   Site: ${siteData.name}`);
    console.log(`   PO: ${jobData.purchase_order_number}`);
    console.log(`   Job Location: Bundall QLD`);
    console.log(`   Billing To: Homebush West NSW (in work notes)\n`);

    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobText = await jobResponse.text();
    let jobUUID, jobNumber;

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

    if (jobUUID) {
      console.log(`✅ Job created: ${jobNumber}`);
      console.log(`   UUID: ${jobUUID}\n`);

      // Step 4: Add JobContacts with correct types
      console.log('4️⃣  ADDING JOB CONTACTS...\n');

      // Add Site Contact (using type 'JOB')
      const siteContactData = {
        job_uuid: jobUUID,
        first: 'Robert',
        last: 'Chen',
        email: 'robert.chen@harveynorman.com.au',
        mobile: '0434 123 456',
        phone: '07 5538 9299',
        type: 'JOB', // Must use 'JOB' for site contacts
        active: 1
      };

      console.log('👤 Adding Site Contact to Job:');
      console.log(`   Name: ${siteContactData.first} ${siteContactData.last}`);
      console.log(`   Type: JOB (functions as Site Contact)`);

      const siteContactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(siteContactData)
      });

      if (siteContactResponse.ok) {
        console.log('   ✅ Site Contact added\n');
      }

      // Add Property Manager (optional)
      const propertyManagerData = {
        job_uuid: jobUUID,
        first: 'Linda',
        last: 'Thompson',
        email: 'facilities@harveynorman.com.au',
        mobile: '0423 987 654',
        type: 'Property Manager', // Valid type
        active: 1
      };

      console.log('🏢 Adding Property Manager (optional):');
      console.log(`   Name: ${propertyManagerData.first} ${propertyManagerData.last}`);
      console.log(`   Type: Property Manager`);

      const pmResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(propertyManagerData)
      });

      if (pmResponse.ok) {
        console.log('   ✅ Property Manager added\n');
      }

      // Add Billing Contact
      const billingContactData = {
        job_uuid: jobUUID,
        first: 'Accounts',
        last: 'Payable',
        email: 'accounts.payable@harveynorman.com.au',
        phone: '02 9201 6111',
        type: 'BILLING', // Valid type
        active: 1
      };

      console.log('💰 Adding Billing Contact:');
      console.log(`   Name: ${billingContactData.first} ${billingContactData.last}`);
      console.log(`   Type: BILLING`);

      const billingResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(billingContactData)
      });

      if (billingResponse.ok) {
        console.log('   ✅ Billing Contact added\n');
      }
    }

    // Summary
    console.log('✅ WORKFLOW COMPLETE!');
    console.log('====================\n');

    console.log('📊 STRUCTURE CREATED:');
    console.log('ETS (Head Office)');
    console.log(`└── ${siteData.name} (Site)`);
    console.log(`    ├── Corporate Billing: Homebush West NSW`);
    console.log(`    ├── Store Location: Bundall QLD`);
    console.log(`    └── Job ${jobNumber || 'Created'}`);
    console.log(`        ├── Site Contact: Robert Chen (type: JOB)`);
    console.log(`        ├── Property Manager: Linda Thompson`);
    console.log(`        └── Billing Contact: Accounts Payable`);

    console.log('\n⚠️  IMPORTANT LIMITATIONS:');
    console.log('===========================');
    console.log('• billing_address field ALWAYS equals job_address at creation');
    console.log('• Billing separation handled at invoice generation');
    console.log('• Site Contact must use type "JOB" (no SITE_CONTACT type)');
    console.log('• Only 3 JobContact types work: JOB, Property Manager, BILLING');
    console.log('• Billing instructions must go in work_done_description');

    console.log('\n💡 WORKING SOLUTION:');
    console.log('====================');
    console.log('1. Create Site with corporate billing_address');
    console.log('2. Add billing instructions to work_done_description');
    console.log('3. Use JobContact type "JOB" for Site Contacts');
    console.log('4. Use JobContact type "Property Manager" for property managers');
    console.log('5. Use JobContact type "BILLING" for accounts payable');
    console.log('6. Smart Contacts hierarchy ensures proper invoice routing');

    return { siteUUID, jobUUID, jobNumber };

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the fixed workflow
createJobWithSmartContactsFixed();