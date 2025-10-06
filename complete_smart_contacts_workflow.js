// Complete Smart Contacts Workflow - Production Ready
const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

// External company will use their own API key
const API_KEY = 'your_api_key_here';

function getAuthHeaders() {
  // API key authentication - use API key as username with 'x' as password
  const credentials = btoa(`${API_KEY}:x`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Complete workflow for external company to create jobs
async function createJobWithSmartContacts(siteInfo, jobInfo, contacts) {
  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';
  
  try {
    // STEP 1: Check if site exists or create new one
    console.log('🔍 Checking if site exists...');
    
    let siteUUID;
    
    // Check for existing ETS-linked site
    const searchResponse = await fetch(
      `${SERVICEM8_API_BASE}/company.json?$filter=name eq '${siteInfo.name}' and parent_company_uuid eq '${etsUUID}'`,
      { headers: getAuthHeaders() }
    );

    if (searchResponse.ok) {
      const existingSites = await searchResponse.json();
      if (existingSites.length > 0) {
        // Found existing site already linked to ETS
        const existingSite = existingSites[0];
        siteUUID = existingSite.uuid;
        console.log(`✅ Using existing ETS-linked site: ${siteUUID}`);
        console.log(`   Name: ${existingSite.name}`);
        console.log(`   Already linked to ETS`);
      }
    }

    // If not found, check if standalone company exists with same name
    if (!siteUUID) {
      const standaloneCheck = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq '${siteInfo.name}' and parent_company_uuid eq null`,
        { headers: getAuthHeaders() }
      );

      if (standaloneCheck.ok) {
        const standaloneCompanies = await standaloneCheck.json();
        if (standaloneCompanies.length > 0) {
          console.log(`⚠️  Standalone company "${siteInfo.name}" exists`);
          console.log(`   This is separate from ETS sites`);
          console.log(`   Creating new ETS-linked site with modified name...`);
          // Modify the name to differentiate from standalone
          siteInfo.name = `${siteInfo.name} (ETS Site)`;
        }
      }
    }
    
    // Create site if doesn't exist
    if (!siteUUID) {
      console.log('📍 Creating new site...');
      
      const siteData = {
        name: siteInfo.name,
        parent_company_uuid: etsUUID,
        billing_address: siteInfo.billing_address, // Corporate billing
        address: siteInfo.address, // Physical location
        email: siteInfo.email,
        phone: siteInfo.phone,
        active: 1
      };
      
      const siteResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(siteData)
      });
      
      const siteText = await siteResponse.text();
      
      if (siteText.includes('<!DOCTYPE')) {
        // Re-check for created site
        const recheck = await fetch(
          `${SERVICEM8_API_BASE}/company.json?$filter=name eq '${siteInfo.name}'`,
          { headers: getAuthHeaders() }
        );
        if (recheck.ok) {
          const sites = await recheck.json();
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
    }
    
    if (!siteUUID) {
      throw new Error('Failed to create or find site');
    }
    
    // STEP 2: Create Job
    console.log('📋 Creating job...');
    
    const jobData = {
      company_uuid: siteUUID, // Links to site, not ETS directly
      purchase_order_number: jobInfo.purchase_order_number,
      status: jobInfo.status || 'Work Order',
      job_address: jobInfo.job_address,
      job_description: jobInfo.job_description,
      work_done_description: jobInfo.work_done_description, // Billing instructions
      category_uuid: jobInfo.category_uuid,
      badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
      source: 'Created by ETS via API Integration',
      active: 1
    };
    
    // Add optional fields if provided
    if (jobInfo.scheduled_start) jobData.scheduled_start = jobInfo.scheduled_start;
    if (jobInfo.scheduled_duration) jobData.scheduled_duration = jobInfo.scheduled_duration;
    
    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });
    
    const jobText = await jobResponse.text();
    let jobUUID, jobNumber;
    
    if (jobText.includes('<!DOCTYPE')) {
      // Re-check for created job
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
      throw new Error('Failed to create job');
    }
    
    console.log(`✅ Job created: ${jobNumber}`);
    
    // STEP 3: Add Job Contacts
    console.log('👥 Adding contacts...');
    
    // Add Site Contact (Priority - always add)
    if (contacts.site_contact) {
      const siteContactData = {
        job_uuid: jobUUID,
        first: contacts.site_contact.first,
        last: contacts.site_contact.last,
        email: contacts.site_contact.email,
        mobile: contacts.site_contact.mobile,
        phone: contacts.site_contact.phone,
        type: 'JOB', // Must be 'JOB' for site contacts
        active: 1
      };
      
      const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(siteContactData)
      });
      
      if (response.ok) {
        console.log('✅ Site contact added');
      }
    }
    
    // Add Property Manager (Optional)
    if (contacts.property_manager) {
      const pmData = {
        job_uuid: jobUUID,
        first: contacts.property_manager.first,
        last: contacts.property_manager.last,
        email: contacts.property_manager.email,
        mobile: contacts.property_manager.mobile,
        type: 'Property Manager',
        active: 1
      };
      
      const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(pmData)
      });
      
      if (response.ok) {
        console.log('✅ Property manager added');
      }
    }
    
    // Add Billing Contact (Optional)
    if (contacts.billing_contact) {
      const billingData = {
        job_uuid: jobUUID,
        first: contacts.billing_contact.first,
        last: contacts.billing_contact.last,
        email: contacts.billing_contact.email,
        phone: contacts.billing_contact.phone,
        type: 'BILLING',
        active: 1
      };
      
      const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(billingData)
      });
      
      if (response.ok) {
        console.log('✅ Billing contact added');
      }
    }
    
    // STEP 4: Add Attachment (Optional)
    if (jobInfo.attachment) {
      console.log('📎 Adding attachment...');
      
      const formData = new FormData();
      const blob = new Blob([jobInfo.attachment.content], { type: 'application/pdf' });
      formData.append('file', blob, jobInfo.attachment.filename);
      
      const attachResponse = await fetch(
        `${SERVICEM8_API_BASE}/Attachment/${jobUUID}.file`,
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeaders().Authorization
          },
          body: formData
        }
      );
      
      if (attachResponse.ok) {
        console.log('✅ Attachment uploaded');
      }
    }
    
    // Return success details
    return {
      success: true,
      siteUUID,
      jobUUID,
      jobNumber,
      message: `Job ${jobNumber} created successfully`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Example usage with filled template
const exampleSiteInfo = {
  name: 'Woolworths Metro - Brisbane CBD',
  billing_address: 'Woolworths Group Limited\nLevel 1, 1 Woolworths Way\nBella Vista NSW 2153',
  address: '295 Ann Street, Brisbane CBD QLD 4000',
  email: 'metro.brisbane@woolworths.com.au',
  phone: '07 3229 1234'
};

const exampleJobInfo = {
  purchase_order_number: 'ETS-WOOL-CBD-001',
  status: 'Work Order',
  job_address: '295 Ann Street, Brisbane CBD QLD 4000',
  job_description: `URGENCY: STANDARD
Contact during business hours to schedule job
Service window: Monday-Friday 7am-5pm
Response time: Within 48 hours

-----------------------------------

JOB DETAILS:
Electrical inspection - Freezer units
- Test all freezer electrical connections
- Check circuit breakers and safety switches
- Verify grounding and insulation
- Provide compliance certificate

For any changes or variations to this work order, please contact:
Sustaine Electrical - 1300 SUSTAINE (1300 787 824)

Site access: Store manager has keys
Safety requirements: Standard PPE required`,
  
  work_done_description: `BILLING INSTRUCTIONS:
==================
Bill To: Woolworths Group Limited
Level 1, 1 Woolworths Way, Bella Vista NSW 2153
PO Reference: ETS-WOOL-CBD-001

APPROVAL LIMIT: $500 + GST

Any work exceeding this amount requires prior approval from ETS.
For variations or additional work beyond approved limit:
- Contact ETS Office: 1800 ETS HELP
- Email: approvals@emergencytradeservices.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,
  
  category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
  scheduled_start: '2024-01-15 09:00:00',
  scheduled_duration: 120
};

const exampleContacts = {
  site_contact: {
    first: 'James',
    last: 'Wilson',
    email: 'james.wilson@woolworths.com.au',
    mobile: '0412 345 678',
    phone: '07 3229 1234'
  },
  property_manager: {
    first: 'Sarah',
    last: 'Chen',
    email: 'facilities@woolworths.com.au',
    mobile: '0423 456 789'
  },
  billing_contact: {
    first: 'Accounts',
    last: 'Payable',
    email: 'accounts@woolworths.com.au',
    phone: '02 8885 0000'
  }
};

// Run the example
// createJobWithSmartContacts(exampleSiteInfo, exampleJobInfo, exampleContacts)
//   .then(result => console.log('Result:', result))
//   .catch(error => console.error('Error:', error));

console.log('🎯 Smart Contacts Workflow Script Ready');
console.log('=====================================');
console.log('This script demonstrates the complete workflow:');
console.log('1. Create or find site under ETS');
console.log('2. Create job linked to site');
console.log('3. Add job contacts (Site, Property Manager, Billing)');
console.log('4. Optional: Add attachments');
console.log('');
console.log('⚠️  Important: External company must use their own ServiceM8 credentials');
console.log('📝 Use job_template_smart_contacts.json as reference');