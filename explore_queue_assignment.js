// ServiceM8 Queue and Assignment Exploration
// The queue endpoint showed a "requires_assignment" field

const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

async function exploreQueueEndpoint() {
  console.log('🔍 Exploring Queue endpoint and assignment fields...\n');

  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/queue.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const queues = await response.json();
      console.log(`Found ${queues.length} queues:`);

      queues.forEach((queue, index) => {
        console.log(`\n${index + 1}. Queue: ${queue.queue_name || queue.name}`);
        console.log(`   UUID: ${queue.uuid}`);
        console.log(`   Requires Assignment: ${queue.requires_assignment}`);
        console.log(`   All fields:`, Object.keys(queue).join(', '));
        console.log(`   Sample data:`, JSON.stringify(queue, null, 2));
      });
    } else {
      console.log(`❌ Failed to fetch queues: ${response.status}`);
    }
  } catch (error) {
    console.error('Error exploring queues:', error);
  }
}

async function exploreJobQueueFields() {
  console.log('\n🔍 Exploring jobs with queue assignments...\n');

  try {
    // Look for jobs with queue_uuid set
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$filter=queue_uuid ne ''&$top=10`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const jobs = await response.json();
      console.log(`Found ${jobs.length} jobs with queue assignments:`);

      jobs.forEach((job, index) => {
        console.log(`\n${index + 1}. Job ${job.generated_job_id} (${job.uuid})`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Queue UUID: ${job.queue_uuid}`);
        console.log(`   Queue Assigned Staff: ${job.queue_assigned_staff_uuid}`);
        console.log(`   Queue Expiry: ${job.queue_expiry_date}`);
        console.log(`   Active Network Request: ${job.active_network_request_uuid}`);
        console.log(`   Company: ${job.company_uuid}`);
      });
    } else {
      console.log(`❌ Failed to query jobs: ${response.status}`);
    }
  } catch (error) {
    console.error('Error exploring job queue fields:', error);
  }
}

async function testStaffAndAssignment() {
  console.log('\n🔍 Exploring staff endpoint for assignment capabilities...\n');

  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/staff.json?$top=10`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const staff = await response.json();
      console.log(`Found ${staff.length} staff members:`);

      staff.forEach((member, index) => {
        console.log(`\n${index + 1}. ${member.name} (${member.uuid})`);
        console.log(`   Email: ${member.email}`);
        console.log(`   Active: ${member.active}`);

        // Look for assignment-related fields
        const assignmentFields = Object.keys(member).filter(field =>
          field.toLowerCase().includes('assign') ||
          field.toLowerCase().includes('queue') ||
          field.toLowerCase().includes('network') ||
          field.toLowerCase().includes('external')
        );

        if (assignmentFields.length > 0) {
          console.log(`   Assignment fields: ${assignmentFields.join(', ')}`);
        }
      });
    } else {
      console.log(`❌ Failed to fetch staff: ${response.status}`);
    }
  } catch (error) {
    console.error('Error exploring staff:', error);
  }
}

async function exploreCompanyEndpoint() {
  console.log('\n🔍 Exploring company endpoint for external companies...\n');

  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/company.json?$top=20&$orderby=edit_date desc`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const companies = await response.json();
      console.log(`Found ${companies.length} companies (showing recent):`);

      companies.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.name} (${company.uuid})`);
        console.log(`   Address: ${company.address}`);
        console.log(`   Email: ${company.email}`);

        // Look for network/external/contractor related fields
        const relevantFields = Object.keys(company).filter(field =>
          field.toLowerCase().includes('network') ||
          field.toLowerCase().includes('external') ||
          field.toLowerCase().includes('contractor') ||
          field.toLowerCase().includes('partner') ||
          field.toLowerCase().includes('vendor') ||
          field.toLowerCase().includes('type')
        );

        if (relevantFields.length > 0) {
          console.log(`   Relevant fields: ${relevantFields.join(', ')}`);
          relevantFields.forEach(field => {
            console.log(`     ${field}: ${company[field]}`);
          });
        }
      });
    } else {
      console.log(`❌ Failed to fetch companies: ${response.status}`);
    }
  } catch (error) {
    console.error('Error exploring companies:', error);
  }
}

async function main() {
  console.log('ServiceM8 Queue and Assignment Exploration');
  console.log('=========================================\n');

  await exploreQueueEndpoint();
  await exploreJobQueueFields();
  await testStaffAndAssignment();
  await exploreCompanyEndpoint();

  console.log('\n🏁 Exploration complete!');
}

// Run the exploration
main().catch(console.error);