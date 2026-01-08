// Resend Email Service - More reliable for Render deployment
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp, type = 'password_reset') => {
  try {
    console.log('📧 ===== RESEND EMAIL SERVICE START =====');
    console.log(`📬 To: ${email}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log(`📧 Resend API Key configured: ${process.env.RESEND_API_KEY ? 'YES' : 'NO'}`);
    
    const subject = type === 'password_reset' 
      ? 'Password Reset OTP - ZeroFX' 
      : 'Email Verification OTP - ZeroFX';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">ZeroFX</h1>
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
          <p>&copy; 2024 ZeroFX. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'ZeroFX <noreply@zerofx.club>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ OTP email sent successfully via Resend:', data);
    console.log('📧 ===== RESEND EMAIL SERVICE END =====\n');
    return { success: true, messageId: data.id };
    
  } catch (error) {
    console.error('❌ Error sending OTP email via Resend:', error);
    console.log('📧 ===== RESEND EMAIL SERVICE FAILED =====\n');
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetSuccessEmail = async (email) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">ZeroFX</h1>
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
          <p>&copy; 2024 ZeroFX. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'ZeroFX <noreply@zerofx.club>',
      to: [email],
      subject: 'Password Reset Successful - ZeroFX',
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Password reset success email sent via Resend:', data);
    return { success: true, messageId: data.id };
    
  } catch (error) {
    console.error('❌ Error sending password reset success email via Resend:', error);
    return { success: false, error: error.message };
  }
};
