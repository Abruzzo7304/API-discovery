// Attachment Example - How to add files to jobs
const fs = require('fs');
const path = require('path');

// Your API credentials
const API_KEY = 'your_api_key_here';
const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

function getAuthHeaders() {
  const credentials = btoa(`${API_KEY}:x`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

// Function to add attachment to existing job
async function addAttachmentToJob(jobUUID, filePath, filename) {
  console.log('📎 Adding Attachment to Job');
  console.log('========================\n');
  
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath);
    
    // Create form data
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileContent, filename);
    
    // Upload attachment
    const response = await fetch(
      `${SERVICEM8_API_BASE}/Attachment/${jobUUID}.file`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization,
          ...formData.getHeaders()
        },
        body: formData
      }
    );
    
    if (response.ok) {
      console.log('✅ Attachment uploaded successfully!');
      console.log(`   Filename: ${filename}`);
      console.log(`   Job UUID: ${jobUUID}`);
      return true;
    } else {
      console.log('❌ Failed to upload attachment');
      console.log(`   Status: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    return false;
  }
}

// Example: Add attachment during job creation
function addAttachmentToJobInfo(jobInfo, filePath) {
  // Read file and convert to base64
  const fileContent = fs.readFileSync(filePath);
  const base64Content = fileContent.toString('base64');
  const filename = path.basename(filePath);
  
  // Add to job info object
  jobInfo.attachment = {
    filename: filename,
    content: base64Content
  };
  
  return jobInfo;
}

// Example: Attaching ETS Purchase Order PDF to Job
async function attachETSPurchaseOrder() {
  // Real ETS PO example
  const jobUUID = 'your-job-uuid-from-creation';
  const poFilePath = '/Users/nessiii/Documents/Sustaine/Example PO:WO/PO12052-BU01-002_Murbah 1510.pdf';
  const poNumber = 'PO12052-BU01-002';

  console.log('📎 Attaching ETS Purchase Order to Job');
  console.log(`   PO Number: ${poNumber}`);
  console.log(`   File: ${poFilePath}\n`);

  // Method 1: Attach after job creation
  await addAttachmentToJob(jobUUID, poFilePath, `${poNumber}.pdf`);

  // Method 2: Include during job creation
  const jobInfo = {
    purchase_order_number: poNumber,
    status: 'Work Order',
    job_address: 'Murwillumbah St, Murwillumbah NSW 2484',
    job_description: 'As per attached ETS Purchase Order',

    // Attachment included in job creation
    attachment: {
      filename: `${poNumber}.pdf`,
      filePath: poFilePath
      // The production script will read this file and upload it
    }
  };

  console.log(`✅ ETS PO ${poNumber} will be attached to the job`);
}

// Supported file types
console.log('📁 SUPPORTED FILE TYPES:');
console.log('======================');
console.log('✅ PDF documents (.pdf)');
console.log('✅ Images (.jpg, .png, .gif)');
console.log('✅ Word documents (.docx, .doc)');
console.log('✅ Excel spreadsheets (.xlsx, .xls)');
console.log('✅ Text files (.txt, .csv)');
console.log('\n📝 Maximum file size: 10MB per attachment');

// Multiple attachments
console.log('\n📁 MULTIPLE ATTACHMENTS:');
console.log('====================');
console.log('To add multiple files:');
console.log('1. Create the job first');
console.log('2. Call addAttachmentToJob() multiple times');
console.log('3. Each call adds one file\n');

const exampleMultiple = `
// Example: Add multiple attachments to ETS job
const jobUUID = 'abc-123';
await addAttachmentToJob(jobUUID, './ets_quote.pdf', 'ets_quote.pdf');
await addAttachmentToJob(jobUUID, './site_photos.jpg', 'site_photos.jpg');
await addAttachmentToJob(jobUUID, './compliance_cert.pdf', 'electrical_compliance.pdf');
`;

console.log('Example code:', exampleMultiple);

// Browser/Web usage
console.log('🌐 WEB BROWSER USAGE:');
console.log('==================');
console.log('If using in a web browser:');

const browserExample = `
// HTML file input
<input type="file" id="fileInput" />

// JavaScript
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(
    'https://api.servicem8.com/api_1.0/Attachment/JOB_UUID_HERE.file',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(API_KEY + ':x')
      },
      body: formData
    }
  );
});
`;

console.log('Browser code:', browserExample);

module.exports = { addAttachmentToJob, addAttachmentToJobInfo };