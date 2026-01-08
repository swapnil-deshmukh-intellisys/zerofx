import nodemailer from 'nodemailer';

// Create transporter with your email credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendOTPEmail = async (email, otp, type = 'password_reset') => {
  try {
    console.log('📧 ===== EMAIL SERVICE START =====');
    console.log(`📬 To: ${email}`);
    console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
    console.log(`📧 Email Pass Available: ${process.env.EMAIL_PASS ? 'YES' : 'NO'}`);
    
    const transporter = createTransporter();
    
    // Verify transporter connection
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    
    const subject = type === 'password_reset' 
      ? 'Password Reset OTP - Express Forex' 
      : 'Email Verification OTP - Express Forex';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Express Forex</h1>
          <p style="color: #666; margin: 5px 0;">Your trusted forex trading partner</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">
            ${type === 'password_reset' ? 'Password Reset Request' : 'Email Verification'}
          </h2>
          
          <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
            ${type === 'password_reset' 
              ? 'You requested to reset your password. Use the OTP below to verify your identity and set a new password.'
              : 'Please verify your email address using the OTP below.'
            }
          </p>
          
          <div style="background: #fff; border: 2px dashed #007bff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h3>
          </div>
          
          <p style="color: #666; font-size: 14px; margin: 20px 0;">
            This OTP is valid for <strong>10 minutes</strong> and can only be used once.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> If you didn't request this ${type === 'password_reset' ? 'password reset' : 'verification'}, 
              please ignore this email and contact our support team.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 Express Forex. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@expressforex.com',
      to: email,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', result.messageId);
    console.log('📧 ===== EMAIL SERVICE END =====\n');
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    
    // Specific Gmail error handling
    if (error.code === 'EAUTH') {
      console.error('🔑 Gmail Authentication Error - Check EMAIL_USER and EMAIL_PASS');
      console.error('🔑 Make sure to use an App Password, not your regular password');
      console.error('🔑 Enable 2-factor authentication and generate App Password');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection Error - Check internet connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Timeout Error - Try again');
    }
    
    console.log('📧 ===== EMAIL SERVICE FAILED =====\n');
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetSuccessEmail = async (email) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">Express Forex</h1>
          <p style="color: #666; margin: 5px 0;">Your trusted forex trading partner</p>
        </div>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #155724; margin-bottom: 20px;">✅ Password Reset Successful</h2>
          
          <p style="color: #155724; margin-bottom: 20px; line-height: 1.6;">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          
          <div style="background: #fff; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #155724; margin: 0; font-size: 14px;">
              <strong>Security Tip:</strong> If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; 2024 Express Forex. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@expressforex.com',
      to: email,
      subject: 'Password Reset Successful - Express Forex',
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset success email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending password reset success email:', error);
    return { success: false, error: error.message };
  }
};
