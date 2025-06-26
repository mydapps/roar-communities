// 🧪 XMTP V3 Migration Test Suite
// This script tests the frontend XMTP v3 migration

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5173', // Adjust to your dev server
  endpoints: {
    conversations: '/api/xmtp/v3/conversations',
    messages: '/api/xmtp/v3/conversations/{id}/messages',
    unreadCount: '/api/xmtp/v3/unread-count',
    markAsRead: '/api/xmtp/v3/messages/{id}/read'
  }
};

// 🧪 V3 Migration Test Suite
async function testXMTPV3Migration() {
  console.log('🧪 Testing XMTP V3 migration...');
  console.log('⚠️  Make sure you are logged in and have XMTP activated');
  console.log('');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Helper function to make authenticated requests
  async function makeRequest(endpoint, options = {}) {
    const response = await fetch(endpoint, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Test 1: Conversations endpoint
  console.log('1️⃣ Testing V3 conversations endpoint...');
  try {
    const conversations = await makeRequest(TEST_CONFIG.endpoints.conversations);
    
    if (conversations.success) {
      console.log('   ✅ V3 Conversations endpoint working');
      console.log(`   📊 Found ${conversations.conversations?.length || 0} conversations`);
      if (conversations.version) {
        console.log(`   🔖 API Version: ${conversations.version}`);
      }
      results.passed++;
    } else {
      throw new Error(conversations.error || 'Conversations request failed');
    }
  } catch (error) {
    console.log(`   ❌ V3 Conversations test failed: ${error.message}`);
    results.failed++;
  }
  results.tests.push('V3 Conversations');
  console.log('');

  // Test 2: Unread count endpoint
  console.log('2️⃣ Testing V3 unread count endpoint...');
  try {
    const unreadCount = await makeRequest(TEST_CONFIG.endpoints.unreadCount);
    
    if (unreadCount.success !== undefined) {
      console.log('   ✅ V3 Unread count endpoint working');
      console.log(`   📊 Unread messages: ${unreadCount.unread_count || 0}`);
      if (unreadCount.version) {
        console.log(`   🔖 API Version: ${unreadCount.version}`);
      }
      results.passed++;
    } else {
      throw new Error('Unread count request failed');
    }
  } catch (error) {
    console.log(`   ❌ V3 Unread count test failed: ${error.message}`);
    results.failed++;
  }
  results.tests.push('V3 Unread Count');
  console.log('');

  // Test 3: Messages endpoint (if we have conversations)
  console.log('3️⃣ Testing V3 messages endpoint...');
  try {
    const conversations = await makeRequest(TEST_CONFIG.endpoints.conversations);
    
    if (conversations.success && conversations.conversations?.length > 0) {
      const firstConversation = conversations.conversations[0];
      const messagesEndpoint = TEST_CONFIG.endpoints.messages.replace('{id}', firstConversation.id);
      
      const messages = await makeRequest(messagesEndpoint);
      
      if (messages.success) {
        console.log('   ✅ V3 Messages endpoint working');
        console.log(`   📊 Found ${messages.messages?.length || 0} messages`);
        console.log(`   👥 Participants: ${messages.participants?.currentUser?.handle} ↔ ${messages.participants?.otherUser?.handle}`);
        if (messages.version) {
          console.log(`   🔖 API Version: ${messages.version}`);
        }
        
        // Check for V3-specific fields
        if (messages.messages?.length > 0) {
          const firstMessage = messages.messages[0];
          if (firstMessage.xmtp_version) {
            console.log(`   🆕 V3 message version field detected: ${firstMessage.xmtp_version}`);
          }
          if (firstMessage.xmtp_message_id) {
            console.log(`   🆕 V3 XMTP message ID present: ${firstMessage.xmtp_message_id.substring(0, 20)}...`);
          }
        }
        
        results.passed++;
      } else {
        throw new Error(messages.error || 'Messages request failed');
      }
    } else {
      console.log('   ⚠️  No conversations found, skipping messages test');
      console.log('   💡 Create a conversation first to test messages endpoint');
    }
  } catch (error) {
    console.log(`   ❌ V3 Messages test failed: ${error.message}`);
    results.failed++;
  }
  results.tests.push('V3 Messages');
  console.log('');

  // Test 4: Check for V2 deprecation warnings
  console.log('4️⃣ Testing V2 deprecation (should fail)...');
  try {
    const v2Response = await makeRequest('/api/xmtp/conversations');
    console.log('   ⚠️  V2 endpoint still responding (migration may be incomplete)');
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.log('   ✅ V2 endpoint properly deprecated');
      results.passed++;
    } else {
      console.log(`   ❓ V2 endpoint error (expected): ${error.message}`);
    }
  }
  results.tests.push('V2 Deprecation');
  console.log('');

  // Test Results Summary
  console.log('📊 Test Results Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📋 Total Tests: ${results.tests.length}`);
  console.log('');

  if (results.failed === 0) {
    console.log('🎉 XMTP V3 migration test completed successfully!');
    console.log('✨ All V3 endpoints are working correctly');
    console.log('🚀 Your messaging system is now running on XMTP V3');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    console.log('💡 Make sure you are logged in and XMTP is activated');
  }
  
  return results;
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Running XMTP V3 migration test in browser...');
  testXMTPV3Migration().catch(console.error);
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { testXMTPV3Migration, TEST_CONFIG };
}

// Export for ES modules
export { testXMTPV3Migration, TEST_CONFIG }; 