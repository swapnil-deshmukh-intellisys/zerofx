import React, { useState } from 'react';
import { authAPI } from '../services/api';
import LogozPng from '../assets/Logoz.png';

const AdminLogin = ({ onAdminLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      console.log('Attempting admin login with:', email.trim());
      // Use the admin-specific authentication API
      const response = await authAPI.adminLogin(email.trim(), password);
      console.log('Admin login response:', response);
      
      if (response.success) {
        // Store admin session with real token
        sessionStorage.setItem('adminToken', response.token);
        sessionStorage.setItem('adminUser', JSON.stringify({ 
          email: response.user.email, 
          name: response.user.fullName, 
          role: 'admin',
          id: response.user.id
        }));
        sessionStorage.setItem('adminEmail', response.user.email);
        
        onAdminLogin(response.user.email);
        alert('✅ Admin login successful!');
      } else {
        console.error('Login failed:', response.message);
        setErrorMessage(response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrorMessage(`Login failed: ${error.message}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-color/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-accent-color/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Back Button fixed to viewport top-left */}
      <div className="fixed top-4 left-4 z-20">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary bg-card-bg/50 backdrop-blur-sm border border-border-color rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo + Heading */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-2 rounded-2xl bg-white blur-md" />
              <img src={LogozPng} alt="Zerofx.club" className="relative h-12 w-auto object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Admin Access</h2>
          <p className="text-text-secondary">Sign in to access the admin panel</p>
        </div>
        
        {/* Admin Login Form */}
        <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Show Error */}
            {errorMessage && (
              <p className="text-red-500 text-center text-sm">{errorMessage}</p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Admin Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                placeholder="Enter admin email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Admin Password
              </label>
              <div className="relative">
              <input
                id="password"
                name="password"
                  type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all pr-12"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
            </div>
          </div>

            {/* Security Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-yellow-500 text-sm font-medium">Admin Access Only</p>
                  <p className="text-yellow-500/80 text-xs mt-1">This area is restricted to authorized administrators only.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-accent-color to-accent-color/90 text-text-quaternary font-semibold py-3 px-4 rounded-xl hover:from-accent-color/90 hover:to-accent-color/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-quaternary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                "Access Admin Panel"
              )}
            </button>
          </form>
          </div>

          <div className="text-center">
          <p className="text-text-secondary text-xs">
            Authorized personnel only. All access attempts are logged.
              </p>
            </div>
      </div>
    </div>
  );
};

export default AdminLogin;
