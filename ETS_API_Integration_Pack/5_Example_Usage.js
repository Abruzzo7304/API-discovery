// Example Usage - ETS ServiceM8 Integration
// This file shows how to use the production script

// STEP 1: Set your API key
const API_KEY = 'your_api_key_here'; // Replace with your actual API key

// STEP 2: Import the production script functions
// In production, you'd import from the production script file
// For this example, we'll include the key function

const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

function getAuthHeaders() {
  const credentials = btoa(`${API_KEY}:x`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Load the production script
const { createJobWithSmartContacts } = require('./4_Production_Script.js');

// STEP 3: Define your site information (Based on real ETS PO)
const siteInfo = {
  name: 'QML - Murwillumbah',
  address: 'Murwillumbah St, Murwillumbah NSW 2484', // Physical site location
  email: 'admin@qml.com.au',  // Generic site email
  phone: '07 3369 3922'       // Site main number
};

// STEP 4: Define your job information (Based on real ETS PO format)
const jobInfo = {
  purchase_order_number: 'PO12052-BU01-002',
  status: 'Work Order',
  job_address: 'Murwillumbah St, Murwillumbah NSW 2484',

  job_description: `Please scan & complete site risk assessment before proceeding with works.

JOB DETAILS:
Computer wall mount delivered to site. Complete the installation with coordination with the site contact Margie Brown margie.brown@qml.com.au 0466 152 007

1.1. Please attend site to undertake the scope of works as per detailed instruction in this work order.
1.2. If you cannot complete the works within the cost limits $150 ex GST, or due to needing to order materials, please call Sustaine from site for further advice.
1.3. If costs are to exceed our Client pre-approval limit, we will ask for a quote so we can get formal approval before commencement.
1.4. If you are able to complete works within the limit, or get additional cost approval on site, please ensure all rubbish and debris are to be removed from site and disposed of appropriately on completion of works.
1.5. Site to be left clean and tidy on completion

For any changes or variations to this work order, please contact:
Sustaine - 1300 227 266 or Admin@Sustaine.com.au`,
  
  work_done_description: `BILLING INSTRUCTIONS:
==================
Bill To: ETS Head Office (via Smart Contacts)
PO Reference: PO12052-BU01-002

APPROVAL LIMIT: $150 ex GST

Any work exceeding this amount requires prior approval from ETS.
For variations or additional work beyond approved limit:
- Contact Sustaine Office: 1300 227 266
- Email: Admin@Sustaine.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,
  
  category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical

  // Optional fields
  scheduled_start: '2024-01-15 09:00:00',
  scheduled_duration: 120, // minutes

  // Attachment - The ETS PO PDF
  attachment: {
    filename: 'PO12052-BU01-002.pdf',
    filePath: '/Users/nessiii/Documents/Sustaine/Example PO:WO/PO12052-BU01-002_Murbah 1510.pdf'
    // Note: In production, read the file and convert to base64 or use FormData
  }
};

// STEP 5: Define Company Contacts (people associated with the site)
const companyContacts = [
  {
    first: 'Margie',
    last: 'Brown',
    email: 'margie.brown@qml.com.au',
    mobile: '0466 152 007',
    role: 'JOB',  // Site Contact role
    is_primary: 1
  },
  // Could have property manager here if applicable
  // {
  //   first: 'Alice',
  //   last: 'Johnson',
  //   email: 'alice.johnson@propertygroup.com.au',
  //   mobile: '0412 345 678',
  //   role: 'Property Manager'
  // }
];

// STEP 6: Define which contacts to link to this specific job
const jobContacts = [
  {
    first: 'Margie',
    last: 'Brown',
    email: 'margie.brown@qml.com.au',
    mobile: '0466 152 007',
    type: 'JOB'  // Site Contact on the job
  }
  // NO BILLING CONTACT - ETS handles all invoicing
  // Invoices automatically go to ETS through Smart Contacts hierarchy
];

// STEP 7: Run the complete workflow
async function runExample() {
  console.log('🚀 Starting ETS Job Creation Example');
  console.log('====================================\n');

  try {
    // Call the main function with all parameters
    const result = await createJobWithSmartContacts(siteInfo, companyContacts, jobInfo, jobContacts);
    
    if (result.success) {
      console.log('\n✅ SUCCESS!');
      console.log('===========');
      console.log(`Site UUID: ${result.siteUUID}`);
      console.log(`Job Number: ${result.jobNumber}`);
      console.log(`Job UUID: ${result.jobUUID}`);
      console.log(`\n${result.message}`);
      
      console.log('\n📋 What was created:');
      console.log('1. Site linked to ETS (or reused existing)');
      console.log('2. Job with billing instructions');
      console.log('3. Site contact, property manager, and billing contact');
      
    } else {
      console.log('\n❌ Failed to create job');
      console.log(`Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log('\n💥 Unexpected error:');
    console.log(error.message);
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  console.log('📋 EXAMPLE JOB CREATION');
  console.log('====================\n');
  console.log('This example will create:');
  console.log('- Site: QML - Murwillumbah (linked to ETS)');
  console.log('- Job: Computer wall mount installation');
  console.log('- PO: PO12052-BU01-002');
  console.log('- Approval Limit: $150 ex GST\n');
  
  console.log('⚠️  Make sure to:');
  console.log('1. Replace API_KEY with your actual key');
  console.log('2. Update the data for your actual job\n');
  
  // Uncomment to run:
  // runExample();
  
  console.log('💡 Uncomment runExample() at the bottom of this file to execute');
}

// Export for use in other files
module.exports = { runExample, siteInfo, jobInfo, companyContacts, jobContacts };