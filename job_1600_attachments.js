// ServiceM8 Job 1600 Attachment Details
// Read-only operation to get detailed attachment information

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Function to get detailed attachment information for Job 1600
async function getJob1600AttachmentDetails() {
  const jobUuid = '9af7ed45-351c-487d-ba31-234b20cd72fb'; // Job 1600 UUID

  try {
    console.log('🔍 Getting detailed attachment information for Job 1600...');

    // Get attachments with pagination to handle large numbers
    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?related_object_uuid=${jobUuid}&$orderby=edit_date desc&$top=50`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const attachments = await response.json();
    console.log(`📎 Found ${attachments.length} recent attachments (showing first 50)`);

    if (attachments.length === 0) {
      console.log('❌ No attachments found for Job 1600');
      return [];
    }

    console.log('\n📋 ATTACHMENT DETAILS:');
    console.log('=====================');

    attachments.forEach((attachment, index) => {
      console.log(`\n${index + 1}. ${attachment.attachment_name || 'Unnamed Attachment'}`);
      console.log(`   UUID: ${attachment.uuid}`);
      console.log(`   File Type: ${attachment.file_type || 'Unknown'}`);
      console.log(`   File Size: ${attachment.file_size || 'Unknown'} bytes`);
      console.log(`   Created: ${attachment.edit_date}`);
      console.log(`   Active: ${attachment.active ? 'Yes' : 'No'}`);
      console.log(`   Related Object: ${attachment.related_object}`);

      if (attachment.attachment_name && attachment.attachment_name.toLowerCase().includes('api-test')) {
        console.log('   🧪 THIS IS AN API TEST ATTACHMENT');
      }
    });

    return attachments;

  } catch (error) {
    console.error('❌ Error getting Job 1600 attachment details:', error);
    throw error;
  }
}

// Function to get attachment count for Job 1600
async function getJob1600AttachmentCount() {
  const jobUuid = '9af7ed45-351c-487d-ba31-234b20cd72fb';

  try {
    console.log('🔢 Getting total attachment count for Job 1600...');

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?related_object_uuid=${jobUuid}&$select=uuid&$top=1000`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const attachments = await response.json();
      console.log(`📊 Total attachments found: ${attachments.length}`);
      return attachments.length;
    } else {
      console.log('❌ Could not get attachment count');
      return 0;
    }

  } catch (error) {
    console.error('❌ Error getting attachment count:', error);
    return 0;
  }
}

// Function to search for specific attachment types
async function searchJob1600AttachmentTypes() {
  const jobUuid = '9af7ed45-351c-487d-ba31-234b20cd72fb';

  try {
    console.log('\n🔍 Analyzing attachment types for Job 1600...');

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?related_object_uuid=${jobUuid}&$select=file_type,attachment_name,edit_date&$top=100`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const attachments = await response.json();

      // Count file types
      const fileTypes = {};
      attachments.forEach(attachment => {
        const type = attachment.file_type || 'unknown';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      });

      console.log('\n📊 FILE TYPE BREAKDOWN (first 100 attachments):');
      Object.entries(fileTypes)
        .sort(([,a], [,b]) => b - a)
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count} files`);
        });

      return fileTypes;
    }

  } catch (error) {
    console.error('❌ Error analyzing attachment types:', error);
    return {};
  }
}

// Main function
async function analyzeJob1600Attachments() {
  console.log('📋 Job 1600 Attachment Analysis');
  console.log('================================');

  try {
    // Get attachment count
    await getJob1600AttachmentCount();

    // Get detailed attachment information
    await getJob1600AttachmentDetails();

    // Analyze file types
    await searchJob1600AttachmentTypes();

    console.log('\n✅ Job 1600 attachment analysis complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Export for use in other scripts
module.exports = {
  getJob1600AttachmentDetails,
  getJob1600AttachmentCount,
  searchJob1600AttachmentTypes,
  analyzeJob1600Attachments
};

// Run analysis if this script is executed directly
if (require.main === module) {
  analyzeJob1600Attachments();
}