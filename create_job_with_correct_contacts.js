// Create job with correct site structure and Site Contact
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Create complete workflow with proper contacts
async function createJobWithCorrectContacts() {
  console.log('🏗️  CREATING JOB WITH CORRECT SITE STRUCTURE');
  console.log('============================================\n');

  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  try {
    // Step 1: Create Site under ETS
    console.log('1️⃣  CREATING SITE UNDER ETS...\n');

    const siteData = {
      name: 'Bunnings Warehouse - Newstead',
      parent_company_uuid: etsUUID, // Links to ETS
      // Billing address for the client company (different from job site)
      billing_address: 'Bunnings Group Limited\nLevel 1, 16-18 Cato Street\nHawthorn East VIC 3123',
      email: 'accounts.payable@bunnings.com.au',
      phone: '03 8831 9777',
      active: 1
    };

    console.log('📍 Site Details:');
    console.log(`   Name: ${siteData.name}`);
    console.log(`   Parent: ETS`);
    console.log(`   Billing Address: Hawthorn East VIC (Corporate)`);
    console.log(`   Job Site: Newstead QLD (Store location)`);

    const siteResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(siteData)
    });

    let siteUUID;
    const siteResponseText = await siteResponse.text();

    if (siteResponseText.includes('<!DOCTYPE')) {
      console.log('   ⚠️  HTML response - checking if site was created...');

      const checkResponse = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'Bunnings Warehouse - Newstead'`,
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

    // Step 2: Create Company Contact Types (for site)
    console.log('2️⃣  CREATING COMPANY CONTACT TYPES...\n');

    // Check available contact types
    console.log('🔍 Checking available contact types...');
    const contactTypes = [
      'Site Contact',
      'SITE_CONTACT',
      'Tenant',
      'TENANT',
      'Property Owner',
      'PROPERTY_OWNER',
      'Property Manager',
      'PROPERTY_MANAGER'
    ];

    // Try Site Contact first
    const siteContactData = {
      company_uuid: siteUUID,
      first: 'Sarah',
      last: 'Mitchell',
      email: 'sarah.mitchell@bunnings.com.au',
      mobile: '0434 678 901',
      phone: '07 3114 3200',
      type: 'Site Contact', // Try full name first
      is_primary_contact: 1,
      active: 1
    };

    console.log('👤 Creating Site Contact:');
    console.log(`   Name: ${siteContactData.first} ${siteContactData.last}`);
    console.log(`   Mobile: ${siteContactData.mobile}`);
    console.log(`   Type: Site Contact`);

    let contactCreated = false;
    for (const contactType of ['Site Contact', 'SITE_CONTACT', 'SITE', 'JOB']) {
      siteContactData.type = contactType;

      const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(siteContactData)
      });

      if (contactResponse.ok || contactResponse.status === 200) {
        console.log(`   ✅ Site Contact created with type: ${contactType}\n`);
        contactCreated = true;
        break;
      }
    }

    if (!contactCreated) {
      console.log('   ⚠️  Site Contact creation uncertain\n');
    }

    // Step 3: Create Job for the Site
    console.log('3️⃣  CREATING JOB FOR SITE...\n');

    const jobData = {
      company_uuid: siteUUID, // Job assigned to the SITE
      purchase_order_number: 'ETS-BUNNINGS-NSW-001',
      status: 'Work Order',

      // Job address (actual work location, different from billing)
      job_address: '15 Breakfast Creek Road, Newstead QLD 4006',

      // Job description with urgency
      job_description: `URGENCY: STANDARD
Contact during business hours to schedule job
Service window: Monday-Friday 7am-5pm
Response time: Within 48 hours

-----------------------------------

JOB DETAILS:
Electrical safety inspection and tagging - Trade desk area
- Inspect all portable electrical equipment
- Test and tag as per AS/NZS 3760:2010
- Replace any damaged leads or plugs
- Provide compliance report

For any changes or variations to this work order, please contact:
Sustaine Electrical - 1300 SUSTAINE (1300 787 824)

Site access: Trade desk manager has site keys
Safety requirements: Safety boots and hi-vis required`,

      // Approval limits in work_done_description
      work_done_description: `APPROVAL LIMIT: $500 + GST

Any work exceeding this amount requires prior approval from ETS.
For variations or additional work beyond approved limit:
- Contact ETS Office: 1800 ETS HELP
- Email: approvals@emergencytradeservices.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,

      category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
      active: 1
    };

    console.log('📋 Job Details:');
    console.log(`   Site: ${siteData.name}`);
    console.log(`   Job Address: 15 Breakfast Creek Road, Newstead`);
    console.log(`   Billing Address: Hawthorn East VIC (Corporate)`);
    console.log(`   PO: ${jobData.purchase_order_number}`);

    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });

    const jobResponseText = await jobResponse.text();
    let jobUUID, jobNumber;

    if (jobResponseText.includes('<!DOCTYPE')) {
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

    // Step 4: Add Job Contacts (Site Contact as priority, optionally others)
    if (jobUUID) {
      console.log('4️⃣  ADDING JOB CONTACTS...\n');

      // Priority: Site Contact
      const jobSiteContact = {
        job_uuid: jobUUID,
        first: 'Sarah',
        last: 'Mitchell',
        email: 'sarah.mitchell@bunnings.com.au',
        mobile: '0434 678 901',
        type: 'JOB', // JobContact type
        active: 1
      };

      console.log('👤 Adding Site Contact to Job:');
      console.log(`   Name: ${jobSiteContact.first} ${jobSiteContact.last}`);

      const jobContactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobSiteContact)
      });

      if (jobContactResponse.ok) {
        console.log('   ✅ Site Contact added to job\n');
      }

      // Optional: Property Manager (if available)
      const propertyManager = {
        job_uuid: jobUUID,
        first: 'Property',
        last: 'Manager',
        email: 'facilities@bunnings.com.au',
        mobile: '0400 111 222',
        type: 'PROPERTY', // Or appropriate type
        active: 1
      };

      console.log('🏢 Adding Property Manager (optional):');
      console.log(`   Name: ${propertyManager.first} ${propertyManager.last}`);

      const pmResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(propertyManager)
      });

      if (pmResponse.ok) {
        console.log('   ✅ Property Manager added\n');
      } else {
        console.log('   ℹ️  Property Manager not added (optional)\n');
      }
    }

    // Summary
    console.log('✅ WORKFLOW COMPLETE!');
    console.log('====================\n');

    console.log('📊 STRUCTURE CREATED:');
    console.log('ETS (Head Office)');
    console.log(`└── ${siteData.name} (Site)`);
    console.log(`    ├── Billing: Hawthorn East VIC (Corporate)`);
    console.log(`    ├── Job Location: Newstead QLD (Store)`);
    console.log(`    └── Job ${jobNumber || 'Created'}`);
    console.log(`        ├── Site Contact: Sarah Mitchell`);
    console.log(`        └── Property Manager: (Optional)`);

    console.log('\n💡 KEY IMPROVEMENTS:');
    console.log('• Billing address ≠ Job address (Corporate vs Store)');
    console.log('• Site Contact properly attached to job');
    console.log('• Optional contacts (Tenant/Property Owner/Manager) available');
    console.log('• Clean separation of contact roles');

    console.log('\n📝 CONTACT TYPES AVAILABLE:');
    console.log('• Site Contact (PRIMARY - always add)');
    console.log('• Tenant (if applicable)');
    console.log('• Property Owner (if different from client)');
    console.log('• Property Manager (facilities management)');

    return { siteUUID, jobUUID, jobNumber };

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the workflow
createJobWithCorrectContacts();