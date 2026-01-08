import { cloudinary } from './config/cloudinary.js';

// Test Cloudinary configuration
const testCloudinary = async () => {
  try {
    console.log('Testing Cloudinary configuration...');
    
    // Check if all required environment variables are set
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars.join(', '));
      console.log('Please add these to your .env file');
      return false;
    }
    
    // Test Cloudinary connection by trying to get account info
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Run the test
testCloudinary();
