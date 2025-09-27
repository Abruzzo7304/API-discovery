// ServiceM8 Field Discovery Script
// This script helps you discover available fields by testing API responses

const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

// OPTION 1: Use your ServiceM8 email and password
const EMAIL = 'your_servicem8_email@example.com';
const PASSWORD = 'your_servicem8_password';

// OPTION 2: Or use API Key if you have one
const API_KEY = 'your_api_key_here';

// Choose authentication method
const USE_API_KEY = false; // Set to true if using API key, false for email/password

// Helper function to get authentication headers
function getAuthHeaders() {
  if (USE_API_KEY) {
    return {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    };
  } else {
    // Basic Auth with email:password
    const credentials = btoa(`${EMAIL}:${PASSWORD}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    };
  }
}

// Function to get existing jobs and examine field structure
async function discoverJobFields() {
  try {
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json?$top=5`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const jobs = await response.json();
    
    if (jobs.length > 0) {
      console.log('=== DISCOVERED JOB FIELDS ===');
      console.log('Available fields in job object:');
      
      // Get all unique field names from the first job
      const fields = Object.keys(jobs[0]);
      fields.sort().forEach(field => {
        console.log(`- ${field}: ${typeof jobs[0][field]} (${jobs[0][field]})`);
      });
      
      console.log('\n=== SAMPLE JOB RECORD ===');
      console.log(JSON.stringify(jobs[0], null, 2));
      
      return fields;
    } else {
      console.log('No jobs found. Creating a test job to discover fields...');
      return await createTestJob();
    }
  } catch (error) {
    console.error('Error discovering job fields:', error);
    throw error;
  }
}

// Function to create a minimal test job to see required/optional fields
async function createTestJob() {
  const minimalJob = {
    status: "Quote",
    job_address: "Test Address for Field Discovery",
    job_description: "Test job for API field discovery - DELETE ME"
  };
  
  try {
    console.log('Creating test job with minimal fields...');
    const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(minimalJob)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const jobUuid = response.headers.get('x-record-uuid');
    console.log('Created job UUID:', jobUuid);
    
    if (response.ok && jobUuid) {
      // Now fetch the created job to see all fields
      const getResponse = await fetch(`${SERVICEM8_API_BASE}/job/${jobUuid}.json`, {
        headers: getAuthHeaders()
      });
      
      const createdJob = await getResponse.json();
      console.log('\n=== CREATED JOB STRUCTURE ===');
      console.log(JSON.stringify(createdJob, null, 2));
      
      return Object.keys(createdJob);
    } else {
      const errorText = await response.text();
      console.error('Failed to create test job:', errorText);
      throw new Error(`Failed to create test job: ${errorText}`);
    }
  } catch (error) {
    console.error('Error creating test job:', error);
    throw error;
  }
}

// Function to discover job contact fields
async function discoverJobContactFields() {
  try {
    console.log('\n=== DISCOVERING JOB CONTACT FIELDS ===');
    const response = await fetch(`${SERVICEM8_API_BASE}/jobcontact.json?$top=5`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const contacts = await response.json();
      if (contacts.length > 0) {
        console.log('Job Contact Fields:');
        Object.keys(contacts[0]).sort().forEach(field => {
          console.log(`- ${field}: ${typeof contacts[0][field]}`);
        });
      }
    }
  } catch (error) {
    console.error('Error discovering job contact fields:', error);
  }
}

// Function to test field validation by trying different values
async function testFieldValidation() {
  console.log('\n=== TESTING FIELD VALIDATION ===');
  
  const testCases = [
    {
      name: "Invalid status",
      data: { status: "InvalidStatus", job_address: "Test", job_description: "Test" }
    },
    {
      name: "Missing required fields",
      data: { job_description: "Test without address" }
    },
    {
      name: "Valid minimal job",
      data: { status: "Quote", job_address: "Test Address", job_description: "Valid test" }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      const response = await fetch(`${SERVICEM8_API_BASE}/job.json`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(testCase.data)
      });
      
      console.log(`Status: ${response.status}`);
      const responseText = await response.text();
      console.log(`Response: ${responseText}`);
      
    } catch (error) {
      console.error(`Error testing ${testCase.name}:`, error);
    }
  }
}

// Main discovery function
async function main() {
  console.log('ServiceM8 API Field Discovery Tool');
  console.log('====================================');
  
  if (!USE_API_KEY && (EMAIL === 'your_servicem8_email@example.com' || PASSWORD === 'your_servicem8_password')) {
    console.error('ERROR: Please set your ServiceM8 email and password in the EMAIL and PASSWORD variables');
    return;
  }
  
  if (USE_API_KEY && API_KEY === 'your_api_key_here') {
    console.error('ERROR: Please set your ServiceM8 API key in the API_KEY variable');
    return;
  }
  
  try {
    // Discover job fields
    await discoverJobFields();
    
    // Discover job contact fields
    await discoverJobContactFields();
    
    // Test field validation
    await testFieldValidation();
    
    console.log('\n=== FIELD DISCOVERY COMPLETE ===');
    console.log('Use the discovered fields to create your API integration specification.');
    
  } catch (error) {
    console.error('Field discovery failed:', error);
  }
}

// Run the discovery
main();

// Export for use in other scripts
module.exports = {
  discoverJobFields,
  createTestJob,
  discoverJobContactFields,
  testFieldValidation
};
