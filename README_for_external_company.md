# ServiceM8 Job Creation Setup for External Company

This package allows you to create jobs directly in ServiceM8 using the API.

## 📦 What's Included

1. `job_data_template.json` - Template to fill out with job details
2. `create_job_for_external_company.js` - Script to create the job
3. `README_for_external_company.md` - This instruction file

## 🚀 Quick Start

### Step 1: Install Node.js
Download and install Node.js from https://nodejs.org (if not already installed)

### Step 2: Update Your Credentials
Edit `create_job_for_external_company.js` and replace:
```javascript
const EMAIL = 'YOUR_SERVICEM8_EMAIL@example.com';        // Your ServiceM8 login email
const PASSWORD = 'YOUR_SERVICEM8_PASSWORD';              // Your ServiceM8 password
```

### Step 3: Fill Out Job Template
Edit `job_data_template.json` and replace all `FILL_ME_IN` fields with your job details:

**Required Fields:**
- `status`: "Work Order" or "Quote"
- `job_address`: Full address where work will be performed
- `job_description`: Description of work needed

**Optional Fields:**
- `job_priority`: "Normal", "High", or "Low"
- `job_notes`: Additional notes
- `job_location_name`: Building/location name
- `purchase_order_number`: Your PO number
- `source`: How job was created (e.g., "Email", "Phone call")

**DO NOT CHANGE:**
- `billing_address`: Pre-configured company billing address
- `company_uuid`: Links to Emergency Trade Services
- `active`: Must stay as 1

### Step 4: Create the Job
Run the script:
```bash
node create_job_for_external_company.js
```

### Step 5: Success!
If successful, you'll see:
```
🎉 Job Creation Complete!
========================
✅ Job Number: 1595
✅ Job UUID: abc123...
✅ Company contacts linked
✅ Job is now available in ServiceM8
```

## 🔧 Example Template

```json
{
  "status": "Work Order",
  "job_address": "123 Main Street, Brisbane QLD 4000",
  "job_description": "Emergency electrical repair - power outage",
  "job_priority": "High",
  "job_notes": "Customer reports complete power loss since morning",
  "purchase_order_number": "PO-2024-001",
  "source": "Email"
}
```

## ❗ Important Notes

1. **Credentials**: Keep your ServiceM8 login details secure
2. **Job Numbers**: ServiceM8 will auto-generate job numbers (1593, 1594, etc.)
3. **Contacts**: Darren Siemsen and Admin will be automatically linked to every job
4. **Billing**: All jobs will bill to Emergency Trade Services address
5. **Template**: Reuse the template for multiple jobs - just update the fields

## 🆘 Troubleshooting

**"Missing required fields" error:**
- Check that status, job_address, and job_description don't contain "FILL_ME_IN"

**"Authentication failed" error:**
- Verify your ServiceM8 email and password are correct

**"Template file not found" error:**
- Ensure `job_data_template.json` is in the same folder as the script

**Contact linking warnings:**
- Job will still be created successfully, contacts just won't be auto-linked

## 📞 Support

If you encounter issues, check:
1. ServiceM8 credentials are correct
2. Template file is properly filled out
3. Internet connection is working
4. Node.js is installed and working

The job creation script will provide detailed error messages to help diagnose any issues.