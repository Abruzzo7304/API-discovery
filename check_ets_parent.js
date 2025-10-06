// Check if ETS has a parent_company_uuid
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Check ETS company structure
async function checkETSParent() {
  console.log('🏢 CHECKING ETS COMPANY STRUCTURE');
  console.log('==================================\n');

  const etsUUID = '971d644f-d6a8-479c-a901-1f9b0425d7bb';

  try {
    // Get ETS company details
    const response = await fetch(`${SERVICEM8_API_BASE}/company/${etsUUID}.json`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      console.log(`❌ Failed to fetch ETS: ${response.status}`);
      return;
    }

    const etsCompany = await response.json();

    console.log('📋 ETS COMPANY DETAILS:');
    console.log('=======================');
    console.log(`Name: ${etsCompany.name}`);
    console.log(`UUID: ${etsCompany.uuid}`);
    console.log(`Parent Company UUID: ${etsCompany.parent_company_uuid || 'NONE (Head Office)'}`);
    console.log(`Active: ${etsCompany.active}`);
    console.log(`Email: ${etsCompany.email || 'None'}`);
    console.log(`Address: ${etsCompany.billing_address || 'None'}`);

    if (etsCompany.parent_company_uuid) {
      console.log('\n⚠️  ETS IS A SITE!');
      console.log('==================');
      console.log('ETS has a parent company, meaning it\'s configured as a site, not a head office.');

      // Get parent company details
      console.log('\n🔍 Fetching parent company details...');
      const parentResponse = await fetch(`${SERVICEM8_API_BASE}/company/${etsCompany.parent_company_uuid}.json`, {
        headers: getAuthHeaders()
      });

      if (parentResponse.ok) {
        const parentCompany = await parentResponse.json();
        console.log(`\n📍 PARENT COMPANY:`);
        console.log(`   Name: ${parentCompany.name}`);
        console.log(`   UUID: ${parentCompany.uuid}`);
        console.log(`   Email: ${parentCompany.email || 'None'}`);
      }
    } else {
      console.log('\n✅ ETS IS A HEAD OFFICE');
      console.log('========================');
      console.log('ETS has no parent company, it\'s configured as a head office.');

      // Check if ETS has any sites
      console.log('\n🔍 Checking for ETS sites...');
      const allCompaniesResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
        headers: getAuthHeaders()
      });

      if (allCompaniesResponse.ok) {
        const allCompanies = await allCompaniesResponse.json();
        const etsSites = allCompanies.filter(c => c.parent_company_uuid === etsUUID);

        if (etsSites.length > 0) {
          console.log(`\n📍 ETS SITES (${etsSites.length}):`);
          etsSites.forEach(site => {
            console.log(`   • ${site.name}`);
            console.log(`     UUID: ${site.uuid}`);
            console.log(`     Address: ${site.billing_address || 'No address'}`);
          });
        } else {
          console.log('   No sites found under ETS');
        }
      }
    }

    console.log('\n\n💡 IMPLICATIONS FOR WORKFLOW:');
    console.log('=============================');
    if (etsCompany.parent_company_uuid) {
      console.log('Since ETS is a site:');
      console.log('• Jobs created with ETS UUID will be at site level');
      console.log('• Billing rolls up to the parent company');
      console.log('• May need to reconfigure if ETS should be head office');
    } else {
      console.log('Since ETS is a head office:');
      console.log('• Can create sites under ETS for different locations');
      console.log('• Jobs can be assigned to ETS directly or its sites');
      console.log('• ETS is the billing/invoice point');
    }

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run check
checkETSParent();