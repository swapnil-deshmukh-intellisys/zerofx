import fetch from 'node-fetch';

const quickTest = async () => {
  try {
    console.log("🔄 Testing signup...");
    
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountType: 'Standard',
        email: 'quick-test@example.com',
        password: 'test123',
        repeatPassword: 'test123',
        fullName: 'Quick Test',
        fatherName: 'Test Father',
        motherName: 'Test Mother',
        gender: 'male',
        dateOfBirth: '1990-01-01',
        mobileCode: '+91',
        mobileNumber: '1234567890',
        country: 'US',
        state: 'CA',
        city: 'LA',
        postalCode: '90210',
        streetAddress: '123 Test St',
        termsAccepted: true,
        privacyAccepted: true
      })
    });

    const data = await response.json();
    console.log("Response:", data);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
};

quickTest();
