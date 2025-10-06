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

// Complete workflow for ETS to create jobs
async function createJobWithSmartContacts(siteInfo, companyContacts, jobInfo, jobContacts) {
  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb'; // ETS Head Office UUID
  
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

    // STEP 2: Add Company Contacts (people associated with the site)
    if (companyContacts && companyContacts.length > 0) {
      console.log('👥 Adding Company Contacts to Site...');

      for (const contact of companyContacts) {
        const companyContactData = {
          company_uuid: siteUUID,
          first: contact.first,
          last: contact.last,
          email: contact.email,
          mobile: contact.mobile,
          phone: contact.phone,
          type: contact.role || 'JOB', // Role: JOB, Property Manager, etc.
          is_primary_contact: contact.is_primary || 0,
          active: 1
        };

        console.log(`   Adding ${contact.first} ${contact.last} (Role: ${contact.role})`);

        const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact.json`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(companyContactData)
        });

        if (contactResponse.ok) {
          console.log(`   ✅ ${contact.first} added as ${contact.role}`);
        }
      }
      console.log('');
    }
    
    // STEP 3: Create Job
    console.log('📋 Creating job...');

    const jobData = {
      company_uuid: siteUUID, // Links to site, not ETS directly
      purchase_order_number: jobInfo.purchase_order_number,
      status: jobInfo.status || 'Work Order',
      job_address: jobInfo.job_address,
      billing_address: 'ETS Head Office, 223 Tweed Valley Way, South Murwillumbah NSW 2484', // Explicit ETS billing
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

    // STEP 4: Add Job Contacts (link the company contacts to this specific job)
    if (jobContacts && jobContacts.length > 0) {
      console.log('🔗 Linking contacts to job...');

      for (const contact of jobContacts) {
        const jobContactData = {
          job_uuid: jobUUID,
          first: contact.first,
          last: contact.last,
          email: contact.email,
          mobile: contact.mobile,
          phone: contact.phone,
          type: contact.type || 'JOB', // JOB, Property Manager, or BILLING
          active: 1
        };

        console.log(`   Linking ${contact.first} ${contact.last} to job`);

        const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(jobContactData)
        });

        if (response.ok) {
          console.log(`   ✅ ${contact.first} linked to job`);
        }
      }
      console.log('');
    }

    // STEP 5: Add Attachment (Optional - typically the ETS PO PDF)
    if (jobInfo.attachment) {
      console.log('📎 Adding ETS Purchase Order attachment...');

      // If filePath is provided, read the file
      let fileContent = jobInfo.attachment.content;
      if (jobInfo.attachment.filePath) {
        const fs = require('fs');
        fileContent = fs.readFileSync(jobInfo.attachment.filePath);
      }

      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', fileContent, jobInfo.attachment.filename);

      const attachResponse = await fetch(
        `${SERVICEM8_API_BASE}/Attachment/${jobUUID}.file`,
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeaders().Authorization,
            ...formData.getHeaders()
          },
          body: formData
        }
      );

      if (attachResponse.ok) {
        console.log(`✅ ETS PO attached: ${jobInfo.attachment.filename}`);
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

// Example usage for ETS
const exampleSiteInfo = {
  name: 'Bunnings Warehouse - Newstead',
  address: '15 Breakfast Creek Road, Newstead QLD 4006',
  email: 'trade.newstead@bunnings.com.au',
  phone: '07 3114 3200'
};

const exampleJobInfo = {
  purchase_order_number: 'ETS-BUN-NEWS-001',
  status: 'Work Order',
  job_address: '15 Breakfast Creek Road, Newstead QLD 4006',
  job_description: `URGENCY: HIGH
Contact during business hours to schedule job
Service window: Monday-Saturday 6am-10pm
Response time: Within 24 hours

-----------------------------------

JOB DETAILS:
Electrical repair - Trade desk power tools section
- Investigate intermittent power issues at tool display
- Replace damaged GPO outlets (x4)
- Test and tag all display power tools
- Install surge protection for sensitive equipment
- Provide electrical safety certificate

For any changes or variations to this work order, please contact:
Sustaine - 1300 227 266 or Admin@Sustaine.com.au

Site access: Trade desk supervisor has keys
Safety requirements: Safety boots, hi-vis vest required`,
  
  work_done_description: `BILLING INSTRUCTIONS:
==================
Bill To: ETS Head Office (via Smart Contacts)
PO Reference: ETS-BUN-NEWS-001

APPROVAL LIMIT: $750 + GST

Any work exceeding this amount requires prior approval from ETS.
For variations or additional work beyond approved limit:
- Contact Sustaine Office: 1300 227 266
- Email: Admin@Sustaine.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,
  
  category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
  scheduled_start: '2024-01-15 09:00:00',
  scheduled_duration: 120
};

const exampleContacts = {
  site_contact: {
    first: 'Robert',
    last: 'Anderson',
    email: 'robert.anderson@bunnings.com.au',
    mobile: '0434 123 456',
    phone: '07 3114 3200'
  },
  property_manager: {
    first: 'Emma',
    last: 'Williams',
    email: 'emma.williams@scentre.com.au',
    mobile: '0445 789 012'
  },
  billing_contact: {
    first: 'Accounts',
    last: 'Payable',
    email: 'accounts@bunnings.com.au',
    phone: '03 8831 9777'
  }
};

// Optional: Add checklist items after job creation
async function addChecklistToJob(jobUUID) {
  const checklistItems = [
    { text: 'Check site safety compliance', order: 1 },
    { text: 'Complete risk assessment form', order: 2 },
    { text: 'Take before photos', order: 3 },
    { text: 'Verify site access requirements', order: 4 },
    { text: 'Confirm approval limit with Sustaine', order: 5 },
    { text: 'Complete work as per specification', order: 6 },
    { text: 'Take after photos', order: 7 },
    { text: 'Clean up site', order: 8 },
    { text: 'Get client sign-off', order: 9 },
    { text: 'Submit invoice to ETS', order: 10 }
  ];

  console.log('✅ Adding standard checklist to job...');

  for (const item of checklistItems) {
    const checklistData = {
      job_uuid: jobUUID,
      name: item.text,  // Use 'name' field for the text
      item_type: 'Todo',
      sort_order: item.order,
      active: 1
    };

    try {
      const response = await fetch(`${SERVICEM8_API_BASE}/jobchecklist.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checklistData)
      });

      if (response.ok) {
        console.log(`   ✅ Added: ${item.text}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Failed to add: ${item.text}`);
    }
  }
}

// Run the example
// createJobWithSmartContacts(exampleSiteInfo, exampleJobInfo, exampleContacts)
//   .then(result => {
//     console.log('Result:', result);
//     // Optionally add checklist
//     // if (result.success && result.jobUUID) {
//     //   return addChecklistToJob(result.jobUUID);
//     // }
//   })
//   .catch(error => console.error('Error:', error));

console.log('🎯 ETS Smart Contacts Workflow Script Ready');
console.log('=========================================');
console.log('This script creates jobs for ETS with:');
console.log('1. Site creation/linking under ETS (UUID: 971d644f-d6a8-479c-a901-1f9b0425d7bb)');
console.log('2. Jobs with proper billing separation');
console.log('3. All required contacts (Site, Property Manager, Billing)');
console.log('4. Optional document attachments');
console.log('5. Optional checklist items (use addChecklistToJob function)');
console.log('');
console.log('⚠️  Important: Use your ServiceM8 API key');
console.log('📝 Reference: 3_Job_Template.json for all available fields');