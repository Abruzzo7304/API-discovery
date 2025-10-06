# ServiceM8 API Fields Discovery Summary

Generated on: September 27, 2025

## Job Fields (50 total)

| Field Name | Type | Sample Value | Description |
|------------|------|--------------|-------------|
| uuid | string | 7320c95d-eb2a-4108-91a3-1f47c3315ceb | Unique identifier |
| active | number | 0 | Active status |
| active_network_request_uuid | string | | Network request UUID |
| badges | string | | Job badges |
| billing_address | string | MCG, Brunton Avenue, East Melbourne, Victoria | Billing address |
| category_uuid | string | cfc84630-8c27-48cc-b6aa-1f47cfefaffb | Category identifier |
| company_uuid | string | 6a549002-6079-41b0-a3d6-1f47ca0f8a1b | Company identifier |
| completion_actioned_by_uuid | string | | Who completed the job |
| completion_date | string | 0000-00-00 00:00:00 | Job completion date |
| created_by_staff_uuid | string | a754a95c-3b44-4c2d-9436-1f47c85ea0fb | Staff who created job |
| customfield_xero_tracking_cat_1 | string | | Xero tracking category 1 |
| customfield_xero_tracking_cat_2 | string | | Xero tracking category 2 |
| date | string | 2022-12-04 00:00:00 | Job date |
| edit_date | string | 2022-12-04 11:34:09 | Last edit date |
| generated_job_id | string | SAMPLE | Generated job ID |
| geo_city | string | Richmond | Geographic city |
| geo_country | string | Australia | Geographic country |
| geo_is_valid | number | 1 | Geographic data validity |
| geo_number | string | | Street number |
| geo_postcode | string | 3002 | Postcode |
| geo_state | string | VIC | State/province |
| geo_street | string | Brunton Avenue | Street name |
| invoice_sent | boolean | false | Invoice sent status |
| invoice_sent_stamp | string | 0000-00-00 00:00:00 | Invoice sent timestamp |
| job_address | string | MCG, Brunton Avenue, East Melbourne, Victoria | Job location |
| job_description | string | Install new basin mixer... | Detailed job description |
| job_is_scheduled_until_stamp | string | 0000-00-00 00:00:00 | Scheduled until timestamp |
| lat | number | -37.8199669 | Latitude |
| lng | number | 144.9834493 | Longitude |
| payment_actioned_by_uuid | string | | Who processed payment |
| payment_amount | number | 0 | Payment amount |
| payment_date | string | 0000-00-00 00:00:00 | Payment date |
| payment_method | string | | Payment method |
| payment_note | string | | Payment notes |
| payment_processed | number | 0 | Payment processed status |
| payment_processed_stamp | string | 0000-00-00 00:00:00 | Payment processed timestamp |
| payment_received | number | 0 | Payment received status |
| payment_received_stamp | string | 0000-00-00 00:00:00 | Payment received timestamp |
| purchase_order_number | string | | Purchase order number |
| queue_assigned_staff_uuid | string | | Assigned staff in queue |
| queue_expiry_date | string | 0000-00-00 00:00:00 | Queue expiry date |
| queue_uuid | string | | Queue identifier |
| quote_date | string | 2022-12-04 11:30:40 | Quote date |
| quote_sent | boolean | false | Quote sent status |
| quote_sent_stamp | string | 0000-00-00 00:00:00 | Quote sent timestamp |
| ready_to_invoice | string | 0 | Ready to invoice status |
| ready_to_invoice_stamp | string | 0000-00-00 00:00:00 | Ready to invoice timestamp |
| related_knowledge_articles | boolean | false | Has related knowledge articles |
| status | string | Work Order | **MANDATORY** Job status |
| total_invoice_amount | string | 393.7500 | Total invoice amount |
| unsuccessful_date | string | 0000-00-00 00:00:00 | Unsuccessful completion date |
| work_done_description | string | Installed new chrome basin mixer... | Work completion description |
| work_order_date | string | 2022-12-04 11:30:41 | Work order date |

## Job Contact Fields (10 total)

| Field Name | Type | Description |
|------------|------|-------------|
| uuid | string | Unique contact identifier |
| active | number | Contact active status |
| edit_date | string | Last edit date |
| email | string | Contact email address |
| first | string | First name |
| last | string | Last name |
| mobile | string | Mobile phone number |
| phone | string | Phone number |
| job_uuid | string | Associated job UUID |
| type | string | Contact type |

## API Validation Results

### Required Fields
- **status** - This field is mandatory for job creation

### Valid Status Values
The API validates job status values. Invalid statuses return a 400 error.

### Sample Valid Job Creation
Minimal job creation requires at least the `status` field. Other fields can be added as needed.

## Notes
- All date fields use format: YYYY-MM-DD HH:MM:SS
- Empty dates are represented as: 0000-00-00 00:00:00
- Geographic coordinates use decimal degrees
- UUIDs follow standard UUID format
- Boolean fields return true/false
- Monetary amounts are stored as strings with decimal values