// Mock email service for development - just logs to console
export const sendOTPEmail = async (email, otp, type = 'password_reset') => {
  try {
    console.log('\n📧 ===== EMAIL SENT (MOCK) =====');
    console.log(`📬 To: ${email}`);
    console.log(`📝 Subject: ${type === 'password_reset' ? 'Password Reset OTP' : 'Email Verification OTP'}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log('📧 ================================\n');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, messageId: 'mock-' + Date.now() };
  } catch (error) {
    console.error('❌ Mock email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetSuccessEmail = async (email) => {
  try {
    console.log('\n📧 ===== SUCCESS EMAIL SENT (MOCK) =====');
    console.log(`📬 To: ${email}`);
    console.log(`📝 Subject: Password Reset Successful`);
    console.log(`✅ Message: Your password has been successfully reset!`);
    console.log('📧 ======================================\n');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, messageId: 'mock-success-' + Date.now() };
  } catch (error) {
    console.error('❌ Mock success email error:', error);
    return { success: false, error: error.message };
  }
};
