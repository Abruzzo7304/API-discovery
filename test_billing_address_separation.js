// Test if we can separate billing address from job address
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Test billing address separation
async function testBillingAddressSeparation() {
  console.log('🧪 TESTING BILLING ADDRESS SEPARATION');
  console.log('======================================\n');

  try {
    // First, create a proper site with parent
    console.log('1️⃣  CREATING TEST SITE WITH PARENT...\n');

    const siteData = {
      name: 'TEST SITE - McDonalds Toowong',
      parent_company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb', // ETS
      billing_address: 'McDonalds Australia\nPO Box 5236\nSydney NSW 2000', // Head office billing
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
      // Check if created
      const checkSite = await fetch(
        `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'TEST SITE - McDonalds Toowong'`,
        { headers: getAuthHeaders() }
      );
      if (checkSite.ok) {
        const sites = await checkSite.json();
        if (sites.length > 0) {
          siteUUID = sites[0].uuid;
          console.log(`✅ Site created: ${siteUUID}`);
          console.log(`   Site billing: Sydney NSW (Head office)\n`);
        }
      }
    }

    if (!siteUUID) {
      console.log('❌ Failed to create site');
      return;
    }

    // Now test different job creation methods
    console.log('2️⃣  TESTING DIFFERENT JOB CREATION METHODS...\n');

    const testMethods = [
      {
        name: 'Method 1: Separate billing_address field',
        data: {
          company_uuid: siteUUID,
          status: 'Work Order',
          job_address: '530 Milton Road, Toowong QLD 4066', // Store location
          billing_address: 'McDonalds Australia\nPO Box 5236\nSydney NSW 2000', // Different billing
          job_description: 'Test job with separate billing address'
        }
      },
      {
        name: 'Method 2: Only job_address (let site handle billing)',
        data: {
          company_uuid: siteUUID,
          status: 'Work Order',
          job_address: '530 Milton Road, Toowong QLD 4066', // Store location only
          job_description: 'Test job - billing from site company'
        }
      }
    ];

    for (const method of testMethods) {
      console.log(`🔬 ${method.name}`);
      console.log('   Creating job...');

      const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(method.data)
      });

      const jobText = await jobResponse.text();
      let jobUUID, jobNumber;

      if (jobText.includes('<!DOCTYPE')) {
        // Check if created
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
        try {
          const job = JSON.parse(jobText);
          jobUUID = job.uuid;
          jobNumber = job.generated_job_id;
        } catch (e) {}
      }

      if (jobUUID) {
        console.log(`   ✅ Job created: ${jobNumber}`);

        // Get job details to check addresses
        const jobDetails = await fetch(`${SERVICEM8_API_BASE}/job/${jobUUID}.json`, {
          headers: getAuthHeaders()
        });

        if (jobDetails.ok) {
          const job = await jobDetails.json();
          console.log(`   📍 Job address: ${job.job_address}`);
          console.log(`   💰 Billing address: ${job.billing_address}`);
          console.log(`   Same? ${job.job_address === job.billing_address ? '❌ YES (Problem!)' : '✅ NO (Good!)'}\n`);

          // Clean up test job
          await fetch(`${SERVICEM8_API_BASE}/job/${jobUUID}.json`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        }
      } else {
        console.log('   ❌ Job creation failed\n');
      }
    }

    // Test JobContact types
    console.log('3️⃣  TESTING JOBCONTACT TYPES...\n');

    // Create a test job to add contacts to
    const testJobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        company_uuid: siteUUID,
        status: 'Work Order',
        job_address: '530 Milton Road, Toowong QLD 4066',
        job_description: 'Test job for contact types'
      })
    });

    let testJobUUID;
    const testJobText = await testJobResponse.text();

    if (testJobText.includes('<!DOCTYPE')) {
      const checkJob = await fetch(
        `${SERVICEM8_API_BASE}/job.json?company_uuid=${siteUUID}&$orderby=date desc&$top=1`,
        { headers: getAuthHeaders() }
      );
      if (checkJob.ok) {
        const jobs = await checkJob.json();
        if (jobs.length > 0) {
          testJobUUID = jobs[0].uuid;
        }
      }
    }

    if (testJobUUID) {
      console.log('Testing JobContact types:\n');

      const contactTypes = [
        { type: 'JOB', name: 'Job Contact' },
        { type: 'SITE', name: 'Site Contact' },
        { type: 'SITE_CONTACT', name: 'Site Contact (alt)' },
        { type: 'Site Contact', name: 'Site Contact (full)' },
        { type: 'TENANT', name: 'Tenant' },
        { type: 'Tenant', name: 'Tenant (full)' },
        { type: 'PROPERTY_OWNER', name: 'Property Owner' },
        { type: 'Property Owner', name: 'Property Owner (full)' },
        { type: 'PROPERTY_MANAGER', name: 'Property Manager' },
        { type: 'Property Manager', name: 'Property Manager (full)' },
        { type: 'BILLING', name: 'Billing Contact' }
      ];

      for (const contactType of contactTypes) {
        const contactData = {
          job_uuid: testJobUUID,
          first: 'Test',
          last: contactType.name,
          email: 'test@example.com',
          mobile: '0400000000',
          type: contactType.type,
          active: 1
        };

        const contactResponse = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(contactData)
        });

        if (contactResponse.ok) {
          console.log(`   ✅ ${contactType.name}: Type "${contactType.type}" WORKS`);
        } else {
          const errorText = await contactResponse.text();
          if (errorText.includes('type')) {
            console.log(`   ❌ ${contactType.name}: Type "${contactType.type}" not valid`);
          } else {
            console.log(`   ⚠️  ${contactType.name}: Type "${contactType.type}" error`);
          }
        }
      }

      // Clean up test job
      await fetch(`${SERVICEM8_API_BASE}/job/${testJobUUID}.json`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    }

    // Clean up test site
    console.log('\n🗑️  Cleaning up test site...');
    await fetch(`${SERVICEM8_API_BASE}/company/${siteUUID}.json`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    console.log('✅ Test site deleted');

    console.log('\n\n💡 FINDINGS:');
    console.log('============');
    console.log('1. billing_address field exists but may be auto-set to job_address');
    console.log('2. Site billing address may not automatically apply to jobs');
    console.log('3. JobContact types are limited to specific values');
    console.log('4. May need to update billing address after job creation');
    console.log('5. ServiceM8 might handle billing at invoice time, not job creation');

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run test
testBillingAddressSeparation();