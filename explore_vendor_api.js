// Explore the vendor.json API endpoint
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Explore vendor endpoint in detail
async function exploreVendorAPI() {
  console.log('🔍 EXPLORING VENDOR API');
  console.log('=======================');

  try {
    // Get all vendors
    console.log('📡 Fetching all vendors...');
    const response = await fetch(`${SERVICEM8_API_BASE}/vendor.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const vendors = await response.json();
      console.log(`✅ Found ${vendors.length} vendor records\n`);

      if (vendors.length > 0) {
        console.log('📋 VENDOR STRUCTURE:');
        console.log('====================');

        const firstVendor = vendors[0];
        Object.keys(firstVendor).forEach(key => {
          console.log(`   ${key}: ${firstVendor[key]}`);
        });

        console.log('\n📊 ALL VENDOR RECORDS:');
        console.log('======================');
        vendors.forEach((vendor, index) => {
          console.log(`${index + 1}. ${vendor.name || 'Unnamed'}`);
          console.log(`   UUID: ${vendor.uuid}`);
          console.log(`   Email: ${vendor.email || 'No email'}`);
          console.log(`   ABN: ${vendor.abn_number || 'No ABN'}`);
          console.log(`   Active: ${vendor.active}`);
          console.log('');
        });
      }

      // Test vendor creation
      console.log('🛠️  TESTING VENDOR CREATION');
      console.log('============================');

      const testVendor = {
        name: 'Test Network Contractor',
        email: 'test@networkcontractor.com',
        abn_number: '12345678901',
        active: 1,
        website: 'https://testcontractor.com'
      };

      console.log('📝 Attempting to create test vendor...');
      const createResponse = await fetch(`${SERVICEM8_API_BASE}/vendor.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testVendor)
      });

      if (createResponse.ok) {
        const newVendor = await createResponse.json();
        console.log(`✅ SUCCESS - Created vendor with UUID: ${newVendor.uuid}`);
        console.log(`   Name: ${newVendor.name}`);
        console.log(`   Email: ${newVendor.email}`);

        // Test vendor update
        console.log('\n🔄 TESTING VENDOR UPDATE');
        console.log('========================');

        const updateData = {
          name: 'Updated Test Network Contractor',
          email: 'updated@networkcontractor.com'
        };

        const updateResponse = await fetch(`${SERVICEM8_API_BASE}/vendor/${newVendor.uuid}.json`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updateData)
        });

        if (updateResponse.ok) {
          const updatedVendor = await updateResponse.json();
          console.log(`✅ SUCCESS - Updated vendor`);
          console.log(`   New Name: ${updatedVendor.name}`);
          console.log(`   New Email: ${updatedVendor.email}`);
        }

        // Clean up - delete test vendor
        console.log('\n🗑️  CLEANING UP TEST VENDOR');
        console.log('============================');

        const deleteResponse = await fetch(`${SERVICEM8_API_BASE}/vendor/${newVendor.uuid}.json`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (deleteResponse.ok) {
          console.log(`✅ SUCCESS - Deleted test vendor`);
        } else {
          console.log(`⚠️  Failed to delete test vendor: ${deleteResponse.status}`);
        }

      } else {
        const errorText = await createResponse.text();
        console.log(`❌ FAILED to create vendor: ${createResponse.status}`);
        console.log(`Error: ${errorText.substring(0, 200)}`);
      }

    } else {
      console.log(`❌ Failed to fetch vendors: ${response.status}`);
    }

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Check if vendors can be linked to jobs
async function testVendorJobLinking() {
  console.log('\n\n🔗 TESTING VENDOR-JOB LINKING');
  console.log('==============================');

  // Check if there are any fields in jobs that reference vendors
  try {
    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json?$top=1`, {
      headers: getAuthHeaders()
    });

    if (jobResponse.ok) {
      const jobs = await jobResponse.json();
      if (jobs.length > 0) {
        const job = jobs[0];
        console.log('🔍 Checking job fields for vendor references:');

        const vendorFields = Object.keys(job).filter(key =>
          key.toLowerCase().includes('vendor') ||
          key.toLowerCase().includes('contractor') ||
          key.toLowerCase().includes('subcontractor') ||
          key.toLowerCase().includes('network')
        );

        if (vendorFields.length > 0) {
          console.log(`✅ Found potential vendor fields: ${vendorFields.join(', ')}`);
          vendorFields.forEach(field => {
            console.log(`   ${field}: ${job[field]}`);
          });
        } else {
          console.log('❌ No vendor-related fields found in job structure');
        }
      }
    }
  } catch (error) {
    console.log(`💥 Error checking job-vendor linking: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  await exploreVendorAPI();
  await testVendorJobLinking();

  console.log('\n\n📚 SUMMARY');
  console.log('==========');
  console.log('The vendor.json endpoint appears to be the closest thing to');
  console.log('Network Contact management available in the ServiceM8 API.');
  console.log('Vendors can store contractor/subcontractor information.');
}

runAllTests();