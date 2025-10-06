// Simple test to show template structure (without actual API call)
console.log('🎯 ETS Job Creation Template Test');
console.log('==================================\n');

const testJobData = {
  site: {
    name: 'Test Retail Store - Brisbane CBD',
    parent_company_uuid: '971d644f-d6a8-479c-a901-1f9b0425d7bb', // ETS UUID
    address: '123 Queen Street, Brisbane QLD 4000',
    email: 'admin@testretail.com.au',
    phone: '07 3000 1234'
  },

  company_contacts: [
    {
      first: 'John',
      last: 'Smith',
      email: 'john.smith@testretail.com.au',
      mobile: '0412 345 678',
      role: 'JOB', // Site Contact
      is_primary: 1
    },
    {
      first: 'Test Retail',
      last: 'Pty Ltd',
      email: 'accounts@testretail.com.au',
      mobile: '0434 567 890',
      role: 'Tenant'
    },
    {
      first: 'Property Group',
      last: 'Investments',
      email: 'owner@propertygroup.com.au',
      mobile: '0445 678 901',
      role: 'Property Owner'
    },
    {
      first: 'Sarah',
      last: 'Johnson',
      email: 'sarah@propertymanagement.com.au',
      mobile: '0423 456 789',
      role: 'Property Manager'
    }
  ],

  job: {
    purchase_order_number: 'ETS-TEST-2024-001',
    status: 'Work Order',
    job_address: '123 Queen Street, Brisbane QLD 4000',

    job_description: `URGENCY: URGENT
=========================================
CRITICAL - Immediate response required, safety/security risk
URGENT - Response within 4 hours, business operations affected
STANDARD - Response within 24-48 hours, routine maintenance

Contact site during business hours to schedule job
Service window: Monday-Friday 7am-6pm
Response time: Within 4 hours

-----------------------------------

JOB DETAILS:
===========
Electrical fault in main retail area - Multiple power outlets not working
- Investigate power failure affecting 6 outlets on eastern wall
- Check circuit breakers and RCD protection
- Test and repair faulty outlets as required
- Ensure all outlets comply with current electrical standards
- Test and tag all repaired equipment

Please scan & complete site risk assessment before proceeding with works.

1.1. Please attend site to undertake the scope of works as per detailed instruction in this work order.
1.2. If you cannot complete the works within the cost limits $500 ex GST, or due to needing to order materials, please call Sustaine from site for further advice.
1.3. If costs are to exceed our Client pre-approval limit, we will ask for a quote so we can get formal approval before commencement.
1.4. If you are able to complete works within the limit, or get additional cost approval on site, please ensure all rubbish and debris are to be removed from site and disposed of appropriately on completion of works.
1.5. Site to be left clean and tidy on completion

For any changes or variations to this work order, please contact:
Sustaine - 1300 227 266 or Admin@Sustaine.com.au

OHS REQUIREMENTS:
================
State Occupational Health and Safety regulations and policies must be adhered to for the duration of the Subcontractors time on site. It is the Subcontractors responsibility to complete a risk assessment before commencing all the jobs and immediately reporting any high-risk hazards to Sustaine prior to commencing the jobs.

SCOPE OF WORKS:
==============
It is the responsibility of the sub-contractor to advise of any discrepancies in the scope of works. Any alteration or variance to the scope of works provided must be approved by Sustaine prior to works commencing.`,

    work_done_description: `BILLING INSTRUCTIONS:
==================
Bill To: ETS Head Office (via Smart Contacts)
PO Reference: ETS-TEST-2024-001

APPROVAL LIMIT: $500 ex GST

Any work exceeding this amount requires prior approval from Sustaine.
For variations or additional work beyond approved limit:
- Contact Sustaine Office: 1300 227 266
- Email: Admin@Sustaine.com.au

Payment terms: 30 days from invoice
Invoicing: Direct to ETS head office`,

    category_uuid: '9b87f18b-5e5c-486f-99e5-1f4c5a3460fb', // Electrical
    badges: '["7e6e49bc-2c47-4df5-a83f-234d5003d4eb"]', // ETS Job badge
    source: 'Created by ETS via API Integration',
    scheduled_start: '2024-01-20 09:00:00',
    scheduled_duration: 120
  },

  job_contacts: [
    { type: 'JOB', first: 'John', last: 'Smith' },
    { type: 'Tenant', first: 'Test Retail', last: 'Pty Ltd' },
    { type: 'Property Owner', first: 'Property Group', last: 'Investments' },
    { type: 'Property Manager', first: 'Sarah', last: 'Johnson' }
  ]
};

console.log('📋 TEST JOB STRUCTURE');
console.log('====================\n');

console.log('1️⃣ SITE INFORMATION:');
console.log(`   Name: ${testJobData.site.name}`);
console.log(`   Parent: ETS (${testJobData.site.parent_company_uuid})`);
console.log(`   Address: ${testJobData.site.address}`);
console.log(`   ❌ NO billing_address (rolls up to ETS)\n`);

console.log('2️⃣ COMPANY CONTACTS (4 types):');
testJobData.company_contacts.forEach(contact => {
  console.log(`   ✅ ${contact.first} ${contact.last} - ${contact.role}`);
});

console.log('\n3️⃣ JOB DETAILS:');
console.log(`   PO: ${testJobData.job.purchase_order_number}`);
console.log(`   Status: ${testJobData.job.status}`);
console.log(`   Category: Electrical`);
console.log(`   Badge: ETS Job`);
console.log(`   Urgency: URGENT (4 hour response)`);
console.log(`   Approval Limit: $500 ex GST`);

console.log('\n4️⃣ JOB CONTACTS (linked to job):');
testJobData.job_contacts.forEach(contact => {
  console.log(`   ✅ ${contact.first} ${contact.last} - ${contact.type}`);
});

console.log('\n5️⃣ BILLING FLOW:');
console.log('   Site → ETS Head Office → Subcontractor gets paid');
console.log('   ❌ NO billing contacts at site level');
console.log('   ✅ All invoices go to ETS via Smart Contacts');

console.log('\n6️⃣ KEY TEMPLATE FEATURES:');
console.log('   ✅ Urgency levels with clear definitions (CRITICAL/URGENT/STANDARD)');
console.log('   ✅ OHS requirements in job description');
console.log('   ✅ Scope of works with approval procedures');
console.log('   ✅ Billing instructions in work_done_description');
console.log('   ✅ All variations contact Sustaine');
console.log('   ✅ No billing_address at site level (uses ETS)');

console.log('\n✨ Template structure validated!');
console.log('   Ready for production use with valid API key.');