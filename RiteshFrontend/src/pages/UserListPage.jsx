import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { adminAPI, authAPI, depositAPI, withdrawalAPI } from '../services/api';
import { validateAdminAccess, clearAdminSession } from '../utils/authUtils';

const UserListPage = ({ onBack, onSignOut, onProfileClick, onUserSelect, onAdminLogin, adminEmail, onReferralLinksClick = null }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [pendingRequests, setPendingRequests] = useState({ deposits: [], withdrawals: [] });

  // Load pending requests
  const loadPendingRequests = async () => {
    try {
      const [depositsResponse, withdrawalsResponse] = await Promise.all([
        depositAPI.getDepositRequests('pending'),
        withdrawalAPI.getWithdrawalRequests('pending')
      ]);

      const newPendingRequests = {
        deposits: depositsResponse.success ? depositsResponse.depositRequests || [] : [],
        withdrawals: withdrawalsResponse.success ? withdrawalsResponse.withdrawalRequests || [] : []
      };
      
      setPendingRequests(newPendingRequests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests({ deposits: [], withdrawals: [] });
    }
  };

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        const response = await adminAPI.getAllUsers();
        if (response.success && response.users && Array.isArray(response.users)) {
          // Ensure each user has required properties and normalize id
          const validUsers = response.users
            .filter(user => 
              user && 
              typeof user === 'object' && 
              (user.id || user._id) && 
              user.email
            )
            .map(user => ({
              // normalize id for consistent downstream usage
              id: user.id || user._id,
              ...user,
            }));
          setUsers(validUsers);
        } else {
          console.error('Failed to load users:', response.message || 'Unknown error');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
    loadPendingRequests();
  }, [adminEmail]);

  // Listen for custom admin logout event
  useEffect(() => {
    const handleAdminLogout = () => {
      setUsers([]);
    };

    window.addEventListener('adminLogout', handleAdminLogout);
    
    return () => window.removeEventListener('adminLogout', handleAdminLogout);
  }, []);

  // Validate admin access on component mount - TEMPORARILY DISABLED
  // useEffect(() => {
  //   const validateAccess = async () => {
  //     const adminToken = sessionStorage.getItem('adminToken');
  //     const adminUser = sessionStorage.getItem('adminUser');
  //     const isAdminLoggedIn = adminToken && adminUser;
      
  //     if (isAdminLoggedIn) {
  //       try {
  //         const isValidAdmin = await validateAdminAccess();
  //         if (!isValidAdmin) {
  //           console.log('Invalid admin session, redirecting to login');
  //           clearAdminSession();
  //           // Redirect to admin login
  //           if (onAdminLogin) {
  //             onAdminLogin();
  //           }
  //         }
  //       } catch (error) {
  //         console.error('Error validating admin access:', error);
  //         clearAdminSession();
  //         if (onAdminLogin) {
  //           onAdminLogin();
  //         }
  //       }
  //     }
  //   };

  //   validateAccess();
  // }, [onAdminLogin]);

  // Filter users based on search term and filter
  const filteredUsers = (users || []).filter(user => {
    // Ensure user object exists
    if (!user) return false;
    
    // Add null checks to prevent errors
    const fullName = user.fullName || '';
    const email = user.email || '';
    const accountType = user.accountType || '';
    const status = user.status || '';
    
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         accountType.toLowerCase() === selectedFilter.toLowerCase() ||
                         status.toLowerCase() === selectedFilter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const handleUserSelect = (user) => {
    if (user && (user.id || user._id)) {
      const normalized = user.id ? user : { id: user._id, ...user };
      onUserSelect(normalized);
    } else {
      console.error('Invalid user object:', user);
    }
  };

  const handleCreateAdminUser = async () => {
    try {
      console.log('Creating admin user...');
      const response = await authAPI.createAdminUser();
      console.log('Admin user creation response:', response);
      
      if (response.success) {
        alert('✅ Admin user created successfully! You can now login');
        // Reload users after creating admin user
        window.location.reload();
      } else {
        alert(`❌ Failed to create admin user: ${response.message}`);
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
      alert(`❌ Error creating admin user: ${error.message}`);
    }
  };

  // Helper function to safely format balance
  const formatBalance = (balance) => {
    try {
      const numBalance = Number(balance);
      return isNaN(numBalance) ? '0.00' : numBalance.toFixed(2);
    } catch (error) {
      return '0.00';
    }
  };

  // Check if user has pending requests
  const hasPendingRequests = (userId) => {
    const userDeposits = pendingRequests.deposits.filter(req => req.user === userId || req.user?._id === userId);
    const userWithdrawals = pendingRequests.withdrawals.filter(req => req.userId === userId || req.userId?._id === userId);
    const hasPending = userDeposits.length > 0 || userWithdrawals.length > 0;
    
    
    return hasPending;
  };

  // Get pending request count for user
  const getPendingRequestCount = (userId) => {
    const userDeposits = pendingRequests.deposits.filter(req => req.user === userId || req.user?._id === userId);
    const userWithdrawals = pendingRequests.withdrawals.filter(req => req.userId === userId || req.userId?._id === userId);
    return userDeposits.length + userWithdrawals.length;
  };

  // Handle notification click - navigate to user management
  const handleNotificationClick = async (request, requestType) => {
    // Extract user id reliably from request shapes
    const extractUserId = () => {
      if (!request) return null;
      if (requestType === 'deposit') {
        if (typeof request.user === 'string') return request.user;
        if (request.user && (request.user.id || request.user._id)) return request.user.id || request.user._id;
      } else if (requestType === 'withdrawal') {
        if (typeof request.userId === 'string') return request.userId;
        if (request.userId && (request.userId.id || request.userId._id)) return request.userId.id || request.userId._id;
      }
      return null;
    };

    const userId = extractUserId();

    if (!userId) {
      alert('Unable to identify user for this request.');
      return;
    }

    // Try local list first
    const localUser = users.find(u => (u.id || u._id) === userId);
    if (localUser) {
      handleUserSelect(localUser);
      return;
    }

    console.log('User not found in current list, attempting to load user data...');
    try {
      const response = await adminAPI.getUserById(userId);
      if (response && response.success && response.user) {
        const normalized = { id: response.user.id || response.user._id, ...response.user };
        handleUserSelect(normalized);
      } else {
        alert('User not found. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Failed to load user by id:', err);
      alert('Failed to load user details. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-color"></div>
          <p className="text-text-secondary mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  // Check if admin is logged in
  const adminToken = sessionStorage.getItem('adminToken');
  const adminUser = sessionStorage.getItem('adminUser');
  const isAdminLoggedIn = adminToken && adminUser;

  // If admin is not logged in, show login/creation options
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-color/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-accent-color/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <Header 
          userEmail="admin@forex.com" 
          onSignOut={onSignOut} 
          onProfileClick={onProfileClick} 
          onBack={onBack} 
          showBackButton={true}
          isAdmin={true}
          onHomeClick={() => window.location.href = '/'}
        />
        
        <main className="py-6">
          <div className="container-custom">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">
                <span className="text-accent-color">Admin</span> Panel
              </h1>
              <p className="text-text-secondary text-lg">Access the admin panel to manage users and accounts</p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-8 shadow-xl text-center">
                <div className="text-6xl mb-6">🔐</div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Admin Access Required</h2>
                <p className="text-text-secondary mb-8">Please login to access the admin panel or create an admin user if none exists.</p>
                
                <div className="space-y-4">
                  <button
                    onClick={onAdminLogin}
                    className="w-full bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Admin Login
                  </button>
                  
                  <button
                    onClick={handleCreateAdminUser}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Create Admin User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-color/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-accent-color/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Header 
        userEmail={adminEmail || (sessionStorage.getItem('adminUser') ? JSON.parse(sessionStorage.getItem('adminUser')).email : 'admin@forex.com')} 
        onSignOut={onSignOut} 
        onProfileClick={onProfileClick} 
        onBack={onBack} 
        showBackButton={true}
        isAdmin={true}
        onHomeClick={() => window.location.href = '/'}
        pendingRequests={pendingRequests}
        onNotificationClick={handleNotificationClick}
        onReferralLinksClick={onReferralLinksClick}
      />
      
      <main className="py-6">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-text-primary">User</span> <span className="text-accent-color bg-gradient-to-r from-accent-color to-primary-blue bg-clip-text text-transparent">Management</span>
            </h1>
            <p className="text-xl text-text-secondary">Select a user to manage their accounts</p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Search and Filter Section */}
            <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 mb-8 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pl-12 bg-hover-bg border border-border-color rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Filter Dropdown - Hidden on small screens */}
                <div className="relative hidden sm:block">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="appearance-none bg-hover-bg border border-border-color text-text-primary rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="all">All Users</option>
                    <option value="standard">Standard</option>
                    <option value="platinum">Platinum</option>
                    <option value="premium">Premium</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-accent-color/10 to-primary-blue/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-text-primary">{users?.length || 0}</div>
                  <div className="text-text-secondary text-sm">Total Users</div>
                </div>
                <div className="bg-gradient-to-r from-accent-color/10 to-primary-blue/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent-color mb-1">{pendingRequests.deposits.length}</div>
                  <div className="text-text-secondary text-sm">Pending Deposits</div>
                </div>
                <div className="bg-gradient-to-r from-accent-color/10 to-primary-blue/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-blue mb-1">{pendingRequests.withdrawals.length}</div>
                  <div className="text-text-secondary text-sm">Pending Withdrawals</div>
                </div>
                <div className="bg-gradient-to-r from-accent-color/10 to-primary-blue/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-warning-color mb-1">{pendingRequests.deposits.length + pendingRequests.withdrawals.length}</div>
                  <div className="text-text-secondary text-sm">Total Pending</div>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 shadow-xl">
              <h3 className="text-2xl font-bold text-text-primary mb-6">Users List</h3>
              
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">No Users Found</h3>
                  <p className="text-text-secondary mb-6">No users match your current search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.filter(user => user && typeof user === 'object').map((user, index) => {
                    const userId = user?.id || user?._id;
                    const hasPending = hasPendingRequests(userId);
                    const pendingCount = getPendingRequestCount(userId);
                    
                    
                    return (
                    <div 
                      key={user?.id || `user-${index}`}
                      onClick={() => handleUserSelect(user)}
                      className={`bg-hover-bg border rounded-lg p-4 transition-all duration-300 cursor-pointer hover:shadow-lg group relative ${
                        hasPending 
                          ? 'border-accent-color/70 bg-accent-color/5 shadow-lg shadow-accent-color/20' 
                          : 'border-border-color hover:border-accent-color/50'
                      }`}
                    >
                      {/* Notification Dot */}
                      {hasPending && (
                        <div className="absolute -top-2 -right-2 bg-accent-color text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                          {pendingCount}
                        </div>
                      )}
                      
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-text-secondary">User Information</div>
                              <div className="font-semibold text-text-primary group-hover:text-accent-color transition-colors">
                                {user.fullName || 'N/A'}
                              </div>
                              <div className="text-sm text-text-secondary">{user.email || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-text-secondary">Account Details</div>
                              <div className="font-semibold text-text-primary">
                                {user.totalAccounts || 0} Account{(user.totalAccounts || 0) !== 1 ? 's' : ''}
                              </div>
                              <div className="text-sm text-text-secondary">Primary: {user.accountType || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-text-secondary">Status & Balance</div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${(user.status || '') === 'Active' ? 'bg-success-color' : 'bg-warning-color'}`}></span>
                                <span className="font-semibold text-text-primary">{user.status || 'Unknown'}</span>
                              </div>
                              <div className="text-sm font-semibold text-accent-color">₹{formatBalance(user.totalBalance)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col lg:flex-row gap-2">
                          <div className="text-center lg:text-right">
                            <div className="text-sm text-text-secondary">Last Login</div>
                            <div className="text-sm font-medium text-text-primary">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <button className="bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg ml-4">
                            Manage →
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserListPage;