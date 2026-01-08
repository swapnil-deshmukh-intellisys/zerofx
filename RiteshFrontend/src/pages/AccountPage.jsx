import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import DepositModal from '../components/DepositModal';
import WithdrawalModal from '../components/WithdrawalModal';
import { accountAPI, adminAPI, depositAPI, withdrawalAPI } from '../services/api';

const AccountPage = ({ userEmail, onSignOut, onProfileClick, onBack, onShowAccountDetails }) => {
  // Check authentication
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
  // Redirect to sign-in if not authenticated
  if (!token || !user.email) {
    console.log('No authentication token found, redirecting to sign-in');
    onBack(); // This will redirect to sign-in page
    return null;
  }

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'LIVE';
  });
  const [showOffersSection, setShowOffersSection] = useState(() => {
    return localStorage.getItem('showOffersSection') === 'true';
  });
  const [adminData, setAdminData] = useState({});
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccountForDeposit, setSelectedAccountForDeposit] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedAccountForWithdrawal, setSelectedAccountForWithdrawal] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('unverified');

  // Save activeTab and showOffersSection to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('showOffersSection', showOffersSection.toString());
  }, [showOffersSection]);

  // Fetch user verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const res = await fetch("https://shraddha-backend.onrender.com/api/auth/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        
        if (res.ok && data.success && data.user) {
          const userData = data.user;
          
          // Check if user has all required documents for verification
          const hasAllDocuments = userData.panDocument && userData.aadharFront && userData.aadharBack;
          const isVerified = hasAllDocuments && userData.verified !== false;
          
          setVerificationStatus(isVerified ? 'verified' : 'unverified');
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
        setVerificationStatus('unverified');
      }
    };

    fetchVerificationStatus();
  }, []);

  // No longer need to load global admin data - using individual account data only
  const [createdAccounts, setCreatedAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.menu-container')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Load accounts from API
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        
        // Check if user is in offline mode
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.offline) {
          // Skip API call for offline mode, use localStorage
          const savedAccounts = localStorage.getItem('createdAccounts');
          if (savedAccounts) {
            setCreatedAccounts(JSON.parse(savedAccounts));
          }
          return;
        }
        
        const response = await accountAPI.getUserAccounts();
        setCreatedAccounts(response.accounts || []);
      } catch (error) {
        console.error('Error loading accounts:', error);
        // Fallback to localStorage if API fails
        const savedAccounts = localStorage.getItem('createdAccounts');
        if (savedAccounts) {
          setCreatedAccounts(JSON.parse(savedAccounts));
        }
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, []);

  // Save created accounts to localStorage whenever it changes (for offline fallback)
  useEffect(() => {
    if (createdAccounts.length > 0) {
      localStorage.setItem('createdAccounts', JSON.stringify(createdAccounts));
    }
  }, [createdAccounts]);
  const carouselRef = useRef(null);

    const liveOffers = [
    {
      title: "Standard",
      status: "Live",
      icon: "star",
      initialDeposit: "40",
      leverage: "1:500",
      description: "Standard Account",
      gradient: "from-green-400 to-teal-500"
    },
    {
      title: "Platinum", 
      status: "Live",
      icon: "diamond",
      initialDeposit: "100",
      leverage: "1:500",
      description: "Platinum Account",
      gradient: "from-green-400 to-teal-500"
    },
    {
      title: "Premium",
      status: "Live", 
      icon: "gift",
      initialDeposit: "500",
      leverage: "1:500",
      description: "Premium Account",
      gradient: "from-green-400 to-teal-500"
    }
  ];

  const demoOffers = [
    {
      title: "Demo Forex Hedge 01",
      status: "Demo",
      icon: "handshake",
      initialDeposit: "250",
      leverage: "1:100",
      description: "Demo Forex Hedge 01",
      gradient: "from-green-400 to-teal-500"
    },
    {
      title: "Demo Forex Hedge 02",
      status: "Demo", 
      icon: "handshake",
      initialDeposit: "1000",
      leverage: "1:100",
      description: "Demo Forex Hedge 02",
      gradient: "from-green-400 to-teal-500"
    }
  ];

  const currentOffers = activeTab === 'LIVE' ? liveOffers : demoOffers;

  const handlePrevious = () => {
    if (carouselRef.current) {
      const cardWidth = 227 + 20; // card width + gap (20% larger than current)
      carouselRef.current.scrollBy({
        left: -cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleNext = () => {
    if (carouselRef.current) {
      const cardWidth = 227 + 20; // card width + gap (20% larger than current)
      carouselRef.current.scrollBy({
        left: cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const canNavigate = currentOffers.length > 1;

  // Function to generate 6-digit account ID
  const generateAccountId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Function to create a new account
  const handleCreateAccount = async (offer) => {
    try {
      // Check if account type already exists
      const accountTypeExists = createdAccounts.some(account => 
        account.type === offer.title && account.status === activeTab
      );
      
      if (accountTypeExists) {
        alert(`A ${offer.title} account already exists for ${activeTab} status. Each account type can only be created once.`);
        return;
      }

      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Create account locally for offline mode
        const newAccount = {
          id: generateAccountId(),
          type: offer.title,
          status: activeTab,
          balance: 0,
          currency: '₹',
          equity: 0,
          margin: 0,
          leverage: offer.leverage || '1:500',
          initialDeposit: parseFloat(offer.initialDeposit) || 0,
          createdAt: new Date().toISOString()
        };
        
        const updatedAccounts = [...createdAccounts, newAccount];
        setCreatedAccounts(updatedAccounts);
        setShowOffersSection(false);
        alert(`✅ ${activeTab} ${offer.title} account created successfully! (Offline mode)`);
        return;
      }

      const accountData = {
        accountType: offer.title,
        status: activeTab,
        initialDeposit: parseFloat(offer.initialDeposit) || 0,
        leverage: offer.leverage || '1:500'
      };

      const response = await accountAPI.createAccount(accountData);
      
      // Reload accounts from API
      const accountsResponse = await accountAPI.getUserAccounts();
      setCreatedAccounts(accountsResponse.accounts || []);
      
      setShowOffersSection(false);
      alert(`✅ ${activeTab} ${offer.title} account created successfully!`);
    } catch (error) {
      console.error('Error creating account:', error);
      alert(`Error creating account: ${error.message}`);
    }
  };

  // Function to show offers section
  const handleAddAccount = () => {
    setShowOffersSection(true);
  };

  // Function to go back to accounts view
  const handleBackToAccounts = () => {
    setShowOffersSection(false);
  };

  // Get display data for an account (use individual account data only)
  const getAccountDisplayData = (account) => {
    // Use individual account data only - no global admin data fallback
      return {
        balance: account.balance || 0,
        currency: account.currency || '₹',
        equity: account.equity || 0,
        margin: account.margin || 0
      };
  };

  // Handle deposit request
  const handleDepositRequest = async (depositRequest) => {
    try {
      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Handle deposit request locally for offline mode
        const proofBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(depositRequest.proof);
        });

        // Store deposit request in localStorage for offline mode
        const depositRequests = JSON.parse(localStorage.getItem('depositRequests') || '[]');
        const newRequest = {
          id: Date.now().toString(),
          accountId: depositRequest.accountType,
          accountType: depositRequest.accountType,
          amount: depositRequest.amount,
          upiApp: depositRequest.upiApp,
          paymentProof: proofBase64,
          proofName: depositRequest.proof.name,
          proofType: depositRequest.proof.type,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        depositRequests.push(newRequest);
        localStorage.setItem('depositRequests', JSON.stringify(depositRequests));
        
        alert('Deposit request submitted successfully! (Offline mode)');
        return;
      }

      // Find the account ID for the selected account
      const account = createdAccounts.find(acc => acc.type === depositRequest.accountType);
      if (!account) {
        alert('Account not found. Please try again.');
        return;
      }

      // Create request object with file
      const requestData = {
        accountId: account._id || account.id,
        accountType: depositRequest.accountType,
        amount: depositRequest.amount,
        upiApp: depositRequest.upiApp,
        paymentProof: depositRequest.proof // Send file directly
      };

      // Submit to API
      await depositAPI.submitDepositRequest(requestData);
      
      // Show success message
      alert('Deposit request submitted successfully! Admin will verify and process your payment.');
    } catch (error) {
      console.error('Error submitting deposit request:', error);
      alert(`Error submitting deposit request: ${error.message}`);
    }
  };

  // Handle deposit button click
  const handleDepositClick = (account) => {
    setSelectedAccountForDeposit(account);
    setShowDepositModal(true);
  };

  // Handle withdrawal request
  const handleWithdrawalRequest = async (withdrawalRequest) => {
    try {
      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Handle withdrawal request locally for offline mode
        const withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
        // Find the account for proper ID mapping
        const account = createdAccounts.find(acc => acc.type === withdrawalRequest.accountType);
        const newRequest = {
          id: Date.now().toString(),
          accountId: account?._id || account?.id || withdrawalRequest.accountType,
          accountType: withdrawalRequest.accountType,
          amount: withdrawalRequest.amount,
          method: withdrawalRequest.method,
          accountDetails: withdrawalRequest.accountDetails,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        withdrawalRequests.push(newRequest);
        localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));
        
        alert('Withdrawal request submitted successfully! (Offline mode)');
        return;
      }

      // Find the account ID for the selected account
      const account = createdAccounts.find(acc => acc.type === withdrawalRequest.accountType);
      if (!account) {
        alert('Account not found. Please try again.');
        return;
      }

      console.log('🔍 Account found for withdrawal:', account);
      console.log('🔍 Account ID being used:', account._id || account.id);

      // Create request object
      const requestData = {
        accountId: account._id || account.id,
        accountType: withdrawalRequest.accountType,
        amount: withdrawalRequest.amount,
        method: withdrawalRequest.method,
        accountDetails: withdrawalRequest.accountDetails
      };

      console.log('🔍 Withdrawal request data:', requestData);

      // Submit to API
      await withdrawalAPI.submitWithdrawalRequest(requestData);
      
      alert('Withdrawal request submitted successfully!');
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      alert(`Error submitting withdrawal request: ${error.message}`);
    }
  };

  // Handle withdrawal button click
  const handleWithdrawalClick = (account) => {
    setSelectedAccountForWithdrawal(account);
    setShowWithdrawalModal(true);
  };

  // Function to delete an account
  const handleDeleteAccount = async (accountId) => {
    try {
      console.log('Deleting account with ID:', accountId);
      
      if (!accountId) {
        alert('Error: Account ID is missing');
        return;
      }

      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Delete account locally for offline mode
        const updatedAccounts = createdAccounts.filter(account => (account._id || account.id) !== accountId);
        setCreatedAccounts(updatedAccounts);
        setOpenMenuId(null);
        alert("Account deleted successfully! (Offline mode)");
        return;
      }

      await accountAPI.deleteAccount(accountId);
      
      // Reload accounts from API
      const accountsResponse = await accountAPI.getUserAccounts();
      setCreatedAccounts(accountsResponse.accounts || []);
      
      setOpenMenuId(null);
      alert("Account deleted successfully!");
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Error deleting account: ${error.message}`);
    }
  };

  // details navigation is handled in App via onShowAccountDetails

  // Function to toggle menu
  const toggleMenu = (accountId) => {
    setOpenMenuId(openMenuId === accountId ? null : accountId);
  };

  // Function to render SVG icons
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'star':
        return (
                          <svg className="w-full h-full text-accent-color" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      case 'diamond':
        return (
          <svg className="w-full h-full text-sky-blue" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        );
      case 'gift':
        return (
          <svg className="w-full h-full text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M7.5 7a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>
          </svg>
        );
      case 'settings':
        return (
          <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        );
      case 'handshake':
        return (
          <svg className="w-full h-full text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L9 6.5l1.5 1.5 2.12-2.12a3.2 3.2 0 0 1 4.24 0l1.41 1.41a3.2 3.2 0 0 1 0 4.24L16.5 13.5l1.5 1.5 1.92-1.92a5.4 5.4 0 0 0 0-7.65z"/>
            <path d="M3.58 19.42a5.4 5.4 0 0 0 7.65 0L15 17.5l-1.5-1.5-2.12 2.12a3.2 3.2 0 0 1-4.24 0l-1.41-1.41a3.2 3.2 0 0 1 0-4.24L7.5 10.5 6 9l-1.92 1.92a5.4 5.4 0 0 0 0 7.65z"/>
            <path d="M14.54 13.54l-3.08-3.08"/>
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      {/* Animated background elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-color/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-accent-color/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <Header 
        userEmail={userEmail} 
        onSignOut={onSignOut} 
        onProfileClick={onProfileClick} 
        onBack={onBack} 
        showBackButton={true}
        isAdmin={false}
        verificationStatus={verificationStatus}
        onHomeClick={() => window.location.href = '/'}
        onAccountsClick={onBack}
      />

      {/* Main Content */}
      <main className="py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="container-custom">
          {!showOffersSection ? (
            /* Accounts View or Details */
            <div>
              {true ? (
                <>
              {/* Page Title */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-text-primary via-text-secondary to-accent-color bg-clip-text text-transparent mb-3">
                  Accounts
                </h1>
              </div>

              {/* Tabs */}
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-accent-color/20 to-accent-color/10 backdrop-blur-md border border-border-color rounded-xl p-1 shadow-lg">
                  <button
                    onClick={() => setActiveTab('LIVE')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'LIVE'
                        ? 'bg-gradient-to-r from-accent-color to-primary-blue text-text-quaternary shadow-lg scale-105'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-color/20'
                      }`}
                  >
                    LIVE
                  </button>
                  <button
                    onClick={() => setActiveTab('DEMO')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'DEMO'
                        ? 'bg-gradient-to-r from-accent-color to-primary-blue text-text-quaternary shadow-lg scale-105'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-color/20'
                      }`}
                  >
                    DEMO
            </button>
              </div>
            </div>
                </>
              ) : null}

              {/* Accounts Carousel */}
              <div className="relative">
                {/* Navigation Arrows */}
                {(createdAccounts.filter(account => account.status.toUpperCase() === activeTab).length > 1 || isMobile) && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color rounded-full flex items-center justify-center text-text-quaternary transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                <button
                      onClick={handleNext}
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color rounded-full flex items-center justify-center text-text-quaternary transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Accounts Horizontal Row */}
              <div
                ref={carouselRef}
                className="flex space-x-4 sm:space-x-5 px-6 sm:px-20 py-7 overflow-x-auto scrollbar-hide scroll-smooth"
              >
                  {/* Existing Accounts */}
                  {createdAccounts
                    .filter(account => account.status.toUpperCase() === activeTab)
                    .map((account, index) => (
                    <div key={account._id || account.id || `account-${index}`} className="group bg-gradient-to-br from-card-bg via-hover-bg to-transparent backdrop-blur-md border border-border-color rounded-xl p-4 sm:p-4 relative min-w-[300px] sm:min-w-[286px] max-w-[320px] sm:max-w-[294px] flex-shrink-0 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-accent-color/50">
                      {/* Gradient Background Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-accent-color via-primary-blue to-accent-color opacity-5 rounded-xl group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>

                      {/* Menu Icon */}
                      <div className="absolute top-4 right-4">
                        <button 
                          onClick={() => toggleMenu(account._id || account.id)}
                          className="text-text-secondary hover:text-text-primary transition-colors relative menu-container"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === (account._id || account.id) && (
                            <div className="absolute right-0 top-8 bg-card-bg border border-border-color rounded-lg shadow-xl z-50 min-w-[120px] py-1">
                              <div
                                onClick={() => handleDeleteAccount(account._id || account.id)}
                                className="w-full px-3 py-2 text-left text-danger-color hover:bg-danger-color/10 transition-colors flex items-center space-x-2 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                                <span className="text-sm">Delete</span>
                              </div>
                            </div>
                          )}
                        </button>
                      </div>

                      {/* Globe/Logo Icon */}
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-accent-color via-primary-blue to-accent-color rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-text-quaternary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-text-primary mb-1">{getAccountDisplayData(account).currency}{getAccountDisplayData(account).balance}</div>
                      </div>

                      {/* Account Details */}
                      <div className="space-y-2 mb-4">
                        <div className="text-center">
                          <div className="text-text-secondary text-xs">Account: {account.id} {account.type}</div>
                        </div>
                        {/* MT5 Credentials */}
                        {account.mt5Id && (
                          <div className="text-center">
                            <div className="text-text-secondary text-xs">MT5 ID: {account.mt5Id}</div>
                          </div>
                        )}
                        {account.mt5Password && (
                          <div className="text-center">
                            <div className="text-text-secondary text-xs">MT5 Password: {account.mt5Password}</div>
                          </div>
                        )}
                        {account.mt5Server && (
                          <div className="text-center">
                            <div className="text-text-secondary text-xs">Server: {account.mt5Server}</div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleDepositClick(account)}
                          className="w-full bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-bold py-3 px-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm"
                        >
                          DEPOSIT
                        </button>
                        <button 
                          onClick={() => handleWithdrawalClick(account)}
                          className="w-full bg-transparent border border-danger-color text-danger-color hover:bg-danger-color hover:text-text-quaternary font-bold py-3 px-3 rounded-lg transition-all duration-300 hover:scale-105 text-sm"
                        >
                          WITHDRAW
                        </button>
              </div>


                      {/* Show Account Details Button */}
                      <button
                        onClick={() => onShowAccountDetails(account)}
                        className="w-full mt-3 bg-gradient-to-r from-accent-color/20 to-accent-color/10 hover:from-accent-color/30 hover:to-accent-color/20 text-text-primary font-bold py-3 px-3 rounded-lg transition-all duration-300 hover:scale-105 border border-border-color text-sm"
                      >
                        SHOW ACCOUNT DETAILS
                      </button>
                    </div>
                  ))}

                  {/* Add New Account Card */}
                  <div 
                    onClick={handleAddAccount}
                    className="group bg-gradient-to-br from-card-bg via-hover-bg to-transparent backdrop-blur-md border border-border-color rounded-xl p-4 sm:p-4 relative min-w-[300px] sm:min-w-[286px] max-w-[320px] sm:max-w-[294px] flex-shrink-0 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-accent-color/50 flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-color to-primary-blue rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8 text-text-quaternary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-text-primary font-bold text-lg">ADD NEW ACCOUNT</h3>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Offers Section */
            <div>
              {/* Back Button */}
              <div className="flex justify-start mb-6">
                <button
                  onClick={handleBackToAccounts}
                  className="flex items-center space-x-2 bg-gradient-to-r from-accent-color/20 to-accent-color/10 hover:from-accent-color/30 hover:to-accent-color/20 text-text-primary font-bold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 border border-border-color"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Accounts</span>
                </button>
              </div>

              {/* Offers Title */}
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-text-primary via-text-secondary to-accent-color bg-clip-text text-transparent mb-3">
                Offers
              </h1>
            </div>

            {/* Tabs */}
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-accent-color/20 to-accent-color/10 backdrop-blur-md border border-border-color rounded-xl p-1 shadow-lg">
                <button
                  onClick={() => {
                    setActiveTab('LIVE');
                    if (carouselRef.current) {
                      carouselRef.current.scrollLeft = 0;
                    }
                  }}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'LIVE'
                        ? 'bg-gradient-to-r from-accent-color to-primary-blue text-text-quaternary shadow-lg scale-105'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-color/20'
                    }`}
                >
                  LIVE ACCOUNTS
                </button>
                <button
                  onClick={() => {
                    setActiveTab('DEMO');
                    if (carouselRef.current) {
                      carouselRef.current.scrollLeft = 0;
                    }
                  }}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'DEMO'
                        ? 'bg-gradient-to-r from-accent-color to-primary-blue text-text-quaternary shadow-lg scale-105'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-color/20'
                    }`}
                >
                  DEMO ACCOUNTS
                </button>
              </div>
            </div>

            {/* Offers Carousel */}
            <div className="relative">
              {/* Navigation Arrows */}
              {canNavigate && (
                <>
                  <button
                    onClick={handlePrevious}
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color rounded-full flex items-center justify-center text-text-quaternary transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={handleNext}
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color rounded-full flex items-center justify-center text-text-quaternary transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Offers Horizontal Row */}
              <div
                ref={carouselRef}
                  className="flex space-x-4 sm:space-x-5 px-6 sm:px-20 py-7 overflow-x-auto scrollbar-hide scroll-smooth"
              >
                {currentOffers.map((offer, index) => (
                    <div key={index} className="group bg-gradient-to-br from-card-bg via-hover-bg to-transparent backdrop-blur-md border border-border-color rounded-xl p-4 sm:p-4 relative min-w-[300px] sm:min-w-[286px] max-w-[320px] sm:max-w-[294px] flex-shrink-0 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:border-accent-color/50">
                    {/* Gradient Background Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${offer.gradient} opacity-5 rounded-xl group-hover:opacity-10 transition-opacity duration-500`}></div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${offer.status === 'Live'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                        }`}>
                        {offer.status}
                      </span>
                    </div>

                                         {/* Title */}
                       <h3 className="text-sm sm:text-base font-bold text-text-primary mb-3 pr-12 sm:pr-16 text-center group-hover:text-accent-color transition-colors duration-300">{offer.title}</h3>

                     {/* Icon */}
                       <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 mx-auto group-hover:scale-110 transition-transform duration-500">
                       {renderIcon(offer.icon)}
                     </div>

                     {/* Details */}
                       <div className="space-y-2 sm:space-y-2.5 mb-4">
                         <div className="flex justify-between items-center bg-accent-color/10 rounded-md p-2">
                           <span className="text-text-secondary text-xs sm:text-sm">Initial deposit:</span>
                           <span className="text-text-primary font-bold text-xs sm:text-sm">${offer.initialDeposit} (₹{parseInt(offer.initialDeposit) * 90})</span>
                       </div>
                         <div className="flex justify-between items-center bg-accent-color/10 rounded-md p-2">
                           <span className="text-text-secondary text-xs sm:text-sm">Leverage:</span>
                           <span className="text-text-primary font-bold text-xs sm:text-sm">{offer.leverage}</span>
                       </div>
                         <div className="flex justify-between items-center bg-accent-color/10 rounded-md p-2">
                           <span className="text-text-secondary text-xs sm:text-sm">Description:</span>
                           <span className="text-text-primary font-medium text-xs sm:text-sm">{offer.description}</span>
                       </div>
                     </div>

                     {/* Action Button */}
                       <button 
                         onClick={() => handleCreateAccount(offer)}
                         className="w-full bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-bold py-3 sm:py-2.5 px-4 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl transform group-hover:shadow-2xl text-sm sm:text-sm"
                       >
                       CREATE {activeTab} ACCOUNT
                     </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </main>

      {/* Support Footer (simplified) - Fixed at bottom on mobile */}
      <section className="bg-gradient-to-r from-accent-color/10 via-accent-color/5 to-transparent border-t border-border-color backdrop-blur-md fixed bottom-0 left-0 right-0 z-40 sm:relative sm:z-auto">
        <div className="container-custom py-3 sm:py-6">
          <div className="text-center">
            <div className="bg-gradient-to-r from-accent-color/20 to-primary-blue/20 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-border-color inline-block">
              <p className="text-accent-color font-bold text-xs sm:text-sm">support@zerofx.club</p>
            </div>
          </div>
        </div>
      </section>

             {/* Sign Out Button - Hidden on mobile, visible on desktop */}
       <div className="hidden sm:block fixed bottom-4 sm:bottom-6 right-4 sm:right-6">
         <button
           onClick={onSignOut}
           className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2 shadow-lg"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
           </svg>
           <span className="font-semibold text-sm sm:text-base">Sign Out</span>
         </button>
       </div>

       <DepositModal
         isOpen={showDepositModal}
         onClose={() => setShowDepositModal(false)}
         accountType={selectedAccountForDeposit?.type}
         onDepositRequest={handleDepositRequest}
       />

       <WithdrawalModal
         isOpen={showWithdrawalModal}
         onClose={() => setShowWithdrawalModal(false)}
         accountType={selectedAccountForWithdrawal?.type}
         currentBalance={selectedAccountForWithdrawal?.balance || 0}
         onWithdrawalRequest={handleWithdrawalRequest}
       />
     </div>
   );
 };

export default AccountPage;


