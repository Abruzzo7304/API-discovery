// Check available queues in ServiceM8
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Get all queues
async function checkQueues() {
  console.log('📋 CHECKING AVAILABLE QUEUES');
  console.log('============================\n');

  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/queue.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const queues = await response.json();

      console.log(`Found ${queues.length} queue(s):\n`);

      queues.forEach((queue, index) => {
        console.log(`${index + 1}. ${queue.name}`);
        console.log(`   UUID: ${queue.uuid}`);
        console.log(`   Active: ${queue.active}`);
        console.log(`   Default Timeframe: ${queue.default_timeframe} days`);
        console.log(`   Requires Assignment: ${queue.requires_assignment || 'No'}`);
        console.log('');
      });

      return queues;
    } else {
      console.log(`❌ Failed to fetch queues: ${response.status}`);
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Test adding queue to a job
async function testQueueAssignment() {
  console.log('🔧 TESTING QUEUE ASSIGNMENT');
  console.log('===========================\n');

  const testJobData = {
    company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb',
    status: 'Work Order',
    job_address: '123 Queue Test Street, Brisbane QLD 4000',
    job_description: 'Test job with queue assignment',
    queue_uuid: '53c79b08-42d8-4bf6-8271-1f47c1e9cbeb', // Workshop queue from earlier test
    active: 1
  };

  console.log('Creating test job with queue assignment...\n');
  console.log(`Queue UUID: ${testJobData.queue_uuid}`);

  // Note: Not executing this to avoid creating unnecessary jobs
  console.log('\n📝 To add queue to job, include in job creation:');
  console.log('   queue_uuid: "queue-uuid-here"');
  console.log('   queue_assigned_staff_uuid: "staff-uuid" (optional)');
  console.log('   queue_expiry_date: "2025-12-31 23:59:59" (optional)');
}

// Run checks
async function runChecks() {
  await checkQueues();
  await testQueueAssignment();

  console.log('\n💡 QUEUE USAGE:');
  console.log('================');
  console.log('Queues can be used to:');
  console.log('• Organize jobs by workflow stage');
  console.log('• Assign jobs to specific teams');
  console.log('• Track job progress through stages');
  console.log('• Set timeframes for completion');
  console.log('\nFor Network Requests, you might use queues to track:');
  console.log('• Jobs pending Network Request');
  console.log('• Jobs sent to subcontractor');
  console.log('• Jobs awaiting completion');
}

runChecks();