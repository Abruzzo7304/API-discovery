# Setup Guide - ETS ServiceM8 Integration

## Prerequisites

- [ ] ServiceM8 account with API access
- [ ] Node.js installed (version 14 or higher)
- [ ] API key from ServiceM8

## Step 1: Get Your ServiceM8 API Key

1. Log into ServiceM8
2. Navigate to: **Settings → Developer → API Access**
3. Click "Generate API Key"
4. Copy and save your API key securely

## Step 2: Install Node.js (if needed)

### Windows:
- Download from https://nodejs.org/
- Run installer
- Verify: `node --version`

### Mac:
```bash
# Using Homebrew
brew install node

# Verify installation
node --version
```

## Step 3: Set Up the Integration

1. **Extract all files** to a folder on your computer
2. **Open terminal/command prompt** in that folder
3. **Test your API key:**

```bash
# Edit 2_API_Connection_Test.js
# Replace 'your_api_key_here' with your actual API key

# Run the test
node 2_API_Connection_Test.js
```

Expected output:
```
✅ API Key authentication successful!
```

## Step 4: Configure Your Environment

### Option A: Direct in Code (Quick Testing)
```javascript
// In 4_Production_Script.js
const API_KEY = 'your_actual_api_key';
```

### Option B: Environment Variables (Recommended)
```bash
# Create .env file
echo "SERVICEM8_API_KEY=your_actual_api_key" > .env

# Update code to use environment variable
const API_KEY = process.env.SERVICEM8_API_KEY;
```

## Step 5: Understanding the Structure

### Company Hierarchy:
```
Emergency Trades Services Pty Ltd (Head Office) - UUID: 971d644f-d6a8-479c-a901-1f9b0425d7bb
└── Sites (Your Clients)
    └── Jobs (Work Orders)
        └── Contacts (Site, Property Manager, Tenant)
```

### Key Concepts:

1. **Sites** = Client locations linked to ETS
2. **Smart Contacts** = Billing hierarchy system
3. **Job Contacts** = Who the Contractor is to contact to arrange access and scheduling (include any specific contact notes in the job description)

## Step 6: Create Your First Test Job

1. **Review the template:** Open `3_Job_Template.json`
2. **Edit the example:** Modify `5_Example_Usage.js`
3. **Run the example:**

```bash
node 5_Example_Usage.js
```

## Common Issues & Solutions

### Issue: "Authentication failed"
**Solution:** Check API key is correct and has permissions

### Issue: "Site already exists"
**Solution:** Script handles this - will use existing or create "(ETS Site)" variant

### Issue: "Billing address same as job address"
**Solution:** This is normal - ServiceM8 handles separation at invoice time

### Issue: "Contacts not showing"
**Solution:** Ensure contacts are added AFTER job creation

## Data Flow Diagram

```
1. Check/Create Site
   │
   ├─> Exists + Linked to ETS UUID → Use it
   ├─> Exists + Standalone? → Create "(ETS Site)"
   └─> Doesn't exist? → Create new
   ↓
2. Create Job
   │
   ├─> Link to Site UUID
   ├─> Add job details
   └─> Include billing instructions
   ↓
3. Add Contacts
   │
   ├─> Site Contact (type: JOB)
   ├─> Property Manager (optional)
   └─> Billing Contact (optional)
```

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for production
3. **Rotate keys regularly** (every 90 days)
4. **Limit API key permissions** to only what's needed
5. **Use HTTPS only** (already configured in scripts)

## Next Steps

1. ✅ Test connection with API key
2. ✅ Create a test job site and job
3. ✅ Verify billing separation works
4. ✅ Check contacts appear correctly
5. 🎯 Move to production usage

---

Need help? Contact Sustaine 1300227266 or Admin@Sustaine