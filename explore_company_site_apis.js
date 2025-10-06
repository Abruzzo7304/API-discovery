// Explore company and site linking APIs for Smart Contacts
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Explore company-related endpoints
async function exploreCompanyAPIs() {
  console.log('🏢 EXPLORING COMPANY & SITE APIS');
  console.log('=================================\n');

  // Test various possible endpoints
  const endpoints = [
    'company.json',
    'companycontact.json',
    'site.json',
    'company_site.json',
    'companysite.json',
    'location.json',
    'company_location.json',
    'branch.json',
    'subsidiary.json',
    'smart_contact.json',
    'smartcontact.json'
  ];

  const workingEndpoints = [];

  console.log('1️⃣  TESTING ENDPOINTS...\n');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SERVICEM8_API_BASE}/${endpoint}?$top=1`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        console.log(`✅ ${endpoint} - EXISTS`);
        workingEndpoints.push(endpoint);
      } else if (response.status === 400) {
        const errorText = await response.text();
        if (!errorText.includes('is not an authorised object type')) {
          console.log(`⚠️  ${endpoint} - Bad request but might exist`);
        } else {
          console.log(`❌ ${endpoint} - Does not exist`);
        }
      } else {
        console.log(`❌ ${endpoint} - Status ${response.status}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint} - Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n2️⃣  EXPLORING COMPANY STRUCTURE...\n');

  // Get a sample company to examine fields
  try {
    const companyResponse = await fetch(`${SERVICEM8_API_BASE}/company.json?$top=3`, {
      headers: getAuthHeaders()
    });

    if (companyResponse.ok) {
      const companies = await companyResponse.json();

      if (companies.length > 0) {
        console.log('📋 COMPANY FIELDS:');
        const sampleCompany = companies[0];
        Object.keys(sampleCompany).forEach(key => {
          // Look for fields that might relate to sites or parent/child relationships
          if (key.includes('site') || key.includes('parent') || key.includes('head') ||
              key.includes('branch') || key.includes('location') || key.includes('smart')) {
            console.log(`   🔍 ${key}: ${sampleCompany[key]}`);
          }
        });

        // Show all fields for reference
        console.log('\n   All fields:');
        Object.keys(sampleCompany).forEach(key => {
          if (sampleCompany[key] !== null && sampleCompany[key] !== '' && sampleCompany[key] !== 0) {
            console.log(`   ${key}: ${typeof sampleCompany[key] === 'object' ? JSON.stringify(sampleCompany[key]) : sampleCompany[key]}`);
          }
        });
      }
    }
  } catch (error) {
    console.log(`Error exploring company: ${error.message}`);
  }

  console.log('\n\n3️⃣  EXPLORING COMPANY CONTACTS...\n');

  // Check CompanyContact for site relationships
  try {
    const contactResponse = await fetch(`${SERVICEM8_API_BASE}/companycontact.json?$top=5`, {
      headers: getAuthHeaders()
    });

    if (contactResponse.ok) {
      const contacts = await contactResponse.json();

      if (contacts.length > 0) {
        console.log('📋 COMPANY CONTACT FIELDS:');
        const sampleContact = contacts[0];

        // Show structure
        Object.keys(sampleContact).forEach(key => {
          if (sampleContact[key] !== null && sampleContact[key] !== '' && sampleContact[key] !== 0) {
            console.log(`   ${key}: ${typeof sampleContact[key] === 'object' ? JSON.stringify(sampleContact[key]) : sampleContact[key]}`);
          }
        });

        // Look for parent-child relationships
        console.log('\n🔗 CHECKING FOR RELATIONSHIPS:');
        contacts.forEach(contact => {
          if (contact.company_uuid) {
            console.log(`   Contact ${contact.uuid}`);
            console.log(`   - Company: ${contact.company_uuid}`);
            if (contact.type) console.log(`   - Type: ${contact.type}`);
            if (contact.is_site) console.log(`   - Is Site: ${contact.is_site}`);
          }
        });
      }
    }
  } catch (error) {
    console.log(`Error exploring contacts: ${error.message}`);
  }

  console.log('\n\n4️⃣  TESTING SITE CREATION...\n');

  // Test if we can identify sites vs head offices
  try {
    const etsResponse = await fetch(`${SERVICEM8_API_BASE}/company/971d644f-d6a8-479c-a901-1f9b0425d7bb.json`, {
      headers: getAuthHeaders()
    });

    if (etsResponse.ok) {
      const etsCompany = await etsResponse.json();
      console.log('🏢 ETS COMPANY STRUCTURE:');

      // Check for site-related fields
      const siteFields = ['is_site', 'parent_company', 'head_office', 'site_of', 'sites', 'has_sites'];
      siteFields.forEach(field => {
        if (field in etsCompany) {
          console.log(`   ${field}: ${etsCompany[field]}`);
        }
      });

      // Check all boolean/relationship fields
      Object.keys(etsCompany).forEach(key => {
        const value = etsCompany[key];
        if (typeof value === 'boolean' || key.includes('uuid') || key.includes('parent') || key.includes('site')) {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
  } catch (error) {
    console.log(`Error checking ETS: ${error.message}`);
  }

  console.log('\n\n5️⃣  SEARCHING FOR SITES...\n');

  // Try to find companies that might be sites
  try {
    const allCompaniesResponse = await fetch(`${SERVICEM8_API_BASE}/company.json`, {
      headers: getAuthHeaders()
    });

    if (allCompaniesResponse.ok) {
      const allCompanies = await allCompaniesResponse.json();

      // Look for patterns in company names that suggest sites
      const potentialSites = allCompanies.filter(company => {
        const name = (company.name || '').toLowerCase();
        return name.includes('site') || name.includes('branch') || name.includes(' - ') ||
               name.includes('location') || name.includes('store');
      });

      if (potentialSites.length > 0) {
        console.log(`Found ${potentialSites.length} potential site companies:`);
        potentialSites.slice(0, 5).forEach(site => {
          console.log(`   - ${site.name}`);
          if (site.parent_company_uuid) {
            console.log(`     Parent: ${site.parent_company_uuid}`);
          }
        });
      }

      // Check if any companies have a parent_company_uuid or similar field
      const companiesWithParent = allCompanies.filter(c => c.parent_company_uuid || c.head_office_uuid);
      if (companiesWithParent.length > 0) {
        console.log(`\n🔗 Companies with parent relationships: ${companiesWithParent.length}`);
      }
    }
  } catch (error) {
    console.log(`Error searching sites: ${error.message}`);
  }

  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  console.log('Working endpoints found:');
  workingEndpoints.forEach(ep => console.log(`   - ${ep}`));

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Smart Contacts likely uses the existing company.json endpoint');
  console.log('2. Sites might be linked through a parent_company_uuid or similar field');
  console.log('3. Check if company has new fields after enabling Smart Contacts');
  console.log('4. CompanyContact might store the site relationships');
}

// Run exploration
exploreCompanyAPIs();