// API Base URL
const API_BASE_URL = 'https://shraddha-backend.onrender.com/api';

// Base URL for file uploads
const UPLOADS_BASE_URL = 'https://shraddha-backend.onrender.com/uploads';

// Helper function to get auth token
const getAuthToken = () => {
  return sessionStorage.getItem('token');
};

// Helper function to get admin auth token
const getAdminAuthToken = () => {
  return sessionStorage.getItem('adminToken');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Helper function to make admin API requests
const adminApiRequest = async (endpoint, options = {}) => {
  const token = getAdminAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Admin API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('Admin API Error:', error);
    throw error;
  }
};

// =============== AUTH API ===============
export const authAPI = {
  // Sign up
  signup: async (userData) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Admin Login
  adminLogin: async (email, password) => {
    return apiRequest('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get profile
  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  // Create admin user
  createAdminUser: async () => {
    return apiRequest('/auth/create-admin', {
      method: 'POST',
    });
  },

  // Send email verification OTP for signup
  sendEmailVerificationOTP: async (email) => {
    return apiRequest('/auth/send-email-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify OTP
  verifyOTP: async (email, otp, type = 'password_reset') => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, type }),
    });
  },

  // Reset password
  resetPassword: async (resetToken, newPassword) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },
};

// =============== ACCOUNT API ===============
export const accountAPI = {
  // Create account
  createAccount: async (accountData) => {
    return apiRequest('/accounts/create', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  // Get user accounts
  getUserAccounts: async () => {
    return apiRequest('/accounts');
  },

  // Get account by ID
  getAccountById: async (accountId) => {
    return apiRequest(`/accounts/${accountId}`);
  },

  // Delete account
  deleteAccount: async (accountId) => {
    return apiRequest(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },
};

// =============== DEPOSIT API ===============
export const depositAPI = {
  // Submit deposit request
  submitDepositRequest: async (depositData) => {
    const token = getAuthToken();
    
    const formData = new FormData();
    formData.append('accountId', depositData.accountId);
    formData.append('amount', depositData.amount);
    formData.append('upiApp', depositData.upiApp);
    formData.append('paymentProof', depositData.paymentProof);
    
    const response = await fetch(`${API_BASE_URL}/deposits/submit`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Deposit request failed');
    }
    
    return data;
  },

  // Get current user deposit requests
  getCurrentUserDepositRequests: async () => {
    return apiRequest('/deposits/user');
  },

  // Get all deposit requests (admin)
  getDepositRequests: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    return adminApiRequest(`/deposits/admin${query}`);
  },

  // Verify deposit request (admin)
  verifyDepositRequest: async (requestId, action, data = {}) => {
    return adminApiRequest(`/deposits/admin/${requestId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ action, ...data }),
    });
  },
};

// =============== ADMIN API ===============
export const adminAPI = {
  // Get admin data
  getAdminData: async () => {
    return adminApiRequest('/admin/data');
  },

  // Update admin data
  updateAdminData: async (adminData) => {
    return adminApiRequest('/admin/data', {
      method: 'PUT',
      body: JSON.stringify(adminData),
    });
  },

  // Get account types
  getAccountTypes: async () => {
    return adminApiRequest('/admin/account-types');
  },

  // Get deposit statistics
  getDepositStatistics: async () => {
    return adminApiRequest('/admin/statistics');
  },

  // Get all users
  getAllUsers: async () => {
    return adminApiRequest('/admin/users');
  },

  // Get user by ID
  getUserById: async (userId) => {
    return adminApiRequest(`/admin/users/${userId}`);
  },

  // Get user deposit requests
  getUserDepositRequests: async (userId) => {
    return adminApiRequest(`/admin/users/${userId}/deposits`);
  },

  // Get user withdrawal requests
  getUserWithdrawalRequests: async (userId) => {
    return adminApiRequest(`/admin/users/${userId}/withdrawals`);
  },

  // Get all deposit requests (admin)
  getAllDepositRequests: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    return adminApiRequest(`/admin/deposits${query}`);
  },

  // Get all withdrawal requests (admin)
  getAllWithdrawalRequests: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    return adminApiRequest(`/admin/withdrawals${query}`);
  },
};

// =============== WITHDRAWAL API ===============
export const withdrawalAPI = {
  // Submit withdrawal request
  submitWithdrawalRequest: async (withdrawalData) => {
    return apiRequest('/withdrawals/submit', {
      method: 'POST',
      body: JSON.stringify(withdrawalData),
    });
  },

  // Get current user withdrawal requests
  getCurrentUserWithdrawalRequests: async () => {
    return apiRequest('/withdrawals/user');
  },

  // Get all withdrawal requests (admin)
  getWithdrawalRequests: async (status = null) => {
    const query = status ? `?status=${status}` : '';
    const adminToken = getAdminAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/withdrawals/admin${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { Authorization: `Bearer ${adminToken}` })
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Withdrawal API Error:', error);
      throw error;
    }
  },

  // Verify withdrawal request (admin)
  verifyWithdrawalRequest: async (requestId, action, data = {}) => {
    return adminApiRequest(`/withdrawals/admin/${requestId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ action, ...data }),
    });
  },
};

// =============== PROFILE API ===============
export const profileAPI = {
  // Save profile with documents
  saveProfile: async (profileData) => {
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(profileData).forEach(key => {
      if (key !== 'panDocument' && key !== 'aadharFront' && key !== 'aadharBack' && key !== 'profilePicture') {
        formData.append(key, profileData[key]);
      }
    });

    // Add files (handle null values for removal)
    if (profileData.panDocument !== undefined) {
      formData.append('panDocument', profileData.panDocument || 'null');
    }
    if (profileData.aadharFront !== undefined) {
      formData.append('aadharFront', profileData.aadharFront || 'null');
    }
    if (profileData.aadharBack !== undefined) {
      formData.append('aadharBack', profileData.aadharBack || 'null');
    }
    if (profileData.profilePicture !== undefined) {
      formData.append('profilePicture', profileData.profilePicture || 'null');
    }

    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/profile/save`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Profile save failed');
    }
    
    return data;
  },
};

// =============== REFERRAL API ===============
export const referralAPI = {
  // Create referral link
  createReferralLink: async (customId) => {
    return adminApiRequest('/referrals', {
      method: 'POST',
      body: JSON.stringify({ customId }),
    });
  },

  // Get all referral links
  getAllReferralLinks: async () => {
    return adminApiRequest('/referrals');
  },

  // Get referral link by ID (with user details)
  getReferralLinkById: async (id) => {
    return adminApiRequest(`/referrals/${id}`);
  },

  // Update referral link
  updateReferralLink: async (id, customId) => {
    return adminApiRequest(`/referrals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ customId }),
    });
  },

  // Delete referral link
  deleteReferralLink: async (id) => {
    return adminApiRequest(`/referrals/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle referral link status
  toggleReferralLinkStatus: async (id) => {
    return adminApiRequest(`/referrals/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  // Track visitor (public)
  trackVisitor: async (customId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/referrals/track-visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customId }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to track visitor');
      }
      
      return data;
    } catch (error) {
      console.error('Track Visitor Error:', error);
      throw error;
    }
  },

  // Validate referral code (public)
  validateReferralCode: async (customId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/referrals/validate/${customId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid referral code');
      }
      
      return data;
    } catch (error) {
      console.error('Validate Referral Code Error:', error);
      throw error;
    }
  },
};

// Helper function to get upload URL
export const getUploadUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('data:')) return filename;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  return `${UPLOADS_BASE_URL}/${filename}`;
};

// Helper function to get API base URL
export const getApiBaseUrl = () => API_BASE_URL;

export default {
  authAPI,
  accountAPI,
  depositAPI,
  withdrawalAPI,
  adminAPI,
  profileAPI,
  referralAPI,
  getUploadUrl,
  getApiBaseUrl,
};
