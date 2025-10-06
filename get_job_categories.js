// Get actual job categories from ServiceM8
const { getAuthHeaders } = require('./config');

async function getJobCategories() {
  console.log('🔍 Fetching Job Categories from ServiceM8');
  console.log('=========================================\n');

  try {
    // Try to get categories
    const response = await fetch(
      'https://api.servicem8.com/api_1.0/category.json',
      { headers: getAuthHeaders() }
    );

    if (response.ok) {
      const categories = await response.json();

      console.log(`Found ${categories.length} categories:\n`);

      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   UUID: ${cat.uuid}`);
        console.log(`   Active: ${cat.active}`);
        if (cat.parent_category_uuid) {
          console.log(`   Parent: ${cat.parent_category_uuid}`);
        }
        console.log('');
      });

      // Group by parent if there are subcategories
      const topLevel = categories.filter(c => !c.parent_category_uuid);
      if (topLevel.length < categories.length) {
        console.log('\n📊 HIERARCHY VIEW:');
        console.log('==================');
        topLevel.forEach(parent => {
          console.log(`\n${parent.name}`);
          const children = categories.filter(c => c.parent_category_uuid === parent.uuid);
          children.forEach(child => {
            console.log(`  - ${child.name}`);
          });
        });
      }

      // Get the UUIDs we've been using and check if they exist
      console.log('\n🔍 Checking UUIDs from template:');
      console.log('==================================');
      const templateUUIDs = [
        { uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', name: 'Electrical' },
        { uuid: '7fe91a29-af35-455e-8f35-f4cb689b345f', name: 'Plumbing' },
        { uuid: '8ab8e2d8-f533-4b20-838a-2f48ae55de17', name: 'HVAC' },
        { uuid: 'e37dd408-c880-4de8-b465-9a267a7d8c50', name: 'Building/Carpentry' },
        { uuid: 'e963c0de-66e0-4cd0-8e71-cfab5bb1e679', name: 'Cleaning' },
        { uuid: 'b7ddfeaf-e5c4-4a84-a7da-9302cdb7a136', name: 'Locksmith' },
        { uuid: 'c42834a9-f7e4-49f8-bd58-dfeea970e7a6', name: 'Pest Control' },
        { uuid: 'baf9ad74-4e72-4b56-a1c0-8dcd956e8a8e', name: 'Fire Safety' },
        { uuid: '73dd1d38-b5e0-49b8-bb31-1aa0e1f387ce', name: 'Glass & Glazing' }
      ];

      templateUUIDs.forEach(template => {
        const found = categories.find(c => c.uuid === template.uuid);
        if (found) {
          console.log(`✅ ${template.name} → Found as "${found.name}"`);
        } else {
          console.log(`❌ ${template.name} → UUID not found`);
        }
      });

    } else {
      console.log('Failed to get categories:', response.status);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

getJobCategories();