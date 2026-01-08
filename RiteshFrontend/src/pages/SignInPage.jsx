import React, { useState } from "react";
import { authAPI } from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import LogozPng from '../assets/Logoz.png';


const SignInPage = ({ onSignIn, onSignUpClick, onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // ✅ Added state
  const [successMessage, setSuccessMessage] = useState(""); // ✅ For popup
  const [showForgotPassword, setShowForgotPassword] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();

  const defaultEmail = "forex@gmail.com";
  const defaultPassword = "forex@gmail.com";

  setIsLoading(true);
  setErrorMessage("");

  // Offline/default login
  if (email.trim() === defaultEmail && password === defaultPassword) {
    sessionStorage.setItem("token", "offline-default-token");
    sessionStorage.setItem(
      "user",
      JSON.stringify({ email: defaultEmail, name: "Offline User", offline: true })
    );
    onSignIn(defaultEmail);
    alert("✅ Logged in (offline mode)");
    setIsLoading(false);
    return;
  }

  try {
    const data = await authAPI.login(email, password);
    console.log("Login Response:", data);

    // ✅ Save token & user info
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    // ✅ Call App.js onSignIn to update state
    onSignIn(email);

    // ✅ Redirect to profile page
    alert("✅ Login successful!");
  } catch (error) {
    console.error("Login Error:", error);
    setErrorMessage(error.message || "Server unreachable. Please try again later.");
  } finally {
    setIsLoading(false);
  }
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
          className="flex items-center justify-center text-text-secondary hover:text-text-primary bg-card-bg/50 backdrop-blur-sm border border-border-color rounded-xl p-3 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
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
          <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome Back</h2>
          <p className="text-text-secondary">Sign in to your Zerofx.club account</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ✅ Show Error */}
            {errorMessage && (
              <p className="text-red-500 text-center text-sm">{errorMessage}</p>
            )}

            {/* ✅ Show Success */}
            {successMessage && (
              <p className="text-green-500 text-center text-sm">{successMessage}</p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
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
                  placeholder="Enter your password"
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

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-accent-color focus:ring-accent-color border-border-color rounded bg-hover-bg"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-secondary">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-accent-color hover:text-accent-color/80 transition-colors"
                >
                  Forgot password?
                </button>
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
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Don't have an account?{" "}
              <button
                onClick={onSignUpClick}
                className="text-accent-color hover:text-accent-color/80 transition-colors font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-text-secondary text-xs">
            By signing in, you agree to our{" "}
            <a href="#" className="text-accent-color hover:text-accent-color/80 transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-accent-color hover:text-accent-color/80 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default SignInPage;
