import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import AccountPage from './pages/AccountPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import ProfilePage from './pages/ProfilePage';
import AboutUs from './pages/AboutUs'; // Add this import
import ContactUs from './pages/ContactUs';
import AdminPanel from './pages/AdminPanel';
import UserListPage from './pages/UserListPage';
import AdminLogin from './components/AdminLogin';
import Footer from './components/Footer';
import ReferralLinksPage from './pages/ReferralLinksPage';
import { ThemeProvider } from './contexts/ThemeContext';

import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('currentPage') || 'home';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return sessionStorage.getItem('userEmail') || '';
  });
  const [previousPage, setPreviousPage] = useState(() => {
    return localStorage.getItem('previousPage') || 'home';
  });
  const [selectedAccount, setSelectedAccount] = useState(() => {
    const saved = localStorage.getItem('selectedAccount');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminEmail, setAdminEmail] = useState(() => {
    // Check for admin session in sessionStorage
    const adminUser = sessionStorage.getItem('adminUser');
    const adminToken = sessionStorage.getItem('adminToken');
    const adminEmailStorage = sessionStorage.getItem('adminEmail');
    
    // First check if adminEmail is directly stored
    if (adminEmailStorage) {
      return adminEmailStorage;
    }
    
    // Fallback to parsing adminUser data
    if (adminUser && adminToken) {
      try {
        const adminData = JSON.parse(adminUser);
        return adminData.email || '';
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        return '';
      }
    }
    
    return '';
  });

  // Add selectedUser state for admin panel
  const [selectedUser, setSelectedUser] = useState(() => {
    const saved = localStorage.getItem('selectedUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem('userEmail', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('previousPage', previousPage);
  }, [previousPage]);

  useEffect(() => {
    if (selectedAccount) {
      localStorage.setItem('selectedAccount', JSON.stringify(selectedAccount));
    } else {
      localStorage.removeItem('selectedAccount');
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (adminEmail) {
      sessionStorage.setItem('adminEmail', adminEmail);
      // Also ensure adminUser and adminToken are set
      if (!sessionStorage.getItem('adminUser')) {
        sessionStorage.setItem('adminUser', JSON.stringify({ 
          email: adminEmail, 
          name: 'Admin User', 
          role: 'admin' 
        }));
      }
      // Don't override existing adminToken - let the login process handle it
    } else {
      sessionStorage.removeItem('adminEmail');
    }
  }, [adminEmail]);

  // Save selectedUser to localStorage whenever it changes
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('selectedUser', JSON.stringify(selectedUser));
    } else {
      localStorage.removeItem('selectedUser');
    }
  }, [selectedUser]);

  // Admin panel access via keyboard shortcut (Ctrl + Shift + A) - REMOVED FOR SECURITY
  // useEffect(() => {
  //   const handleKeyDown = (event) => {
  //     if (event.ctrlKey && event.shiftKey && event.key === 'A') {
  //       event.preventDefault();
  //       handleAdminClick();
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, []);

  const handleSignIn = (email) => {
    setUserEmail(email);
    setPreviousPage('home'); // Set previous page to home for proper back navigation
    setCurrentPage('account');
  };

  const handleSignOut = () => {
    setUserEmail('');
    setPreviousPage('home');
    setCurrentPage('signin'); // Redirect to sign-in page after logout
    // Clear sessionStorage on sign out
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.setItem('currentPage', 'signin');
    localStorage.setItem('previousPage', 'home');
  };

  const handleSignInClick = () => {
    setPreviousPage(currentPage);
    setCurrentPage('signin');
  };

  const handleSignUpClick = () => {
    setPreviousPage(currentPage);
    setCurrentPage('signup');
  };

  const handleProfileClick = () => {
    console.log('handleProfileClick called in App.jsx');
    console.log('Current page before:', currentPage);
    setPreviousPage(currentPage); // This ensures we always go back to the current page
    setCurrentPage('profile');
    console.log('Setting page to profile');
  };

  const handleAboutUsClick = () => {
    setPreviousPage(currentPage);
    setCurrentPage('aboutus');
  };

  const handleBackClick = () => {
    console.log('handleBackClick called - going to:', previousPage);
    setCurrentPage(previousPage);
  };

  const handleAccountBackClick = () => {
    setCurrentPage('home');
  };

  const handleSignInBackClick = () => {
    setCurrentPage('home');
  };

  const handleAboutUsBackClick = () => {
    setCurrentPage(previousPage);
  };

  const handleProfileBackClick = () => {
    setCurrentPage('account');
  };

  const handleShowAccountDetails = (account) => {
    setSelectedAccount(account);
    setPreviousPage('account');
    setCurrentPage('accountDetails');
  };

  const handleAccountDetailsBack = () => {
    setSelectedAccount(null);
    setCurrentPage('account');
  };

  // Add this state handler function
  const handleContactUsClick = () => {
    setPreviousPage(currentPage);
    setCurrentPage('contactus');
  };

  const handleHomeClick = () => {
    setCurrentPage('home');
  };

  const handleAdminClick = () => {
    // Check if admin is logged in by checking sessionStorage
    const adminToken = sessionStorage.getItem('adminToken');
    const adminUser = sessionStorage.getItem('adminUser');
    const isAdminLoggedIn = adminToken && adminUser;
    
    if (isAdminLoggedIn) {
      // If admin is logged in, go directly to user list
      setCurrentPage('userlist');
    } else {
      // If admin is not logged in, go to admin login page
      setPreviousPage(currentPage);
      setCurrentPage('adminlogin');
    }
  };

  const handleAccountsClick = () => {
    // Check if user is authenticated before allowing access to account page
    if (!userEmail) {
      // If not authenticated, redirect to sign-in page
      setPreviousPage(currentPage);
      setCurrentPage('signin');
      return;
    }
    setPreviousPage(currentPage);
    setCurrentPage('account');
  };

  const handleAdminLogin = (email) => {
    setAdminEmail(email);
    setCurrentPage('userlist');
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCurrentPage('admin');
  };

  const handleBackToUserList = () => {
    setSelectedUser(null);
    setCurrentPage('userlist');
  };

  const handleAdminLogout = () => {
    console.log('Admin logout called');
    setAdminEmail('');
    setPreviousPage('home');
    setCurrentPage('home');
    // Clear admin sessionStorage on logout
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminEmail');
    // Update localStorage
    localStorage.setItem('currentPage', 'home');
    localStorage.setItem('previousPage', 'home');
    // Dispatch custom event to notify components of admin logout
    window.dispatchEvent(new CustomEvent('adminLogout'));
    console.log('Admin logout completed');
  };

  const handleAdminBack = () => {
    setCurrentPage('home');
  };

  const handleReferralLinksClick = () => {
    setCurrentPage('referrallinks');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'signin':
        return <SignInPage onSignIn={handleSignIn} onSignUpClick={handleSignUpClick} onBack={handleSignInBackClick} />;
      case 'signup':
        return <SignUpPage onSignUp={handleSignIn} onBackToSignIn={handleSignInClick} />;
      case 'account':
        return <AccountPage userEmail={userEmail} onSignOut={handleSignOut} onProfileClick={handleProfileClick} onBack={handleAccountBackClick} onShowAccountDetails={handleShowAccountDetails} />;
      case 'accountDetails':
        return <AccountDetailsPage account={selectedAccount} onBack={handleAccountDetailsBack} onSignOut={handleSignOut} onProfileClick={handleProfileClick} />;
      case 'profile':
        return <ProfilePage userEmail={userEmail} onSignOut={handleSignOut} onBack={handleProfileBackClick} onProfileClick={handleProfileClick} />;
      case 'aboutus': // Add case for About Us page
        return <AboutUs onSignUpClick={handleSignUpClick} />;
      case 'contactus':
        return <ContactUs onSignUpClick={handleSignUpClick} />;
      case 'adminlogin':
        return <AdminLogin onAdminLogin={handleAdminLogin} onBack={handleAdminBack} />;
      case 'userlist':
        return <UserListPage onBack={handleAdminBack} onSignOut={handleAdminLogout} onProfileClick={handleProfileClick} onUserSelect={handleUserSelect} onAdminLogin={() => setCurrentPage('adminlogin')} adminEmail={adminEmail} onReferralLinksClick={handleReferralLinksClick} />;
      case 'admin':
        return <AdminPanel selectedUser={selectedUser} onBack={handleBackToUserList} onSignOut={handleAdminLogout} onProfileClick={handleProfileClick} onUserSelect={handleUserSelect} onReferralLinksClick={handleReferralLinksClick} />;
      case 'referrallinks':
        return <ReferralLinksPage onBack={handleAdminBack} onSignOut={handleAdminLogout} onProfileClick={handleProfileClick} onReferralLinksClick={handleReferralLinksClick} />;

      default:
        return (
          <>
            <HomePage onSignUpClick={handleSignUpClick} />
            <Footer 
          onAboutUsClick={handleAboutUsClick}
          onContactUsClick={handleContactUsClick}
        />
          </>
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="App">
        {(currentPage === 'home' || currentPage === 'aboutus' || currentPage === 'contactus') &&
          <Navbar
            onSignInClick={handleSignInClick}
            onAboutUsClick={handleAboutUsClick}
            onContactUsClick={handleContactUsClick}
            onHomeClick={handleHomeClick}
            onAdminClick={handleAdminClick}
            onAccountsClick={handleAccountsClick}
            currentPage={currentPage}
            userEmail={userEmail}
            adminEmail={adminEmail}
          />
        }
        {renderPage()}
      </div>
    </ThemeProvider>
  );
}

export default App;