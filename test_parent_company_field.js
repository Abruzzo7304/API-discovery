// Test parent_company_uuid field for Smart Contacts
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Explore parent-child company relationships
async function exploreParentCompanyField() {
  console.log('🏢 EXPLORING PARENT COMPANY RELATIONSHIPS (SMART CONTACTS)');
  console.log('===========================================================\n');

  try {
    // Get all companies
    console.log('📊 Fetching all companies...\n');
    const response = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch companies: ${response.status}`);
      return;
    }

    const companies = await response.json();
    console.log(`✅ Found ${companies.length} companies\n`);

    // Find companies with parent_company_uuid
    const sites = companies.filter(c => c.parent_company_uuid && c.parent_company_uuid !== '');
    const headOffices = companies.filter(c => !c.parent_company_uuid || c.parent_company_uuid === '');

    console.log('📈 SMART CONTACTS STRUCTURE:');
    console.log('=============================');
    console.log(`Head Offices (no parent): ${headOffices.length}`);
    console.log(`Sites (with parent): ${sites.length}\n`);

    if (sites.length > 0) {
      console.log('🏭 SITES WITH PARENT COMPANIES:');
      console.log('================================');

      // Group sites by parent
      const sitesByParent = {};
      sites.forEach(site => {
        const parentId = site.parent_company_uuid;
        if (!sitesByParent[parentId]) {
          sitesByParent[parentId] = [];
        }
        sitesByParent[parentId].push(site);
      });

      // Display parent-site relationships
      Object.keys(sitesByParent).forEach(parentUuid => {
        const parent = companies.find(c => c.uuid === parentUuid);
        const parentName = parent ? parent.name : 'Unknown Parent';

        console.log(`\n📍 Parent: ${parentName}`);
        console.log(`   UUID: ${parentUuid}`);
        console.log(`   Sites (${sitesByParent[parentUuid].length}):`);

        sitesByParent[parentUuid].forEach(site => {
          console.log(`     • ${site.name}`);
          console.log(`       UUID: ${site.uuid}`);
          console.log(`       Address: ${site.billing_address || 'No address'}`);
        });
      });
    } else {
      console.log('❌ No sites with parent companies found');
      console.log('This could mean:');
      console.log('• Smart Contacts sites haven\'t been created yet');
      console.log('• Sites are linked differently');
    }

    console.log('\n\n🔬 TESTING SITE CREATION WITH PARENT:');
    console.log('======================================');

    // Create a test site under ETS
    const testSiteData = {
      name: 'TEST SITE - Brisbane Office',
      parent_company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb', // ETS UUID
      billing_address: '123 Test Street, Brisbane QLD 4000',
      email: 'brisbane@test.com',
      phone: '07 1234 5678',
      active: 1
    };

    console.log('📝 Creating test site under ETS...');
    console.log(`   Parent: Emergency Trade Services`);
    console.log(`   Site Name: ${testSiteData.name}`);

    const createResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(testSiteData)
    });

    if (createResponse.ok || createResponse.status === 200) {
      // Try to parse response
      const responseText = await createResponse.text();

      if (responseText.includes('<!DOCTYPE')) {
        console.log('⚠️  HTML response - checking if site was created...');

        // Check for the new site
        const checkResponse = await fetch(
          `${SERVICEM8_API_BASE}/company.json?$filter=name eq 'TEST SITE - Brisbane Office'`,
          { headers: getAuthHeaders() }
        );

        if (checkResponse.ok) {
          const foundSites = await checkResponse.json();
          if (foundSites.length > 0) {
            const newSite = foundSites[0];
            console.log('✅ Site created successfully!');
            console.log(`   UUID: ${newSite.uuid}`);
            console.log(`   Parent: ${newSite.parent_company_uuid}`);

            // Delete test site
            console.log('\n🗑️  Cleaning up test site...');
            const deleteResponse = await fetch(`${SERVICEM8_API_BASE}/company/${newSite.uuid}.json`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            });

            if (deleteResponse.ok) {
              console.log('✅ Test site deleted');
            }
          }
        }
      } else {
        try {
          const newSite = JSON.parse(responseText);
          console.log('✅ Site created successfully!');
          console.log(`   UUID: ${newSite.uuid}`);
          console.log(`   Parent: ${newSite.parent_company_uuid}`);

          // Delete test site
          console.log('\n🗑️  Cleaning up test site...');
          const deleteResponse = await fetch(`${SERVICEM8_API_BASE}/company/${newSite.uuid}.json`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });

          if (deleteResponse.ok) {
            console.log('✅ Test site deleted');
          }
        } catch (e) {
          console.log('⚠️  Could not parse response');
        }
      }
    } else {
      console.log(`❌ Failed to create site: ${createResponse.status}`);
    }

    console.log('\n\n💡 SMART CONTACTS API SUMMARY:');
    console.log('==============================');
    console.log('✅ Use parent_company_uuid field to link sites to head office');
    console.log('✅ Sites are regular company records with parent_company_uuid set');
    console.log('✅ Create jobs against specific sites (company_uuid = site UUID)');
    console.log('✅ Billing can roll up to head office through parent relationship');

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run exploration
exploreParentCompanyField();