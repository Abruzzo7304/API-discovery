// ServiceM8 API Configuration
// =============================
// Replace 'your_api_key_here' with your actual ServiceM8 API key
// Get your API key from: Settings → Developer → API Access in ServiceM8

const API_KEY = 'smk-caf68b-68162d875ee7dfb9-d1bd229bc3bf8caf';

const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

function getAuthHeaders() {
  // ServiceM8 uses Basic Auth with API key as username and 'x' as password
  const credentials = btoa(`${API_KEY}:x`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

module.exports = {
  API_KEY,
  SERVICEM8_API_BASE,
  getAuthHeaders
};
