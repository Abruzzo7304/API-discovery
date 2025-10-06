// Get complete list of all ServiceM8 badges
const { getAuthHeaders, SERVICEM8_API_BASE } = require('./config');

function getAuthHeaders() {
  const credentials = btoa(`${EMAIL}:${PASSWORD}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json'
  };
}

async function getAllBadges() {
  try {
    console.log('🏷️  COMPLETE SERVICEM8 BADGE LIST');
    console.log('=================================\n');

    const response = await fetch(`${SERVICEM8_API_BASE}/badge.json`, {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const badges = await response.json();

      console.log(`Total badges available: ${badges.length}\n`);

      // Sort by active status and name
      badges.sort((a, b) => {
        if (a.active !== b.active) return b.active - a.active; // Active first
        return a.name.localeCompare(b.name);
      });

      console.log('ACTIVE BADGES:');
      console.log('==============');
      badges.filter(b => b.active).forEach((badge, index) => {
        console.log(`${index + 1}. ${badge.name}`);
        console.log(`   UUID: ${badge.uuid}`);
        console.log(`   File: ${badge.file_name || 'N/A'}`);
        console.log('');
      });

      console.log('\nINACTIVE BADGES:');
      console.log('================');
      badges.filter(b => !b.active).forEach((badge, index) => {
        console.log(`${index + 1}. ${badge.name}`);
        console.log(`   UUID: ${badge.uuid}`);
        console.log(`   File: ${badge.file_name || 'N/A'}`);
        console.log('');
      });

      // Create a reference list for easy copying
      console.log('\n📋 QUICK REFERENCE - ACTIVE BADGES ONLY:');
      console.log('========================================');
      const activeBadges = badges.filter(b => b.active);
      activeBadges.forEach(badge => {
        console.log(`"${badge.name}" → "${badge.uuid}"`);
      });

      console.log('\n🎯 USAGE EXAMPLE:');
      console.log('================');
      console.log('To add badges to a job:');
      console.log('```javascript');
      console.log('"badges": JSON.stringify([');
      activeBadges.slice(0, 3).forEach((badge, index) => {
        console.log(`  "${badge.uuid}"${index < 2 ? ',' : ''} // ${badge.name}`);
      });
      console.log('])');
      console.log('```');

      return badges;
    } else {
      console.log(`❌ Failed to get badges: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error('Error getting badges:', error.message);
    return [];
  }
}

getAllBadges();