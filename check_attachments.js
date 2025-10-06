// ServiceM8 Read-Only Attachment Checker
// This script only makes GET requests to check for attachments

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

// Function to get recent attachments (read-only)
async function getRecentAttachments() {
  try {
    console.log('🔍 Checking for recent attachments...');

    // Get attachments ordered by edit_date to see most recent first
    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$orderby=edit_date desc&$top=20`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const attachments = await response.json();
    console.log(`✅ Found ${attachments.length} recent attachments`);

    return attachments;
  } catch (error) {
    console.error('❌ Error getting attachments:', error);
    throw error;
  }
}

// Function to check for API test attachments specifically
async function checkForAPITestAttachments() {
  try {
    console.log('🔍 Looking for API test attachments...');

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$filter=contains(attachment_name,'api-test')&$orderby=edit_date desc`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const testAttachments = await response.json();
    console.log(`🧪 Found ${testAttachments.length} API test attachments`);

    return testAttachments;
  } catch (error) {
    console.error('❌ Error checking for test attachments:', error);
    return [];
  }
}

// Function to get job details for attachments
async function getJobDetails(jobUuid) {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const job = await response.json();
      return {
        job_id: job.generated_job_id || job.uuid,
        description: job.job_description?.substring(0, 100) + '...',
        status: job.status,
        date: job.date
      };
    }
    return null;
  } catch (error) {
    console.error(`❌ Error getting job details for ${jobUuid}:`, error);
    return null;
  }
}

// Function to check attachments from today
async function getTodaysAttachments() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log(`🗓️ Checking for attachments created today (${today})...`);

    const response = await fetch(`${SERVICEM8_API_BASE}/Attachment.json?$filter=edit_date ge '${today}' and edit_date lt '${today} 23:59:59'&$orderby=edit_date desc`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const todaysAttachments = await response.json();
    console.log(`📅 Found ${todaysAttachments.length} attachments created today`);

    return todaysAttachments;
  } catch (error) {
    console.error('❌ Error getting today\'s attachments:', error);
    return [];
  }
}

// Main function to analyze attachment changes
async function analyzeAttachmentChanges() {
  console.log('🕵️ ServiceM8 Attachment Change Analysis');
  console.log('=====================================');

  try {
    // Check for recent attachments
    const recentAttachments = await getRecentAttachments();

    // Check for API test attachments specifically
    const testAttachments = await checkForAPITestAttachments();

    // Check for today's attachments
    const todaysAttachments = await getTodaysAttachments();

    console.log('\n📋 ANALYSIS RESULTS:');
    console.log('===================');

    if (todaysAttachments.length > 0) {
      console.log(`\n📅 ATTACHMENTS CREATED TODAY (${todaysAttachments.length}):`);
      for (const attachment of todaysAttachments) {
        console.log(`\n🔗 Attachment: ${attachment.attachment_name}`);
        console.log(`   UUID: ${attachment.uuid}`);
        console.log(`   File Type: ${attachment.file_type}`);
        console.log(`   File Size: ${attachment.file_size || 'Unknown'} bytes`);
        console.log(`   Created: ${attachment.edit_date}`);
        console.log(`   Active: ${attachment.active}`);

        // Get job details
        const jobDetails = await getJobDetails(attachment.related_object_uuid);
        if (jobDetails) {
          console.log(`   📋 Job: ${jobDetails.job_id} - ${jobDetails.description}`);
          console.log(`   Status: ${jobDetails.status}, Date: ${jobDetails.date}`);
        } else {
          console.log(`   📋 Job UUID: ${attachment.related_object_uuid}`);
        }
      }
    } else {
      console.log('\n✅ No attachments were created today');
    }

    if (testAttachments.length > 0) {
      console.log(`\n🧪 API TEST ATTACHMENTS FOUND (${testAttachments.length}):`);
      testAttachments.forEach((attachment, index) => {
        console.log(`${index + 1}. ${attachment.attachment_name} (${attachment.file_type})`);
        console.log(`   Created: ${attachment.edit_date}`);
        console.log(`   Job: ${attachment.related_object_uuid}`);
        console.log(`   Size: ${attachment.file_size || 'Unknown'} bytes`);
      });
    } else {
      console.log('\n✅ No API test attachments found');
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Recent attachments: ${recentAttachments.length}`);
    console.log(`   Today's attachments: ${todaysAttachments.length}`);
    console.log(`   API test attachments: ${testAttachments.length}`);

    if (todaysAttachments.length === 0 && testAttachments.length === 0) {
      console.log('\n🎉 GOOD NEWS: No unexpected attachments found!');
      console.log('   Either the test script didn\'t run completely, or');
      console.log('   it failed before creating any attachments.');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Export for use in other scripts
module.exports = {
  getRecentAttachments,
  checkForAPITestAttachments,
  getTodaysAttachments,
  analyzeAttachmentChanges
};

// Run analysis if this script is executed directly
if (require.main === module) {
  analyzeAttachmentChanges();
}