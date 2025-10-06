// Test ServiceM8 API key authentication
const SERVICEM8_API_BASE = 'https://api.servicem8.com/api_1.0';

// Replace with your actual API key
const API_KEY = 'your_api_key_here';

function getAuthHeaders() {
  // For API key auth: use API key as username, 'x' as password
  const credentials = btoa(`${API_KEY}:x`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function testAPIKeyAuth() {
  console.log('🔐 Testing ServiceM8 API Key Authentication');
  console.log('==========================================\n');
  
  try {
    // Test with a simple request
    console.log('Testing API connection...');
    
    const response = await fetch(
      `${SERVICEM8_API_BASE}/company.json?$top=1`,
      { headers: getAuthHeaders() }
    );
    
    if (response.ok) {
      console.log('✅ API Key authentication successful!');
      const data = await response.json();
      console.log(`   Retrieved ${data.length} company record(s)\n`);
      
      console.log('📋 Authentication Details:');
      console.log('   Method: Basic Auth');
      console.log('   Username: [Your API Key]');
      console.log('   Password: x');
      console.log('\n💡 Your API key is working correctly!');
    } else {
      console.log(`❌ Authentication failed: ${response.status} ${response.statusText}`);
      console.log('\n⚠️  Check that:');
      console.log('   1. Your API key is correct');
      console.log('   2. API key has necessary permissions');
      console.log('   3. Format is: API_KEY:x (with lowercase x)');
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    console.log('\n⚠️  Make sure to replace "your_api_key_here" with your actual API key');
  }
}

// Run test
testAPIKeyAuth();

console.log('\n📝 USAGE NOTES:');
console.log('===============');
console.log('1. Replace API_KEY with your actual ServiceM8 API key');
console.log('2. ServiceM8 uses Basic Auth with API key as username');
console.log('3. Password is always the letter "x" (lowercase)');
console.log('4. Format: Authorization: Basic base64(API_KEY:x)');
console.log('\n🔒 API keys are more secure than username/password!');
console.log('   - Can be revoked without changing password');
console.log('   - Can have limited permissions');
console.log('   - Better for external integrations');