# ETS ServiceM8 API Integration Pack

## 📦 What's Included

This pack contains everything needed to create jobs in ServiceM8 with proper Smart Contacts structure and billing separation.

### Files in this pack:
1. **`1_Setup_Guide.md`** - Step-by-step setup instructions
2. **`2_API_Connection_Test.js`** - Test your API key
3. **`3_Job_Template.json`** - Template showing all fields
4. **`4_Production_Script.js`** - Main script to create sites/jobs
5. **`5_Example_Usage.js`** - Complete working example
6. **`6_Attachment_Example.js`** - How to add files/documents to jobs

## 🚀 Quick Start

### Step 1: Get Your API Key
- Log into ServiceM8
- Go to Settings → Developer → API Access
- Generate an API key

### Step 2: Test Connection
```bash
# Edit 2_API_Connection_Test.js with your API key
# Run: node 2_API_Connection_Test.js
```

### Step 3: Create Your First Job
```bash
# Edit 5_Example_Usage.js with your data
# Run: node 5_Example_Usage.js
```

## 📋 How It Works

### Smart Contacts Structure:
```
ETS (Head Office) - UUID: 971d644f-d6a8-479c-a901-1f9b0425d7bb
├── ALL INVOICING HANDLED HERE
└── Site (e.g., QML - Murwillumbah)
    ├── Physical Location (where work happens)
    ├── Company Contacts (people at this site)
    │   ├── Site Contact (role: JOB)
    │   └── Property Manager (role: Property Manager) - optional
    └── Jobs
        └── NO BILLING CONTACTS - invoices flow to ETS automatically
```

### The Process:
1. **Checks/Creates Site** - Links to ETS (UUID: 971d644f-d6a8-479c-a901-1f9b0425d7bb)
2. **Adds Company Contacts** - People associated with the site
3. **Creates Job** - Linked to site with ETS PO attached
4. **Links Job Contacts** - Site Contact, Property Manager (no billing)

## ✅ What This Solves

- **Billing Separation** - Corporate billing address separate from job location
- **Contact Management** - All contact types properly attached
- **Smart Contacts** - Proper hierarchy for invoice routing
- **Duplicate Prevention** - Checks for existing sites

## 🔑 Important Notes

### API Key Security:
- Never share your API key
- Use environment variables in production
- Rotate keys regularly

### Billing Address:
- Set at SITE level (not job level)
- ServiceM8 handles separation at invoice time
- Include billing instructions in work_done_description

### Contact Types:
- Site Contact must use type "JOB"
- Only 3 types work: JOB, Property Manager, BILLING
- Add contacts AFTER job creation

## 📞 Support

For support:
- Contact: Sustaine
- Phone: 1300 227 266
- Email: Admin@Sustaine.com.au

For ServiceM8 API documentation:
- https://developer.servicem8.com/

## 🎯 Success Checklist

- [ ] API key obtained from ServiceM8
- [ ] Connection test successful
- [ ] Understand Smart Contacts structure
- [ ] First test job created
- [ ] Billing addresses showing correctly
- [ ] Contacts appearing in job

---

**Version:** 1.0
**Last Updated:** October 2024
**Prepared for:** Emergency Trade Services (ETS)