import fetch from 'node-fetch';

const testAPIEndpoint = async () => {
  try {
    console.log("🔄 Testing API endpoint...");
    
    // Test the getUserDepositRequests endpoint
    const response = await fetch('http://localhost:5000/api/admin/users/68c10ca7bd99043b3f193c33/deposits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper admin token, but we can see the response
      }
    });

    const data = await response.json();
    console.log("API Response:", data);
    console.log("Response Status:", response.status);
    
    if (data.success) {
      console.log("✅ API working, found", data.depositRequests.length, "deposit requests");
    } else {
      console.log("❌ API error:", data.message);
    }
    
  } catch (error) {
    console.error("❌ API test failed:", error.message);
  }
};

// Run test
testAPIEndpoint();