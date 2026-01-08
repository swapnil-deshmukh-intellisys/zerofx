import React, { useState, useEffect } from 'react';
import TickerTape from '../widgets/TickerTape';
import LogozPng from '../assets/Logoz.png';
import { useTheme } from '../contexts/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';

const Navbar = ({ onSignInClick, onAboutUsClick, onContactUsClick, onHomeClick, onAdminClick, onAccountsClick, currentPage, userEmail, adminEmail }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const marketData = [
    { instrument: 'US 100', value: '18,234.50', change: '+0.45%', isPositive: true },
    { instrument: 'EUR/₹', value: '1.0856', change: '-0.12%', isPositive: false },
    { instrument: 'Bitcoin', value: '₹43,250', change: '+2.34%', isPositive: true },
    { instrument: 'Gold', value: '₹2,045', change: '+0.78%', isPositive: true },
  ];

  const handleHomeClick = () => {
    if (currentPage !== 'home') {
      onHomeClick();
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-bg-primary/95 backdrop-blur-md shadow-md' : 'bg-bg-primary'
    }`}>
      {/* Market Data Ticker */}
      <div className="bg-black">
        <TickerTape />
      </div>

      {/* Main Navigation */}
      <div className="bg-bg-primary/95 backdrop-blur-md border-b border-border-color">
        <div className="container-custom">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={handleHomeClick}>
              <img src={LogozPng} alt="Zerofx.club" className="h-10 w-auto object-contain" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <button 
                onClick={handleHomeClick}
                className={`font-semibold relative ${
                  currentPage === 'home' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                } transition-colors`}
              >
                Home
                {currentPage === 'home' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-color"></div>
                )}
              </button>
              <button 
                onClick={onAboutUsClick}
                className={`font-medium relative ${
                  currentPage === 'aboutus' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                } transition-colors`}
              >
                About Us
                {currentPage === 'aboutus' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-color"></div>
                )}
              </button>
              <button 
                onClick={onContactUsClick}
                className={`font-medium relative ${
                  currentPage === 'contactus' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                } transition-colors`}
              >
                Contact
                {currentPage === 'contactus' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-color"></div>
                )}
              </button>
              {/* Always visible admin link */}
                <button 
                  onClick={onAdminClick}
                  className={`font-medium relative ${
                  currentPage === 'admin' || currentPage === 'adminlogin' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  } transition-colors`}
                >
                  Admin
                {(currentPage === 'admin' || currentPage === 'adminlogin') && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-color"></div>
                  )}
                </button>
            </div>

            {/* Theme Toggle and CTA Button */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg hover:bg-hover-bg transition-colors text-text-primary"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <FaSun className="w-5 h-5" />
                ) : (
                  <FaMoon className="w-5 h-5" />
                )}
              </button>
              
              {/* CTA Button - Shows Sign In when logged out, Accounts when logged in */}
              <button 
                onClick={userEmail ? onAccountsClick : onSignInClick}
                className={`font-semibold px-6 py-3 rounded-xl transition-colors ${
                  userEmail 
                    ? 'bg-card-bg text-text-primary hover:bg-hover-bg border border-border-color' 
                    : 'bg-accent-color text-text-quaternary hover:bg-accent-color/90'
                }`}
              >
                {userEmail ? 'Accounts' : 'Sign In'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-hover-bg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border-color bg-bg-primary">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => {
                    handleHomeClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left font-semibold ${
                    currentPage === 'home' ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  Home
                </button>
                <button 
                  onClick={() => {
                    onAboutUsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left font-medium ${
                    currentPage === 'aboutus' ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  About Us
                </button>
                <button 
                  onClick={() => {
                    onContactUsClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left font-medium ${
                    currentPage === 'contactus' ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  Contact
                </button>
                {/* Always visible admin link */}
                  <button 
                    onClick={() => {
                      onAdminClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-left font-medium ${
                    currentPage === 'admin' || currentPage === 'adminlogin' ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    Admin
                  </button>
                {/* Theme Toggle in Mobile Menu */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="flex items-center justify-center space-x-2 p-3 rounded-lg hover:bg-hover-bg transition-colors w-full mt-4 text-text-primary"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <>
                      <FaSun className="w-5 h-5" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <FaMoon className="w-5 h-5" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => {
                    if (userEmail) {
                      onAccountsClick();
                    } else {
                      onSignInClick();
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`font-semibold px-6 py-3 rounded-xl transition-colors w-full mt-4 ${
                    userEmail 
                      ? 'bg-card-bg text-text-primary hover:bg-hover-bg border border-border-color' 
                      : 'bg-accent-color text-text-quaternary hover:bg-accent-color/90'
                  }`}
                >
                  {userEmail ? 'Accounts' : 'Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;