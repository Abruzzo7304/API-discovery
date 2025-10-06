// Pull complete data for Job 1609
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Pull all data for Job 1609
async function pullJob1609Data() {
  console.log('📊 PULLING COMPLETE DATA FOR JOB 1609');
  console.log('======================================\n');

  try {
    // 1. Get the job by job number
    console.log('1️⃣  FETCHING JOB 1609...');
    const jobResponse = await fetch(`${SERVICEM8_API_BASE}/job.json?generated_job_id=1609`, {
      headers: getAuthHeaders()
    });

    if (!jobResponse.ok) {
      console.log(`❌ Failed to fetch job: ${jobResponse.status}`);
      return;
    }

    const jobs = await jobResponse.json();

    if (jobs.length === 0) {
      console.log('❌ Job 1609 not found');
      return;
    }

    const job = jobs[0];
    console.log('✅ Job found!\n');

    // 2. Display all job fields
    console.log('📋 JOB DETAILS:');
    console.log('===============');
    Object.keys(job).forEach(key => {
      const value = job[key];
      if (value !== null && value !== '' && value !== undefined) {
        console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    });

    console.log('\n📍 KEY INFORMATION:');
    console.log('===================');
    console.log(`Job Number: ${job.generated_job_id}`);
    console.log(`UUID: ${job.uuid}`);
    console.log(`Status: ${job.status}`);
    console.log(`Company UUID: ${job.company_uuid}`);
    console.log(`Company: ${job.company_uuid === '971d644f-d6a8-479c-a901-1f9b0425d7bb' ? 'Emergency Trade Services' : 'Other'}`);
    console.log(`Purchase Order: ${job.purchase_order_number || 'None'}`);
    console.log(`Address: ${job.job_address || 'No address'}`);
    console.log(`Created: ${job.date}`);
    console.log(`Active: ${job.active === 1 ? 'Yes' : 'No'}`);
    console.log(`Queue UUID: ${job.queue_uuid || 'None'}`);
    console.log(`Network Request: ${job.active_network_request_uuid || 'None'}`);
    console.log(`Badges: ${job.badges || 'None'}`);

    if (job.job_description) {
      console.log(`\n📝 JOB DESCRIPTION:`);
      console.log('==================');
      console.log(job.job_description);
    }

    // 3. Get job contacts
    console.log('\n2️⃣  FETCHING JOB CONTACTS...');
    const contactsResponse = await fetch(
      `${SERVICEM8_API_BASE}/jobcontact.json?$filter=job_uuid eq '${job.uuid}'`,
      { headers: getAuthHeaders() }
    );

    if (contactsResponse.ok) {
      const contacts = await contactsResponse.json();
      if (contacts.length > 0) {
        console.log(`✅ Found ${contacts.length} contact(s):\n`);
        contacts.forEach((contact, index) => {
          console.log(`Contact ${index + 1}:`);
          console.log(`   Type: ${contact.type}`);
          console.log(`   Name: ${contact.first} ${contact.last || ''}`);
          console.log(`   Email: ${contact.email || 'None'}`);
          console.log(`   Mobile: ${contact.mobile || 'None'}`);
          console.log(`   Active: ${contact.active === 1 ? 'Yes' : 'No'}`);
          console.log('');
        });
      } else {
        console.log('No contacts found for this job');
      }
    } else {
      console.log(`❌ Failed to fetch contacts: ${contactsResponse.status}`);
    }

    // 4. Get job attachments
    console.log('3️⃣  FETCHING JOB ATTACHMENTS...');
    const attachmentsResponse = await fetch(
      `${SERVICEM8_API_BASE}/attachment.json?$filter=related_object eq 'job' and related_object_uuid eq '${job.uuid}'`,
      { headers: getAuthHeaders() }
    );

    if (attachmentsResponse.ok) {
      const attachments = await attachmentsResponse.json();
      if (attachments.length > 0) {
        console.log(`✅ Found ${attachments.length} attachment(s):\n`);
        attachments.forEach((attachment, index) => {
          console.log(`Attachment ${index + 1}:`);
          console.log(`   UUID: ${attachment.uuid}`);
          console.log(`   Filename: ${attachment.attachment_name || 'Unknown'}`);
          console.log(`   Type: ${attachment.file_type || 'Unknown'}`);
          console.log(`   Size: ${attachment.file_size || 'Unknown'} bytes`);
          console.log('');
        });
      } else {
        console.log('No attachments found for this job');
      }
    } else {
      console.log(`❌ Failed to fetch attachments: ${attachmentsResponse.status}`);
    }

    // 5. Get job notes
    console.log('\n4️⃣  FETCHING JOB NOTES...');
    const notesResponse = await fetch(
      `${SERVICEM8_API_BASE}/note.json?$filter=related_object eq 'job' and related_object_uuid eq '${job.uuid}'`,
      { headers: getAuthHeaders() }
    );

    if (notesResponse.ok) {
      const notes = await notesResponse.json();
      if (notes.length > 0) {
        console.log(`✅ Found ${notes.length} note(s):\n`);
        notes.forEach((note, index) => {
          console.log(`Note ${index + 1}:`);
          console.log(`   Date: ${note.date}`);
          console.log(`   Note: ${note.note}`);
          console.log(`   Done by: ${note.done_by_staff_uuid || 'System'}`);
          console.log('');
        });
      } else {
        console.log('No notes found for this job');
      }
    } else {
      console.log(`❌ Failed to fetch notes: ${notesResponse.status}`);
    }

    // 6. Get company details
    console.log('\n5️⃣  FETCHING COMPANY DETAILS...');
    const companyResponse = await fetch(
      `${SERVICEM8_API_BASE}/company/${job.company_uuid}.json`,
      { headers: getAuthHeaders() }
    );

    if (companyResponse.ok) {
      const company = await companyResponse.json();
      console.log('✅ Company details:');
      console.log(`   Name: ${company.name}`);
      console.log(`   UUID: ${company.uuid}`);
      console.log(`   Email: ${company.email || 'None'}`);
      console.log(`   Phone: ${company.phone || 'None'}`);
      console.log(`   Mobile: ${company.mobile || 'None'}`);
      console.log(`   Address: ${company.billing_address || 'None'}`);
    } else {
      console.log(`❌ Failed to fetch company: ${companyResponse.status}`);
    }

    // 7. Check queue details if assigned
    if (job.queue_uuid) {
      console.log('\n6️⃣  FETCHING QUEUE DETAILS...');
      const queueResponse = await fetch(
        `${SERVICEM8_API_BASE}/queue/${job.queue_uuid}.json`,
        { headers: getAuthHeaders() }
      );

      if (queueResponse.ok) {
        const queue = await queueResponse.json();
        console.log('✅ Queue details:');
        console.log(`   Name: ${queue.name}`);
        console.log(`   UUID: ${queue.uuid}`);
        console.log(`   Default timeframe: ${queue.default_timeframe} days`);
      } else {
        console.log(`❌ Failed to fetch queue: ${queueResponse.status}`);
      }
    }

    console.log('\n✅ DATA PULL COMPLETE!');

  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Run the data pull
pullJob1609Data();