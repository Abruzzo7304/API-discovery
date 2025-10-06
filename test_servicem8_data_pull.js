// Test pull of ServiceM8 data
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Pull various ServiceM8 data
async function pullServiceM8Data() {
  console.log('📊 SERVICEM8 DATA PULL TEST');
  console.log('============================');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {};

  try {
    // 1. Pull Jobs
    console.log('1️⃣  PULLING JOBS...');
    const jobsResponse = await fetch(`${SERVICEM8_API_BASE}/job.json?$top=10&$orderby=date desc`, {
      headers: getAuthHeaders()
    });

    if (jobsResponse.ok) {
      const jobs = await jobsResponse.json();
      console.log(`   ✅ Found ${jobs.length} recent jobs`);
      results.jobs = jobs;

      // Show sample job structure
      if (jobs.length > 0) {
        console.log('   Sample job fields:');
        const sampleJob = jobs[0];
        console.log(`   - Job Number: ${sampleJob.generated_job_id}`);
        console.log(`   - Status: ${sampleJob.status}`);
        console.log(`   - Company UUID: ${sampleJob.company_uuid}`);
        console.log(`   - Category UUID: ${sampleJob.category_uuid}`);
        console.log(`   - Queue UUID: ${sampleJob.queue_uuid || 'None'}`);
        console.log(`   - Active Network Request: ${sampleJob.active_network_request_uuid || 'None'}`);
      }
    } else {
      console.log(`   ❌ Failed to fetch jobs: ${jobsResponse.status}`);
    }

    console.log('');

    // 2. Pull Categories
    console.log('2️⃣  PULLING JOB CATEGORIES...');
    const categoriesResponse = await fetch(`${SERVICEM8_API_BASE}/category.json`, {
      headers: getAuthHeaders()
    });

    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`   ✅ Found ${categories.length} categories`);
      results.categories = categories;

      // List all categories
      console.log('   Categories:');
      categories.forEach(cat => {
        console.log(`   - ${cat.name} | ${cat.uuid}`);
      });
    } else {
      console.log(`   ❌ Failed to fetch categories: ${categoriesResponse.status}`);
    }

    console.log('');

    // 3. Pull Companies
    console.log('3️⃣  PULLING COMPANIES...');
    const companiesResponse = await fetch(`${SERVICEM8_API_BASE}/company.json?$top=5&$orderby=edit_date desc`, {
      headers: getAuthHeaders()
    });

    if (companiesResponse.ok) {
      const companies = await companiesResponse.json();
      console.log(`   ✅ Found ${companies.length} recent companies`);
      results.companies = companies;

      // Show ETS company if found
      const etsCompany = companies.find(c => c.uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb');
      if (etsCompany) {
        console.log('   📍 ETS Company found:');
        console.log(`      Name: ${etsCompany.name}`);
        console.log(`      UUID: ${etsCompany.uuid}`);
      }
    } else {
      console.log(`   ❌ Failed to fetch companies: ${companiesResponse.status}`);
    }

    console.log('');

    // 4. Pull Queues
    console.log('4️⃣  PULLING QUEUES...');
    const queuesResponse = await fetch(`${SERVICEM8_API_BASE}/queue.json`, {
      headers: getAuthHeaders()
    });

    if (queuesResponse.ok) {
      const queues = await queuesResponse.json();
      console.log(`   ✅ Found ${queues.length} queues`);
      results.queues = queues;

      // List all queues
      console.log('   Queues:');
      queues.forEach(queue => {
        console.log(`   - ${queue.name} | ${queue.uuid}`);
        if (queue.name === 'TEE New job') {
          console.log(`     ^ CRITICAL QUEUE`);
        }
      });
    } else {
      console.log(`   ❌ Failed to fetch queues: ${queuesResponse.status}`);
    }

    console.log('');

    // 5. Pull Badges
    console.log('5️⃣  PULLING BADGES...');
    const badgesResponse = await fetch(`${SERVICEM8_API_BASE}/badge.json`, {
      headers: getAuthHeaders()
    });

    if (badgesResponse.ok) {
      const badges = await badgesResponse.json();
      console.log(`   ✅ Found ${badges.length} badges`);
      results.badges = badges;

      // Find ETS badge
      const etsBadge = badges.find(b => b.name === 'ETS Job');
      if (etsBadge) {
        console.log(`   📍 ETS Job badge: ${etsBadge.uuid}`);
      }

      // Show some badge names
      console.log('   Sample badges:');
      badges.slice(0, 5).forEach(badge => {
        console.log(`   - ${badge.name}`);
      });
    } else {
      console.log(`   ❌ Failed to fetch badges: ${badgesResponse.status}`);
    }

    console.log('');

    // 6. Pull Staff
    console.log('6️⃣  PULLING STAFF...');
    const staffResponse = await fetch(`${SERVICEM8_API_BASE}/staff.json`, {
      headers: getAuthHeaders()
    });

    if (staffResponse.ok) {
      const staff = await staffResponse.json();
      console.log(`   ✅ Found ${staff.length} staff members`);
      results.staff = staff;

      console.log('   Staff members:');
      staff.forEach(member => {
        console.log(`   - ${member.first} ${member.last || ''} | ${member.email || 'No email'}`);
      });
    } else {
      console.log(`   ❌ Failed to fetch staff: ${staffResponse.status}`);
    }

    console.log('');

    // 7. Pull Vendor (for Network Contacts)
    console.log('7️⃣  PULLING VENDORS...');
    const vendorResponse = await fetch(`${SERVICEM8_API_BASE}/vendor.json`, {
      headers: getAuthHeaders()
    });

    if (vendorResponse.ok) {
      const vendors = await vendorResponse.json();
      console.log(`   ✅ Found ${vendors.length} vendor(s)`);
      results.vendors = vendors;

      vendors.forEach(vendor => {
        console.log(`   - ${vendor.name}`);
        console.log(`     ABN: ${vendor.abn_number || 'None'}`);
        console.log(`     Email: ${vendor.email || 'None'}`);
      });
    } else {
      console.log(`   ❌ Failed to fetch vendors: ${vendorResponse.status}`);
    }

    console.log('');

    // Summary
    console.log('📈 DATA PULL SUMMARY');
    console.log('====================');
    console.log(`✅ Successfully pulled:`);
    if (results.jobs) console.log(`   - ${results.jobs.length} jobs`);
    if (results.categories) console.log(`   - ${results.categories.length} categories`);
    if (results.companies) console.log(`   - ${results.companies.length} companies`);
    if (results.queues) console.log(`   - ${results.queues.length} queues`);
    if (results.badges) console.log(`   - ${results.badges.length} badges`);
    if (results.staff) console.log(`   - ${results.staff.length} staff`);
    if (results.vendors) console.log(`   - ${results.vendors.length} vendors`);

    console.log('\n💡 KEY FINDINGS:');
    console.log('================');

    // Check for ETS setup
    const etsCompanyExists = results.companies && results.companies.some(c => c.uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb');
    const etsBadgeExists = results.badges && results.badges.some(b => b.name === 'ETS Job');
    const teeQueueExists = results.queues && results.queues.some(q => q.name === 'TEE New job');

    console.log(`ETS Company configured: ${etsCompanyExists ? '✅' : '❌'}`);
    console.log(`ETS Job badge exists: ${etsBadgeExists ? '✅' : '❌'}`);
    console.log(`TEE New job queue exists: ${teeQueueExists ? '✅' : '❌'}`);

    // Check job categories match template
    if (results.categories) {
      const templateCategories = [
        'Make Safe',
        'Electrical',
        'Level Two',
        'AC install',
        'Re-wire',
        'Warranty',
        'Generator',
        'Data, Phone',
        'Solar, Battery, Grid',
        'Energy Efficiency',
        'Security, CCTV, Access control'
      ];

      const foundCategories = results.categories.map(c => c.name);
      const matchingCategories = templateCategories.filter(tc =>
        foundCategories.some(fc => fc.toLowerCase().includes(tc.toLowerCase().split(',')[0]))
      );

      console.log(`\nJob categories matching template: ${matchingCategories.length}/${templateCategories.length}`);
    }

    return results;

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the data pull
pullServiceM8Data();