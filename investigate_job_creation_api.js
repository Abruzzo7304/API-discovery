// Investigate job creation API fields and workflow
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Investigate job API structure
async function investigateJobAPI() {
  console.log('🔍 INVESTIGATING JOB CREATION API');
  console.log('==================================\n');

  try {
    // Step 1: Get a recent job to see all available fields
    console.log('1️⃣  FETCHING RECENT JOB TO EXAMINE FIELDS...\n');

    const recentJobResponse = await fetch(
      `${SERVICEM8_API_BASE}/job.json?$orderby=date desc&$top=1`,
      { headers: getAuthHeaders() }
    );

    if (recentJobResponse.ok) {
      const jobs = await recentJobResponse.json();
      if (jobs.length > 0) {
        const job = jobs[0];

        console.log('📋 ALL JOB FIELDS:');
        console.log('==================');

        // Look for billing/invoice related fields
        console.log('\n💰 BILLING/INVOICE FIELDS:');
        Object.keys(job).forEach(key => {
          if (key.includes('billing') || key.includes('invoice') || key.includes('address')) {
            console.log(`   ${key}: ${job[key] || 'null'}`);
          }
        });

        // Look for contact related fields
        console.log('\n👤 CONTACT RELATED FIELDS:');
        Object.keys(job).forEach(key => {
          if (key.includes('contact') || key.includes('tenant') || key.includes('property') || key.includes('site')) {
            console.log(`   ${key}: ${job[key] || 'null'}`);
          }
        });

        // Look for company related fields
        console.log('\n🏢 COMPANY RELATED FIELDS:');
        Object.keys(job).forEach(key => {
          if (key.includes('company') || key.includes('client')) {
            console.log(`   ${key}: ${job[key] || 'null'}`);
          }
        });

        // Check all boolean fields
        console.log('\n✅ BOOLEAN/FLAG FIELDS:');
        Object.keys(job).forEach(key => {
          if (typeof job[key] === 'boolean' || job[key] === 0 || job[key] === 1) {
            if (!key.includes('geo') && !key.includes('payment')) {
              console.log(`   ${key}: ${job[key]}`);
            }
          }
        });
      }
    }

    // Step 2: Check company structure for sites
    console.log('\n\n2️⃣  CHECKING SITE COMPANY STRUCTURE...\n');

    // Get a site with parent
    const siteResponse = await fetch(
      `${SERVICEM8_API_BASE}/company.json?$filter=parent_company_uuid ne null&$top=1`,
      { headers: getAuthHeaders() }
    );

    if (siteResponse.ok) {
      const sites = await siteResponse.json();
      if (sites.length > 0) {
        const site = sites[0];

        console.log('🏢 SITE COMPANY FIELDS:');
        console.log('=======================');

        // Show address fields
        console.log('\n📍 ADDRESS FIELDS:');
        Object.keys(site).forEach(key => {
          if (key.includes('address') || key.includes('location')) {
            console.log(`   ${key}: ${site[key] || 'null'}`);
          }
        });

        // Get parent company
        if (site.parent_company_uuid) {
          console.log('\n🏢 PARENT COMPANY:');
          const parentResponse = await fetch(
            `${SERVICEM8_API_BASE}/company/${site.parent_company_uuid}.json`,
            { headers: getAuthHeaders() }
          );

          if (parentResponse.ok) {
            const parent = await parentResponse.json();
            console.log(`   Name: ${parent.name}`);
            console.log(`   Billing Address: ${parent.billing_address || 'null'}`);
          }
        }
      }
    }

    // Step 3: Test different job creation approaches
    console.log('\n\n3️⃣  TESTING JOB CREATION APPROACHES...\n');

    const testApproaches = [
      {
        name: 'Approach 1: Direct field setting',
        data: {
          company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb',
          job_address: '123 Job Site Street',
          billing_address: '456 Corporate Billing Road',
          invoice_address: '456 Corporate Billing Road',
          site_address: '123 Job Site Street'
        }
      },
      {
        name: 'Approach 2: Billing same as job site flag',
        data: {
          company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb',
          job_address: '123 Job Site Street',
          billing_address: '456 Corporate Billing Road',
          billing_same_as_job_site: 0,
          invoice_same_as_job_site: 0
        }
      },
      {
        name: 'Approach 3: Site UUID with separate billing',
        data: {
          company_uuid: 'site-uuid-here',
          job_address: '123 Job Site Street',
          use_parent_billing: 1,
          bill_to_parent: 1
        }
      }
    ];

    console.log('🧪 Testing field combinations:');
    console.log('==============================');

    testApproaches.forEach(approach => {
      console.log(`\n${approach.name}:`);
      Object.keys(approach.data).forEach(key => {
        console.log(`   ${key}: ${approach.data[key]}`);
      });
    });

    // Step 4: Check JobContact types
    console.log('\n\n4️⃣  CHECKING JOBCONTACT TYPES...\n');

    const jobContactResponse = await fetch(
      `${SERVICEM8_API_BASE}/jobcontact.json?$top=10`,
      { headers: getAuthHeaders() }
    );

    if (jobContactResponse.ok) {
      const jobContacts = await jobContactResponse.json();

      console.log('👤 JOBCONTACT TYPES FOUND:');
      const types = new Set();
      jobContacts.forEach(contact => {
        if (contact.type) {
          types.add(contact.type);
        }
      });

      types.forEach(type => {
        console.log(`   - ${type}`);
      });

      // Show sample JobContact structure
      if (jobContacts.length > 0) {
        console.log('\n📋 SAMPLE JOBCONTACT STRUCTURE:');
        const sample = jobContacts[0];
        Object.keys(sample).forEach(key => {
          console.log(`   ${key}: ${typeof sample[key] === 'object' ? JSON.stringify(sample[key]) : sample[key]}`);
        });
      }
    }

    // Step 5: Look for specific endpoints
    console.log('\n\n5️⃣  CHECKING FOR SPECIFIC ENDPOINTS...\n');

    const endpoints = [
      'jobsite.json',
      'job_site.json',
      'site.json',
      'job_billing.json',
      'invoice_settings.json'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}?$top=1`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          console.log(`✅ ${endpoint} EXISTS`);
        } else if (response.status === 400) {
          const text = await response.text();
          if (text.includes('not an authorised object type')) {
            console.log(`❌ ${endpoint} - Does not exist`);
          } else {
            console.log(`⚠️  ${endpoint} - Bad request`);
          }
        } else {
          console.log(`❌ ${endpoint} - Status ${response.status}`);
        }
      } catch (error) {
        console.log(`💥 ${endpoint} - Error`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n\n💡 RECOMMENDATIONS:');
    console.log('====================');
    console.log('1. Check if billing_address field accepts different value than job_address');
    console.log('2. Look for billing_same_as_job_site or similar flag');
    console.log('3. Verify if site\'s parent billing address is used automatically');
    console.log('4. JobContacts must be added after job creation');
    console.log('5. Contact types might be limited to specific values');

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run investigation
investigateJobAPI();