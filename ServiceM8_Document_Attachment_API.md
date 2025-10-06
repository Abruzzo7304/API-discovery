# ServiceM8 Document Attachment API Guide

Generated on: September 28, 2025

## Overview

The ServiceM8 API allows you to attach documents and files to existing jobs through a two-step process:
1. Create an attachment record
2. Upload the actual file content

## API Endpoints

### 1. Create Attachment Record
```
POST https://api.servicem8.com/api_1.0/Attachment.json
```

### 2. Upload File Content
```
POST https://api.servicem8.com/api_1.0/Attachment/{attachment_uuid}.file
```

### 3. List Job Attachments
```
GET https://api.servicem8.com/api_1.0/Attachment.json?related_object_uuid={job_uuid}
```

### 4. Retrieve Attachment Details
```
GET https://api.servicem8.com/api_1.0/Attachment/{attachment_uuid}.json
```

## Authentication

Use Basic Authentication with your ServiceM8 email and password:

```javascript
const credentials = btoa(`${email}:${password}`);
const headers = {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

## Step-by-Step Process

### Step 1: Create Attachment Record

**Request:**
```javascript
const attachmentData = {
  related_object: "job",
  related_object_uuid: "job-uuid-here",
  attachment_name: "document.pdf",
  file_type: ".pdf",
  active: true
};

const response = await fetch('https://api.servicem8.com/api_1.0/Attachment.json', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(attachmentData)
});
```

**Response:**
- Status: 201 Created
- Header: `x-record-uuid` contains the new attachment UUID

### Step 2: Upload File Content

**Request:**
```javascript
const formData = new FormData();
formData.append('file', fileObject);

const response = await fetch(`https://api.servicem8.com/api_1.0/Attachment/${attachmentUuid}.file`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`
    // Note: Don't set Content-Type for file uploads
  },
  body: formData
});
```

**Response:**
- Status: 200 OK (if successful)

## Attachment Record Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `related_object` | string | Yes | Always "job" for job attachments |
| `related_object_uuid` | string | Yes | UUID of the job to attach to |
| `attachment_name` | string | Yes | Display name for the file |
| `file_type` | string | Yes | File extension with leading dot (e.g., ".pdf") |
| `active` | boolean | Yes | Set to `true` to make attachment visible |

## Supported File Types

The API accepts various file types including:
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`, `.csv`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Spreadsheets: `.xls`, `.xlsx`
- Other: `.zip`, etc.

## Response Details

### Successful Attachment Creation
```json
{
  "uuid": "attachment-uuid",
  "attachment_name": "document.pdf",
  "file_type": ".pdf",
  "file_size": 1024,
  "related_object": "job",
  "related_object_uuid": "job-uuid",
  "active": true,
  "edit_date": "2025-09-28 10:30:00"
}
```

### Error Responses

**400 Bad Request:**
- Invalid file type
- Missing required fields
- Invalid job UUID

**401 Unauthorized:**
- Invalid credentials

**404 Not Found:**
- Job UUID doesn't exist
- Attachment UUID doesn't exist

## Complete Example

```javascript
async function attachDocumentToJob(jobUuid, fileName, fileContent) {
  const credentials = btoa(`${email}:${password}`);

  // Step 1: Create attachment record
  const attachmentData = {
    related_object: "job",
    related_object_uuid: jobUuid,
    attachment_name: fileName,
    file_type: fileName.substring(fileName.lastIndexOf('.')),
    active: true
  };

  const createResponse = await fetch('https://api.servicem8.com/api_1.0/Attachment.json', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attachmentData)
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create attachment record');
  }

  const attachmentUuid = createResponse.headers.get('x-record-uuid');

  // Step 2: Upload file content
  const formData = new FormData();
  formData.append('file', new Blob([fileContent]), fileName);

  const uploadResponse = await fetch(`https://api.servicem8.com/api_1.0/Attachment/${attachmentUuid}.file`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file content');
  }

  return attachmentUuid;
}
```

## Listing Job Attachments

To retrieve all attachments for a specific job:

```javascript
async function getJobAttachments(jobUuid) {
  const response = await fetch(`https://api.servicem8.com/api_1.0/Attachment.json?related_object_uuid=${jobUuid}`, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    }
  });

  const attachments = await response.json();
  return attachments;
}
```

## Best Practices

1. **Always check the response status** before proceeding to the next step
2. **Store the attachment UUID** returned from the first request for the file upload
3. **Use appropriate file types** - include the leading dot in file_type
4. **Handle errors gracefully** - API may reject invalid file types or large files
5. **Verify uploads** by retrieving attachment details after upload

## File Size Limits

The ServiceM8 API has file size limitations. Large files should be:
- Compressed when possible
- Split into smaller chunks if necessary
- Validated for size before upload

## Testing

Use the provided `document_attachment_discovery.js` script to test the attachment functionality:

```bash
node document_attachment_discovery.js
```

This script will:
1. Find existing jobs
2. Create a test attachment
3. Upload a sample file
4. Verify the attachment was created successfully
5. List all attachments for the job

## Integration Notes

- Attachments created via API are visible in the ServiceM8 web interface and mobile apps
- Files can be downloaded through the ServiceM8 interface
- Attachment records maintain audit trails (creation date, edit date, etc.)
- The `active` field can be used to hide/show attachments without deleting them

## Related APIs

- **Job API**: `/api_1.0/job.json` - For managing job records
- **JobDiary API**: `/api_1.0/JobDiary.json` - For job activity logs
- **JobContact API**: `/api_1.0/JobContact.json` - For job-related contacts

## Troubleshooting

### Common Issues

1. **"Invalid file type" error**
   - Ensure file_type includes the leading dot
   - Check that the file type is supported

2. **"Failed to upload file" error**
   - File may be too large
   - Check network connectivity
   - Verify attachment UUID is correct

3. **"Unauthorized" error**
   - Check email/password credentials
   - Ensure account has API access enabled

4. **File not appearing in ServiceM8**
   - Verify `active` is set to `true`
   - Check that the job UUID is correct
   - Refresh the ServiceM8 interface