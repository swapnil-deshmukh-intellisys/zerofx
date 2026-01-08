 import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import { adminAPI, depositAPI, withdrawalAPI, getUploadUrl, getApiBaseUrl } from '../services/api';
import { validateAdminAccess, clearAdminSession } from '../utils/authUtils';

const AdminPanel = ({ selectedUser, onBack, onSignOut, onProfileClick, onUserSelect = null, onReferralLinksClick = null }) => {
  // Consolidated data state
  const [data, setData] = useState({
    selectedAccountType: '',
    accountTypesData: {},
    createdAccounts: [],
    depositRequests: [],
    withdrawalRequests: []
  });
  const [isEditing, setIsEditing] = useState(false);
  // Consolidated image popup state
  const [imagePopup, setImagePopup] = useState({
    isOpen: false,
    selectedImage: null,
    scale: 1,
    position: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 }
  });
  const imagePopupRef = useRef(null);
  const [editData, setEditData] = useState({
    balance: '0.00',
    equity: '0.00',
    margin: '0.00',
    currency: '₹',
    mt5Id: '',
    mt5Password: '',
    mt5Server: ''
  });
  const [showProfileSection, setShowProfileSection] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    withdrawalRequests: 'loading',
    depositRequests: 'loading',
    userAccounts: 'loading'
  });

  // Validate admin access on component mount - TEMPORARILY DISABLED
  // useEffect(() => {
  //   const validateAccess = async () => {
  //     try {
  //       const isValidAdmin = await validateAdminAccess();
  //       if (!isValidAdmin) {
  //         console.log('Invalid admin session, redirecting to login');
  //         clearAdminSession();
  //         // Redirect to admin login or home
  //         if (onBack) {
  //           onBack();
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error validating admin access:', error);
  //       clearAdminSession();
  //       if (onBack) {
  //         onBack();
  //       }
  //     }
  //   };

  //   validateAccess();
  // }, [onBack]);

  // Standardized error handling helper
  const handleApiError = (error, context, fallbackMessage = 'An unexpected error occurred') => {
    console.error(`${context}:`, error);
    const errorMessage = error?.message || error?.response?.data?.message || fallbackMessage;
    
    // Don't show alert for 500 errors to avoid spam, just log them
    if (error?.message?.includes('Server error') || error?.message?.includes('500')) {
      console.warn(`${context}: Server temporarily unavailable. Using fallback data.`);
      return;
    }
    
    // Handle specific business logic errors with user-friendly messages
    if (errorMessage.includes('Insufficient balance')) {
      alert('❌ Cannot approve withdrawal: User has insufficient balance in their account.');
      return;
    }
    
    if (errorMessage.includes('Account not found')) {
      alert('❌ Cannot process withdrawal: User account not found.');
      return;
    }
    
    if (errorMessage.includes('Withdrawal request not found')) {
      alert('❌ Cannot process withdrawal: Withdrawal request not found.');
      return;
    }
    
    // Generic error handling
    alert(`${context}: ${errorMessage}`);
  };

  // Standardized API call wrapper with retry mechanism
  const safeApiCall = async (apiCall, context, fallbackValue = null, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await apiCall();
        return result;
      } catch (error) {
        const isLastAttempt = attempt === retries;
        
        // For server errors (500), try to use cached data as fallback
        if (error?.message?.includes('Server error') || error?.message?.includes('500')) {
          console.warn(`${context}: Attempt ${attempt + 1} failed. ${isLastAttempt ? 'Using fallback data.' : 'Retrying...'}`);
          
          if (isLastAttempt) {
            // Try to load from localStorage as fallback
            const cacheKey = context.toLowerCase().replace(/\s+/g, '').replace(/failedtoload/g, '');
            const cachedData = safeLocalStorageGet(cacheKey, null);
            if (cachedData) {
              console.info(`🔄 ${context}: Using cached data as fallback.`);
              return { success: true, ...cachedData };
            }
            console.warn(`⚠️ ${context}: No cached data available, using fallback value.`);
            return fallbackValue;
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        // For other errors, handle normally
        if (isLastAttempt) {
          handleApiError(error, context);
          return fallbackValue;
        }
      }
    }
    return fallbackValue;
  };

  // Safe localStorage operations with error handling
  const safeLocalStorageGet = (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return fallback;
    }
  };

  const safeLocalStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  };

  // Load initial data from localStorage (offline mode)
  useEffect(() => {
    const loadOfflineData = () => {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        const savedAccounts = safeLocalStorageGet('createdAccounts', []);
        const savedData = safeLocalStorageGet('adminAccountTypesData', {});
        const savedDepositRequests = safeLocalStorageGet('depositRequests', []);
        const savedWithdrawalRequests = safeLocalStorageGet('withdrawalRequests', []);

        setData(prev => ({
          ...prev,
          createdAccounts: savedAccounts,
          accountTypesData: savedData,
          depositRequests: savedDepositRequests,
          withdrawalRequests: savedWithdrawalRequests
        }));
      }
    };

    loadOfflineData();
  }, []);

  // Load account types when no user is selected
  useEffect(() => {
    const loadAccountTypes = async () => {
      if (!selectedUser) {
        const result = await safeApiCall(
          () => adminAPI.getAccountTypes(),
          'Failed to load account types',
          { success: false }
        );
        
        if (result?.success) {
          const accountTypes = result.accountTypes.map(type => ({ type }));
          setData(prev => ({ ...prev, createdAccounts: accountTypes }));
        }
      }
    };

    loadAccountTypes();
  }, [selectedUser]);

  // Update edit data when selected account type changes
  useEffect(() => {
    if (data.createdAccounts.length > 0 && data.selectedAccountType) {
      const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
      if (userAccount) {
        setEditData({
          balance: userAccount.balance?.toString() || '0.00',
          equity: userAccount.equity?.toString() || '0.00',
          margin: userAccount.margin?.toString() || '0.00',
          currency: userAccount.currency || '₹',
          mt5Id: userAccount.mt5Id || '',
          mt5Password: userAccount.mt5Password || '',
          mt5Server: userAccount.mt5Server || ''
        });
      } else {
        setEditData({
          balance: '0.00',
          equity: '0.00',
          margin: '0.00',
          currency: '₹',
          mt5Id: '',
          mt5Password: '',
          mt5Server: ''
        });
      }
    }
  }, [data.selectedAccountType, data.createdAccounts]);

  // No longer need to save global admin data to localStorage

  // Load user's accounts when user is selected
  useEffect(() => {
    const loadUserAccounts = async () => {
      if (selectedUser) {
        const result = await safeApiCall(
          () => adminAPI.getUserById(selectedUser.id),
          'Failed to load user accounts',
          { success: false }
        );
        
        if (result?.success && result.user?.accounts) {
          setData(prev => ({ ...prev, createdAccounts: result.user.accounts }));
          
          // Set first account type as selected if none is selected
          if (result.user.accounts.length > 0 && !data.selectedAccountType) {
            // Prioritize user's primary account if available, otherwise use first account
            if (selectedUser.accountType && result.user.accounts.some(acc => acc.type === selectedUser.accountType)) {
              setData(prev => ({ ...prev, selectedAccountType: selectedUser.accountType }));
            } else {
              setData(prev => ({ ...prev, selectedAccountType: result.user.accounts[0].type }));
            }
          }
        }
      }
    };

    loadUserAccounts();
  }, [selectedUser]);

  // Load deposit requests based on selectedUser
  useEffect(() => {
    const loadDepositRequests = async () => {
      if (!selectedUser) {
        // If no user selected, load all deposit requests for verification
        const result = await safeApiCall(
          () => depositAPI.getDepositRequests(),
          'Failed to load deposit requests',
          { success: false, depositRequests: [] }
        );
        
        if (result?.success) {
          setData(prev => ({ ...prev, depositRequests: result.depositRequests || [] }));
        }
      } else {
        // If user selected, load user-specific deposit requests
        const result = await safeApiCall(
          () => adminAPI.getUserDepositRequests(selectedUser.id),
          'Failed to load user deposit requests',
          { success: false, depositRequests: [] }
        );
        
        if (result?.success) {
          setData(prev => ({ ...prev, depositRequests: result.depositRequests || [] }));
          // Cache successful data for future fallback
          safeLocalStorageSet('userdepositrequests', { depositRequests: result.depositRequests || [] });
        } else {
          // Try to load from cache if API fails
          const cachedData = safeLocalStorageGet('userdepositrequests', null);
          if (cachedData?.depositRequests) {
            console.info('Using cached deposit requests data due to API error.');
            setData(prev => ({ ...prev, depositRequests: cachedData.depositRequests }));
          } else {
            setData(prev => ({ ...prev, depositRequests: [] }));
          }
        }
      }
    };

    loadDepositRequests();
  }, [selectedUser]);

  // Load withdrawal requests based on selectedUser
  useEffect(() => {
    const loadWithdrawalRequests = async () => {
      setApiStatus(prev => ({ ...prev, withdrawalRequests: 'loading' }));
      
      if (!selectedUser) {
        // If no user selected, load all withdrawal requests for verification
        const result = await safeApiCall(
          () => withdrawalAPI.getWithdrawalRequests(),
          'Failed to load withdrawal requests',
          { success: false, withdrawalRequests: [] }
        );
        
        if (result?.success) {
          setData(prev => ({ ...prev, withdrawalRequests: result.withdrawalRequests || [] }));
          setApiStatus(prev => ({ ...prev, withdrawalRequests: 'success' }));
        } else {
          setApiStatus(prev => ({ ...prev, withdrawalRequests: 'error' }));
        }
      } else {
        // If user selected, load their specific withdrawal requests
        const userId = selectedUser.id || selectedUser._id;
        const result = await safeApiCall(
          () => adminAPI.getUserWithdrawalRequests(userId),
          'Failed to load user withdrawal requests',
          { success: false, withdrawalRequests: [] }
        );
        
        if (result?.success) {
          setData(prev => ({ ...prev, withdrawalRequests: result.withdrawalRequests || [] }));
          // Cache successful data for future fallback
          safeLocalStorageSet('userwithdrawalrequests', { withdrawalRequests: result.withdrawalRequests || [] });
          setApiStatus(prev => ({ ...prev, withdrawalRequests: 'success' }));
        } else {
          // Try to load from cache if API fails
          const cachedData = safeLocalStorageGet('userwithdrawalrequests', null);
          if (cachedData?.withdrawalRequests) {
            console.info(`📱 Using cached withdrawal requests data (${cachedData.withdrawalRequests.length} requests) due to API error.`);
            setData(prev => ({ ...prev, withdrawalRequests: cachedData.withdrawalRequests }));
            setApiStatus(prev => ({ ...prev, withdrawalRequests: 'cached' }));
          } else {
            console.warn('⚠️ No cached withdrawal requests data available.');
            setData(prev => ({ ...prev, withdrawalRequests: [] }));
            setApiStatus(prev => ({ ...prev, withdrawalRequests: 'error' }));
          }
        }
      }
    };

    loadWithdrawalRequests();
  }, [selectedUser]);

  const handleEdit = () => {
    setIsEditing(true);
    const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
    setEditData({
      balance: userAccount?.balance?.toString() || '0.00',
      equity: userAccount?.equity?.toString() || '0.00',
      margin: userAccount?.margin?.toString() || '0.00',
      currency: userAccount?.currency || '₹',
      mt5Id: userAccount?.mt5Id || '',
      mt5Password: userAccount?.mt5Password || '',
      mt5Server: userAccount?.mt5Server || ''
    });
  };

  const handleSave = async () => {
    try {
      // Validate input - only check numeric fields
      const numericFields = ['balance', 'equity', 'margin'];
      const isValid = numericFields.every(field => {
        const value = editData[field];
        return value && !isNaN(parseFloat(value)) && parseFloat(value) >= 0;
      });

      if (!isValid) {
        alert('Please enter valid positive numbers for all fields');
        return;
      }

      // Find the user's account to update
      const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
      if (!userAccount) {
        alert('Account not found for the selected user');
        return;
      }

      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Update localStorage for offline mode - update the user's account data
        const savedAccounts = safeLocalStorageGet('createdAccounts', []);
        if (savedAccounts.length > 0) {
          const updatedAccounts = savedAccounts.map(acc => {
            if (acc.id === userAccount.id || acc._id === userAccount._id) {
              return {
                ...acc,
                balance: parseFloat(editData.balance),
                currency: editData.currency,
                equity: parseFloat(editData.equity),
                margin: parseFloat(editData.margin),
                mt5Id: editData.mt5Id,
                mt5Password: editData.mt5Password,
                mt5Server: editData.mt5Server
              };
            }
            return acc;
          });
          safeLocalStorageSet('createdAccounts', updatedAccounts);
        }

        setIsEditing(false);
        alert('User account updated successfully! (Offline mode)');
        return;
      }

      // Update individual user's account via API
      const updateData = {
        balance: parseFloat(editData.balance),
        currency: editData.currency,
        equity: parseFloat(editData.equity),
        margin: parseFloat(editData.margin),
        mt5Id: editData.mt5Id,
        mt5Password: editData.mt5Password,
        mt5Server: editData.mt5Server
      };

      // Call account update API
      const response = await fetch(`${getApiBaseUrl()}/accounts/${userAccount._id || userAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setIsEditing(false);
        alert('User account updated successfully!');
        // Reload user data to reflect changes
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update account');
      }
    } catch (error) {
      handleApiError(error, 'Failed to update account details');
    }
  };

  const handleCancel = () => {
    const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
    setEditData({
      balance: userAccount?.balance?.toString() || '0.00',
      equity: userAccount?.equity?.toString() || '0.00',
      margin: userAccount?.margin?.toString() || '0.00',
      currency: userAccount?.currency || '₹',
      mt5Id: userAccount?.mt5Id || '',
      mt5Password: userAccount?.mt5Password || '',
      mt5Server: userAccount?.mt5Server || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get unique account types from created accounts
  const getUniqueAccountTypes = () => {
    return [...new Set(data.createdAccounts.map(account => account.type))];
  };

  // Handle image popup
  const handleImageClick = (imageSrc, fileName) => {
    setImagePopup({
      isOpen: true,
      selectedImage: { src: imageSrc, name: fileName },
      scale: 1,
      position: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 }
    });
  };

  const closeImagePopup = () => {
    setImagePopup({
      isOpen: false,
      selectedImage: null,
      scale: 1,
      position: { x: 0, y: 0 },
      isDragging: false,
      dragStart: { x: 0, y: 0 }
    });
  };

  // Zoom functionality
  const handleZoomIn = () => {
    setImagePopup(prev => ({ ...prev, scale: Math.min(prev.scale + 0.5, 5) }));
  };

  const handleZoomOut = () => {
    setImagePopup(prev => ({ ...prev, scale: Math.max(prev.scale - 0.5, 0.5) }));
  };

  const resetZoom = () => {
    setImagePopup(prev => ({ ...prev, scale: 1, position: { x: 0, y: 0 } }));
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setImagePopup(prev => ({ ...prev, scale: Math.max(0.5, Math.min(5, prev.scale + delta)) }));
  };

  // Add wheel event listener with passive: false
  useEffect(() => {
    const popupElement = imagePopupRef.current;
    if (popupElement && imagePopup.isOpen) {
      const wheelHandler = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        setImagePopup(prev => ({ ...prev, scale: Math.max(0.5, Math.min(5, prev.scale + delta)) }));
      };

      popupElement.addEventListener('wheel', wheelHandler, { passive: false });
      
      return () => {
        popupElement.removeEventListener('wheel', wheelHandler);
      };
    }
  }, [imagePopup.isOpen]);

  // Drag functionality
  const handleMouseDown = (e) => {
    setImagePopup(prev => ({
      ...prev,
      isDragging: true,
      dragStart: {
        x: e.clientX - prev.position.x,
        y: e.clientY - prev.position.y
      }
    }));
  };

  const handleMouseMove = (e) => {
    if (imagePopup.isDragging) {
      setImagePopup(prev => ({
        ...prev,
        position: {
          x: e.clientX - prev.dragStart.x,
          y: e.clientY - prev.dragStart.y
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setImagePopup(prev => ({ ...prev, isDragging: false }));
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setImagePopup(prev => ({
        ...prev,
        isDragging: true,
        dragStart: {
          x: e.touches[0].clientX - prev.position.x,
          y: e.touches[0].clientY - prev.position.y
        }
      }));
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && imagePopup.isDragging) {
      setImagePopup(prev => ({
        ...prev,
        position: {
          x: e.touches[0].clientX - prev.dragStart.x,
          y: e.touches[0].clientY - prev.dragStart.y
        }
      }));
    }
  };

  const handleTouchEnd = () => {
    setImagePopup(prev => ({ ...prev, isDragging: false }));
  };

  // Handle payment verification
  const handlePaymentVerification = async (requestId, action, verifiedAmount = null, rejectionReason = null) => {
    // Check if requestId is valid
    if (!requestId) {
      alert('Invalid request ID. Please try again.');
      return;
    }

      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Handle payment verification locally for offline mode
        const updatedRequests = data.depositRequests.map(request => {
          if (request._id === requestId || request.id === requestId) {
            if (action === 'approve' && verifiedAmount) {
              // Update account balance
              const currentData = data.accountTypesData[request.accountType] || {
                balance: '0.00',
                equity: '0.00',
                margin: '0.00',
                currency: '₹'
              };
              
              const newBalance = (parseFloat(currentData.balance) + parseFloat(verifiedAmount)).toFixed(2);
              
              setData(prev => ({
                ...prev,
                accountTypesData: {
                  ...prev.accountTypesData,
                  [request.accountType]: {
                    ...currentData,
                    balance: newBalance
                  }
                }
              }));

              // Update localStorage
              const currentAdminData = safeLocalStorageGet('adminAccountTypesData', {});
              currentAdminData[request.accountType] = {
                ...currentData,
                balance: newBalance
              };
              safeLocalStorageSet('adminAccountTypesData', currentAdminData);

              // Trigger custom event to notify other components of balance update
              window.dispatchEvent(new CustomEvent('balanceUpdated', {
                detail: {
                  accountType: request.accountType,
                  newBalance: newBalance,
                  addedAmount: verifiedAmount
                }
              }));
            }
            
            return {
              ...request,
              status: action === 'approve' ? 'approved' : 'rejected',
              verifiedAmount: action === 'approve' ? verifiedAmount : null,
              rejectionReason: action === 'reject' ? (rejectionReason || 'Deposit rejected by admin') : null,
              verifiedAt: new Date().toISOString()
            };
          }
          return request;
        });

        setData(prev => ({ ...prev, depositRequests: updatedRequests }));
        
        // Update localStorage
        safeLocalStorageSet('depositRequests', updatedRequests);
        
        alert(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully! (Offline mode)`);
        return;
      }

      // Call API to verify deposit request
      const result = await safeApiCall(
        () => depositAPI.verifyDepositRequest(requestId, action, { 
          verifiedAmount: verifiedAmount || null,
          rejectionReason: action === 'reject' ? (rejectionReason || 'Deposit rejected by admin') : null
        }),
        'Failed to verify deposit request',
        { success: false }
      );

      if (!result?.success) {
        return;
      }

      // Update local state
      const updatedRequests = data.depositRequests.map(request => {
        if (request._id === requestId || request.id === requestId) {
          if (action === 'approve' && verifiedAmount) {
            // Update account balance
            const currentData = data.accountTypesData[request.accountType] || {
              balance: '0.00',
              equity: '0.00',
              margin: '0.00',
              currency: '₹'
            };
            
            const newBalance = (parseFloat(currentData.balance) + parseFloat(verifiedAmount)).toFixed(2);
            
            setData(prev => ({
              ...prev,
              accountTypesData: {
                ...prev.accountTypesData,
                [request.accountType]: {
                  ...currentData,
                  balance: newBalance
                }
              }
            }));

            // Trigger custom event to notify other components of balance update
            window.dispatchEvent(new CustomEvent('balanceUpdated', {
              detail: {
                accountType: request.accountType,
                newBalance: newBalance,
                addedAmount: verifiedAmount
              }
            }));
          }
          
          return {
            ...request,
            status: action === 'approve' ? 'approved' : 'rejected',
            verifiedAmount: action === 'approve' ? verifiedAmount : null,
            rejectionReason: action === 'reject' ? (rejectionReason || 'Deposit rejected by admin') : null,
            verifiedAt: new Date().toISOString()
          };
        }
        return request;
      });
      
      setData(prev => ({ ...prev, depositRequests: updatedRequests }));

      // Show success message for approved payments
      if (action === 'approve' && verifiedAmount) {
        const request = data.depositRequests.find(r => r._id === requestId || r.id === requestId);
        alert(`Payment approved! ₹${verifiedAmount} has been added to ${request?.accountType || 'the'} account balance.`);
      } else if (action === 'reject') {
        const request = data.depositRequests.find(r => r._id === requestId || r.id === requestId);
        alert(`Payment rejected for ${request?.accountType || 'the'} account.`);
      }
  };

  // Handle withdrawal verification
  const handleWithdrawalVerification = async (requestId, action, verifiedAmount = null, rejectionReason = null) => {
    // Check if requestId is valid
    if (!requestId) {
      alert('Invalid request ID. Please try again.');
      return;
    }

      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Handle withdrawal verification locally for offline mode
        const updatedRequests = data.withdrawalRequests.map(request => {
          if (request._id === requestId || request.id === requestId) {
            if (action === 'approve' && verifiedAmount) {
              // Update account balance (subtract for withdrawal)
              const currentData = data.accountTypesData[request.accountType] || {
                balance: '0.00',
                equity: '0.00',
                margin: '0.00',
                currency: '₹'
              };
              
              const newBalance = Math.max(0, parseFloat(currentData.balance) - parseFloat(verifiedAmount)).toFixed(2);
              
              setData(prev => ({
                ...prev,
                accountTypesData: {
                  ...prev.accountTypesData,
                  [request.accountType]: {
                    ...currentData,
                    balance: newBalance
                  }
                }
              }));

              // Update localStorage
              const currentAdminData = safeLocalStorageGet('adminAccountTypesData', {});
              currentAdminData[request.accountType] = {
                ...currentData,
                balance: newBalance
              };
              safeLocalStorageSet('adminAccountTypesData', currentAdminData);

              // Trigger custom event to notify other components of balance update
              window.dispatchEvent(new CustomEvent('balanceUpdated', {
                detail: {
                  accountType: request.accountType,
                  newBalance: newBalance,
                  deductedAmount: verifiedAmount
                }
              }));
            }
            
            return {
              ...request,
              status: action === 'approve' ? 'approved' : 'rejected',
              verifiedAmount: action === 'approve' ? verifiedAmount : null,
              rejectionReason: action === 'reject' ? (rejectionReason || 'Withdrawal rejected by admin') : null,
              verifiedAt: new Date().toISOString()
            };
          }
          return request;
        });

        setData(prev => ({ ...prev, withdrawalRequests: updatedRequests }));
        
        // Update localStorage
        safeLocalStorageSet('withdrawalRequests', updatedRequests);
        
        alert(`Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully! (Offline mode)`);
        return;
      }

      // Call API to verify withdrawal request
      const result = await safeApiCall(
        () => withdrawalAPI.verifyWithdrawalRequest(requestId, action, { 
          verifiedAmount: verifiedAmount || null,
          rejectionReason: action === 'reject' ? (rejectionReason || 'Withdrawal rejected by admin') : null
        }),
        `Failed to ${action} withdrawal request`,
        { success: false }
      );

      if (!result?.success) {
        return;
      }

      // Update local state
      const updatedRequests = data.withdrawalRequests.map(request => {
        if (request._id === requestId || request.id === requestId) {
          if (action === 'approve' && verifiedAmount) {
            // Update account balance (subtract for withdrawal)
            const currentData = data.accountTypesData[request.accountType] || {
              balance: '0.00',
              equity: '0.00',
              margin: '0.00',
              currency: '₹'
            };
            
            const newBalance = Math.max(0, parseFloat(currentData.balance) - parseFloat(verifiedAmount)).toFixed(2);
            
            setData(prev => ({
              ...prev,
              accountTypesData: {
                ...prev.accountTypesData,
                [request.accountType]: {
                  ...currentData,
                  balance: newBalance
                }
              }
            }));

            // Trigger custom event to notify other components of balance update
            window.dispatchEvent(new CustomEvent('balanceUpdated', {
              detail: {
                accountType: request.accountType,
                newBalance: newBalance,
                deductedAmount: verifiedAmount
              }
            }));
          }
          
          return {
            ...request,
            status: action === 'approve' ? 'approved' : 'rejected',
            verifiedAmount: action === 'approve' ? verifiedAmount : null,
            rejectionReason: action === 'reject' ? (rejectionReason || 'Withdrawal rejected by admin') : null,
            verifiedAt: new Date().toISOString()
          };
        }
        return request;
      });
      
        setData(prev => ({ ...prev, withdrawalRequests: updatedRequests }));

      // Show success message
      if (action === 'approve' && verifiedAmount) {
        const request = data.withdrawalRequests.find(r => r._id === requestId || r.id === requestId);
        alert(`Withdrawal approved! ₹${verifiedAmount} has been deducted from ${request?.accountType || 'the'} account balance.`);
      } else if (action === 'reject') {
        const request = data.withdrawalRequests.find(r => r._id === requestId || r.id === requestId);
        alert(`Withdrawal rejected for ${request?.accountType || 'the'} account.`);
      }
  };

  // Handle notification click - navigate to user management or handle request
  const handleNotificationClick = (request, requestType) => {
    // If we have a selectedUser and the request belongs to them, we can handle it directly
    if (selectedUser) {
      const userId = requestType === 'deposit' ? request.user || request.user?._id : request.userId || request.userId?._id;
      if (userId === selectedUser.id || userId === selectedUser._id) {
        // Request belongs to current user, we can handle it directly
        console.log('Request belongs to current user, handling directly...');
        // You could scroll to the specific request or highlight it
        return;
      }
    }

    // If request belongs to a different user, navigate to that user
    if (onUserSelect) {
      // We need to find the user for this request
      // This would require loading user data or having access to user list
      console.log('Request belongs to different user, navigating...');
      // For now, we'll show an alert and suggest going back to user list
      alert('This request belongs to a different user. Please go back to the user list and select the correct user.');
    } else {
      alert('Please go back to the user list to manage this request.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <Header 
        userEmail={'admin@forex.com'} 
        onSignOut={onSignOut} 
        onProfileClick={onProfileClick} 
        onBack={onBack} 
        showBackButton={true} 
        isAdmin={true}
        verificationStatus={'verified'}
        onHomeClick={() => window.location.href = '/'}
        pendingRequests={{
          deposits: data.depositRequests.filter(req => req.status === 'pending'),
          withdrawals: data.withdrawalRequests.filter(req => req.status === 'pending')
        }}
        onNotificationClick={handleNotificationClick}
        onReferralLinksClick={onReferralLinksClick}
      />
      
      <main className="py-6">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-text-primary">Admin</span> <span className="text-accent-color bg-gradient-to-r from-accent-color to-primary-blue bg-clip-text text-transparent">Panel</span>
            </h1>
            <p className="text-xl text-text-secondary">Manage account financial details</p>
            {selectedUser && (
              <div className="mt-4 p-4 bg-gradient-to-r from-accent-color/10 to-primary-blue/10 rounded-xl border border-border-color">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-text-primary">Managing: {selectedUser.fullName}</div>
                    <div className="text-sm text-text-secondary">{selectedUser.email}</div>
                    <div className="text-sm text-accent-color">Primary Account: {selectedUser.accountType}</div>
                  </div>
                  <button
                    onClick={onBack}
                    className="bg-gradient-to-r from-accent-color/20 to-primary-blue/20 hover:from-accent-color/30 hover:to-primary-blue/30 text-text-primary font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 border border-border-color flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to User List</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto">
            {getUniqueAccountTypes().length > 0 ? (
              <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -top-6 right-6 w-24 h-24 bg-accent-color/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">
                      {selectedUser ? `${selectedUser.fullName}'s Account Details` : 'Account Financial Details'}
                    </h2>
                    <div className="mt-2">
                      <label className="text-text-secondary text-sm">Select Account Type:</label>
                      {getUniqueAccountTypes().length > 0 ? (
                        <div className="relative ml-2 inline-block">
                          <select
                            value={data.selectedAccountType}
                            onChange={(e) => setData(prev => ({ ...prev, selectedAccountType: e.target.value }))}
                            className="appearance-none bg-card-bg backdrop-blur-sm border border-border-color text-text-primary rounded-lg px-4 py-2 pr-12 focus:outline-none focus:border-accent-color focus:ring-2 focus:ring-accent-color/20 transition-all duration-300 hover:border-accent-color/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px] w-auto"
                            style={{ width: `${Math.max(data.selectedAccountType?.length * 10 + 80, 150)}px` }}
                            disabled={isEditing}
                          >
                            {getUniqueAccountTypes().map(accountType => (
                              <option key={accountType} value={accountType} className="bg-card-bg text-text-primary">
                                {accountType}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <span className="ml-2 text-text-secondary text-sm">No accounts created yet</span>
                      )}
                    </div>
                    
                    {/* Toggle Switch for Profile Section */}
                    {selectedUser && (
                      <div className="mt-4 flex items-center gap-3">
                        <label className="text-text-secondary text-sm font-medium">Show Profile Details:</label>
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="profileToggle"
                            checked={showProfileSection}
                            onChange={(e) => setShowProfileSection(e.target.checked)}
                            className="sr-only"
                          />
                          <label
                            htmlFor="profileToggle"
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-color focus:ring-offset-2 ${
                              showProfileSection ? 'bg-accent-color' : 'bg-gray-400'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                showProfileSection ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </label>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {showProfileSection ? 'Profile visible' : 'Profile hidden'}
                        </span>
                      </div>
                    )}
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      disabled={!data.selectedAccountType}
                      className={`font-semibold py-2 px-4 rounded-lg transition-all duration-300 ${
                        data.selectedAccountType 
                          ? 'bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary hover:scale-105 shadow-lg' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      Edit Details
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-success-color to-green-600 hover:from-green-600 hover:to-success-color text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-transparent border border-border-color text-text-secondary hover:text-text-primary hover:border-text-primary font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Balance Section */}
                <div className="text-center mb-8">
                  <div className="text-text-secondary uppercase tracking-widest text-xs mb-2">Balance</div>
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.balance}
                        onChange={(e) => handleInputChange('balance', e.target.value)}
                        className="text-5xl sm:text-6xl font-extrabold text-text-primary bg-transparent border-b-2 border-accent-color text-center w-64 focus:outline-none focus:border-primary-blue"
                      />
                      <div className="relative">
                        <select
                          value={editData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          className="appearance-none text-2xl font-bold text-accent-color bg-transparent border border-border-color rounded px-2 py-1 pr-8 focus:outline-none focus:border-primary-blue"
                        >
                          <option value="₹">₹</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="JPY">JPY</option>
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                          <svg className="w-3 h-3 text-accent-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-5xl sm:text-6xl font-extrabold text-text-primary">
                      {(() => {
                        const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
                        return (userAccount?.currency || '₹') + (userAccount?.balance || '0.00');
                      })()}
                    </div>
                  )}
                </div>

                {/* Equity and Margin Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-10 mb-8">
                  <div className="text-center">
                    <div className="text-text-secondary mb-2">Equity</div>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.equity}
                        onChange={(e) => handleInputChange('equity', e.target.value)}
                        className="text-lg font-semibold text-text-primary bg-transparent border-b border-accent-color text-center w-32 focus:outline-none focus:border-primary-blue"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-text-primary">₹{data.accountTypesData[data.selectedAccountType]?.equity || '0.00'}</div>
                    )}
                  </div>
                  
                  <div className="hidden sm:block h-4 w-px bg-border-color" />
                  
                  <div className="text-center">
                    <div className="text-text-secondary mb-2">Margin</div>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.margin}
                        onChange={(e) => handleInputChange('margin', e.target.value)}
                        className="text-lg font-semibold text-text-primary bg-transparent border-b border-accent-color text-center w-32 focus:outline-none focus:border-primary-blue"
                      />
                    ) : (
                      <div className="text-lg font-semibold text-text-primary">₹{data.accountTypesData[data.selectedAccountType]?.margin || '0.00'}</div>
                    )}
                  </div>
                </div>

                {/* MT5 Trading Platform Details */}
                <div className="bg-hover-bg border border-border-color rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">MT5 Trading Platform</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* MT5 ID */}
                    <div className="text-center">
                      <div className="text-text-secondary text-sm mb-2">MT5 ID</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.mt5Id}
                          onChange={(e) => handleInputChange('mt5Id', e.target.value)}
                          className="text-sm font-semibold text-text-primary bg-transparent border-b border-accent-color text-center w-full focus:outline-none focus:border-primary-blue"
                          placeholder="Enter MT5 ID"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-text-primary break-all">
                          {(() => {
                            const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
                            return userAccount?.mt5Id || 'Not assigned';
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* MT5 Password */}
                    <div className="text-center">
                      <div className="text-text-secondary text-sm mb-2">Password</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.mt5Password}
                          onChange={(e) => handleInputChange('mt5Password', e.target.value)}
                          className="text-sm font-semibold text-text-primary bg-transparent border-b border-accent-color text-center w-full focus:outline-none focus:border-primary-blue"
                          placeholder="Enter MT5 Password"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-text-primary break-all">
                          {(() => {
                            const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
                            return userAccount?.mt5Password || 'Not assigned';
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* MT5 Server */}
                    <div className="text-center">
                      <div className="text-text-secondary text-sm mb-2">Server</div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.mt5Server}
                          onChange={(e) => handleInputChange('mt5Server', e.target.value)}
                          className="text-sm font-semibold text-text-primary bg-transparent border-b border-accent-color text-center w-full focus:outline-none focus:border-primary-blue"
                          placeholder="Enter MT5 Server"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-text-primary break-all">
                          {(() => {
                            const userAccount = data.createdAccounts.find(acc => acc.type === data.selectedAccountType);
                            return userAccount?.mt5Server || 'Not assigned';
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center text-text-secondary text-xs mt-3">
                    {isEditing ? 'Update MT5 credentials for this account' : 'MT5 credentials are managed by admin'}
                  </div>
                </div>

                {/* Info Section */}
                <div className="text-center text-text-secondary mb-6">
                  <div className="text-sm">
                    {selectedUser 
                      ? `Changes made here will be reflected in ${selectedUser.fullName}'s Account Details page`
                      : 'Changes made here will be reflected in the Account Details page'
                    }
                  </div>
                </div>

              </div>

              {/* User Profile Section */}
              {showProfileSection && selectedUser && (
                <div className="mt-8">
                  <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-6 right-6 w-24 h-24 bg-primary-blue/10 rounded-full blur-xl"></div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
                        <svg className="w-6 h-6 text-accent-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {selectedUser.fullName}'s Profile
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Profile Information */}
                        <div className="space-y-6">
                          <div className="bg-hover-bg border border-border-color rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-accent-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Personal Information
                            </h4>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Full Name:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.fullName}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Email:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-all">{selectedUser.email}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Phone:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.phone || 'Not provided'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Account Type:</span>
                                <span className="font-semibold text-accent-color text-sm sm:text-base break-words">{selectedUser.accountType}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Registration Date:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">
                                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Account Status */}
                          <div className="bg-hover-bg border border-border-color rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Account Status
                            </h4>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Status:</span>
                                <span className="px-3 py-1 bg-success-color/20 text-success-color rounded-full text-sm font-semibold w-fit">
                                  Active
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Verification:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                                  (() => {
                                    const hasAllDocuments = selectedUser.idDocument && selectedUser.addressProof && selectedUser.aadharBack;
                                    return hasAllDocuments 
                                      ? 'bg-success-color/20 text-success-color' 
                                      : 'bg-warning-color/20 text-warning-color';
                                  })()
                                }`}>
                                  {(() => {
                                    const hasAllDocuments = selectedUser.idDocument && selectedUser.addressProof && selectedUser.aadharBack;
                                    return hasAllDocuments ? 'Verified' : 'Pending';
                                  })()}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Last Login:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">
                                  {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Profile Images and Documents */}
                        <div className="space-y-6">
                          {/* Profile Picture */}
                          <div className="bg-hover-bg border border-border-color rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Profile Picture
                            </h4>
                            <div className="flex justify-center">
                              {selectedUser.profilePicture ? (
                                <div className="relative">
                                  <img 
                                    src={getUploadUrl(selectedUser.profilePicture)}
                                    alt="Profile Picture"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-accent-color shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300"
                                    onClick={() => handleImageClick(
                                      getUploadUrl(selectedUser.profilePicture),
                                      'Profile Picture'
                                    )}
                                  />
                                  <div className="absolute -bottom-2 -right-2 bg-accent-color text-white rounded-full p-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-border-color">
                                  <svg className="w-16 h-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-center text-text-secondary text-sm mt-2">
                              {selectedUser.profilePicture ? 'Click to view full size' : 'No profile picture uploaded'}
                            </p>
                          </div>

                          {/* Identity Documents */}
                          <div className="bg-hover-bg border border-border-color rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-warning-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Identity Documents
                            </h4>
                            <div className="space-y-4">
                              {/* ID Document */}
                              <div>
                                <label className="text-text-secondary text-sm">ID Document:</label>
                                {selectedUser.idDocument ? (
                                  <div className="mt-2">
                                    <img 
                                      src={getUploadUrl(selectedUser.idDocument)}
                                      alt="ID Document"
                                      className="max-w-full h-32 object-contain border border-border-color rounded cursor-pointer hover:border-accent-color transition-colors"
                                      onClick={() => handleImageClick(
                                        getUploadUrl(selectedUser.idDocument),
                                        'ID Document'
                                      )}
                                    />
                                    <p className="text-xs text-text-secondary mt-1">Click to view full size</p>
                                  </div>
                                ) : (
                                  <p className="text-text-secondary text-sm mt-2">No ID document uploaded</p>
                                )}
                              </div>

                              {/* Address Proof */}
                              <div>
                                <label className="text-text-secondary text-sm">Address Proof:</label>
                                {selectedUser.addressProof ? (
                                  <div className="mt-2">
                                    <img 
                                      src={getUploadUrl(selectedUser.addressProof)}
                                      alt="Address Proof"
                                      className="max-w-full h-32 object-contain border border-border-color rounded cursor-pointer hover:border-accent-color transition-colors"
                                      onClick={() => handleImageClick(
                                        getUploadUrl(selectedUser.addressProof),
                                        'Address Proof'
                                      )}
                                    />
                                    <p className="text-xs text-text-secondary mt-1">Click to view full size</p>
                                  </div>
                                ) : (
                                  <p className="text-text-secondary text-sm mt-2">No address proof uploaded</p>
                                )}
                              </div>

                              {/* Aadhar Back */}
                              <div>
                                <label className="text-text-secondary text-sm">Aadhar Back:</label>
                                {selectedUser.aadharBack ? (
                                  <div className="mt-2">
                                    <img 
                                      src={getUploadUrl(selectedUser.aadharBack)}
                                      alt="Aadhar Back"
                                      className="max-w-full h-32 object-contain border border-border-color rounded cursor-pointer hover:border-accent-color transition-colors"
                                      onClick={() => handleImageClick(
                                        getUploadUrl(selectedUser.aadharBack),
                                        'Aadhar Back'
                                      )}
                                    />
                                    <p className="text-xs text-text-secondary mt-1">Click to view full size</p>
                                  </div>
                                ) : (
                                  <p className="text-text-secondary text-sm mt-2">No Aadhar back uploaded</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Verification Status - Based on Documents */}
                            <div className="mt-6 pt-4 border-t border-border-color">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  (() => {
                                    const hasAllDocuments = selectedUser.idDocument && selectedUser.addressProof && selectedUser.aadharBack;
                                    return hasAllDocuments ? 'bg-success-color' : 'bg-warning-color';
                                  })()
                                }`}></div>
                                <span className="text-text-secondary text-sm sm:text-base">
                                  Status: {
                                    (() => {
                                      const hasAllDocuments = selectedUser.idDocument && selectedUser.addressProof && selectedUser.aadharBack;
                                      return hasAllDocuments ? 'Verified' : 'Pending Verification';
                                    })()
                                  }
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-text-secondary">
                                {(() => {
                                  const documents = [];
                                  if (selectedUser.idDocument) documents.push('PAN');
                                  if (selectedUser.addressProof) documents.push('Aadhar Front');
                                  if (selectedUser.aadharBack) documents.push('Aadhar Back');
                                  
                                  if (documents.length === 3) {
                                    return '✅ All verification documents uploaded';
                                  } else if (documents.length > 0) {
                                    return `📄 Documents uploaded: ${documents.join(', ')}`;
                                  } else {
                                    return '📋 No verification documents uploaded';
                                  }
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Additional Information */}
                          <div className="bg-hover-bg border border-border-color rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-info-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Additional Information
                            </h4>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Country:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.country || 'Not specified'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">State:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.state || 'Not specified'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">City:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.city || 'Not specified'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Postal Code:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.postalCode || 'Not provided'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Date of Birth:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">
                                  {selectedUser.dateOfBirth ? 
                                    (typeof selectedUser.dateOfBirth === 'string' ? 
                                      new Date(selectedUser.dateOfBirth).toLocaleDateString() : 
                                      selectedUser.dateOfBirth.toLocaleDateString()
                                    ) : 'Not provided'
                                  }
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Gender:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base capitalize break-words">{selectedUser.gender || 'Not specified'}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                <span className="text-text-secondary text-sm sm:text-base">Father's Name:</span>
                                <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.fatherName || 'Not provided'}</span>
                              </div>
                              {selectedUser.streetAddress && (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                                  <span className="text-text-secondary text-sm sm:text-base">Address:</span>
                                  <span className="font-semibold text-text-primary text-sm sm:text-base break-words text-left sm:text-right">{selectedUser.streetAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bank Information */}
                          {(selectedUser.bankAccount || selectedUser.bankName || selectedUser.accountName) && (
                            <div className="bg-hover-bg border border-border-color rounded-xl p-6">
                              <h4 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Bank Information
                              </h4>
                              <div className="space-y-3">
                                {selectedUser.accountName && (
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                    <span className="text-text-secondary text-sm sm:text-base">Account Name:</span>
                                    <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.accountName}</span>
                                  </div>
                                )}
                                {selectedUser.bankAccount && (
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                    <span className="text-text-secondary text-sm sm:text-base">Account Number:</span>
                                    <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.bankAccount}</span>
                                  </div>
                                )}
                                {selectedUser.bankName && (
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                    <span className="text-text-secondary text-sm sm:text-base">Bank Name:</span>
                                    <span className="font-semibold text-text-primary text-sm sm:text-base break-words">{selectedUser.bankName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            {/* Payment Verification Section */}
            {(data.depositRequests.filter(request => request.status === 'pending').length > 0 || 
              data.withdrawalRequests.filter(request => request.status === 'pending').length > 0) && (
              <div className="mt-8">
                <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 shadow-xl">
                  <h3 className="text-2xl font-bold text-text-primary mb-6">
                    {selectedUser ? `${selectedUser.fullName}'s Payment Verification` : 'Payment Verification'}
                    <span className="text-sm font-normal text-text-secondary ml-2">
                      ({data.depositRequests.filter(r => r.status === 'pending').length} deposits, {data.withdrawalRequests.filter(r => r.status === 'pending').length} withdrawals)
                    </span>
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Deposit Requests */}
                    {data.depositRequests
                      .filter(request => request.status === 'pending')
                      .map(request => (
                        <div key={request._id || request.id} className="bg-hover-bg border border-border-color rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              DEPOSIT
                            </div>
                          </div>
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div>
                                  <span className="text-text-secondary text-sm">Account Type:</span>
                                  <div className="font-semibold text-text-primary">{request.accountType}</div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Requested Amount:</span>
                                  <div className="font-semibold text-accent-color">₹{request.amount}</div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Date:</span>
                                  <div className="font-semibold text-text-primary">
                                    {(() => {
                                      try {
                                        const date = new Date(request.submittedAt || request.createdAt);
                                        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                                      } catch (error) {
                                        return 'Invalid Date';
                                      }
                                    })()}
                                  </div>
                                </div>
                                {request.upiApp && (
                                  <div>
                                    <span className="text-text-secondary text-sm">UPI App:</span>
                                    <div className="font-semibold text-text-primary capitalize">
                                      {request.upiApp}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {request.paymentProof && (
                                <div className="mb-3">
                                  <span className="text-text-secondary text-sm">Payment Proof:</span>
                                  <div className="mt-1">
                                    <img 
                                      src={getUploadUrl(request.paymentProof)} 
                                      alt="Payment Proof" 
                                      className="max-w-xs max-h-32 object-contain border border-border-color rounded cursor-pointer hover:border-accent-color transition-colors"
                                      onClick={() => handleImageClick(
                                        getUploadUrl(request.paymentProof), 
                                        request.proofName || 'Payment Proof'
                                      )}
                                    />
                                    {request.proofName && (
                                      <div className="text-xs text-text-secondary mt-1">
                                        File: {request.proofName} (Click to view full size)
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {/* Manual Approval Section */}
                              <div className="bg-hover-bg/50 border border-border-color rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-warning-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <span className="text-sm font-medium text-text-secondary">Manual Approval</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter approval amount"
                                    defaultValue={request.amount}
                                    className="bg-transparent border border-border-color text-text-primary rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-color flex-1 min-w-0"
                                    id={`amount-${request._id || request.id}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const requestId = request._id || request.id;
                                      const amountInput = document.getElementById(`amount-${requestId}`);
                                      const verifiedAmount = amountInput.value;
                                      if (verifiedAmount && parseFloat(verifiedAmount) > 0) {
                                        if (window.confirm(`Are you sure you want to approve this deposit request?\n\nAmount: ₹${verifiedAmount}`)) {
                                          handlePaymentVerification(requestId, 'approve', verifiedAmount);
                                        }
                                      } else {
                                        alert('Please enter a valid amount');
                                      }
                                    }}
                                    className="bg-gradient-to-r from-success-color to-green-600 hover:from-green-600 hover:to-success-color text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-sm whitespace-nowrap"
                                  >
                                    Approve
                                  </button>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to approve this deposit request?\n\nAmount: ₹${request.amount}`)) {
                                      handlePaymentVerification(request._id || request.id, 'approve', request.amount);
                                    }
                                  }}
                                  className="bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-sm flex-1 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <span className="hidden sm:inline">Quick Approve (₹{request.amount})</span>
                                  <span className="sm:hidden">Approve ₹{request.amount}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason (required):');
                                    if (reason && reason.trim()) {
                                      if (window.confirm(`Are you sure you want to reject this deposit request?\n\nReason: ${reason}`)) {
                                        handlePaymentVerification(request._id || request.id, 'reject', null, reason);
                                      }
                                    } else if (reason !== null) {
                                      alert('Rejection reason is required');
                                    }
                                  }}
                                  className="bg-gradient-to-r from-danger-color to-red-600 hover:from-red-600 hover:to-danger-color text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-sm whitespace-nowrap"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {/* Withdrawal Requests */}
                    {data.withdrawalRequests
                      .filter(request => request.status === 'pending')
                      .map(request => (
                        <div key={request._id || request.id} className="bg-hover-bg border border-border-color rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                              WITHDRAWAL
                            </div>
                          </div>
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-text-secondary text-sm">Amount:</span>
                                  <div className="font-bold text-accent-color text-lg">₹{request.amount}</div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Method:</span>
                                  <div className="font-semibold text-text-primary capitalize">
                                    {request.method === 'bank' ? 'Bank Transfer' : 'UPI Transfer'}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Account Type:</span>
                                  <div className="font-semibold text-text-primary">{request.accountType}</div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Request Date:</span>
                                  <div className="font-semibold text-text-primary">
                                    {new Date(request.createdAt || request.timestamp).toLocaleDateString()}
                                  </div>
                                </div>
                                {request.method === 'bank' && request.accountDetails && (
                                  <>
                                    <div>
                                      <span className="text-text-secondary text-sm">Account Number:</span>
                                      <div className="font-semibold text-text-primary">{request.accountDetails.bankAccount}</div>
                                    </div>
                                    <div>
                                      <span className="text-text-secondary text-sm">Bank Name:</span>
                                      <div className="font-semibold text-text-primary">{request.accountDetails.bankName}</div>
                                    </div>
                                    <div>
                                      <span className="text-text-secondary text-sm">IFSC Code:</span>
                                      <div className="font-semibold text-text-primary">{request.accountDetails.ifscCode}</div>
                                    </div>
                                  </>
                                )}
                                {request.method === 'upi' && request.accountDetails && (
                                  <div>
                                    <span className="text-text-secondary text-sm">UPI ID:</span>
                                    <div className="font-semibold text-text-primary">{request.accountDetails.upiId}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Manual Approval Section */}
                              <div className="bg-hover-bg/50 border border-border-color rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-warning-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <span className="text-sm font-medium text-text-secondary">Manual Approval</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Enter approval amount"
                                    defaultValue={request.amount}
                                    className="bg-transparent border border-border-color text-text-primary rounded px-3 py-2 text-sm focus:outline-none focus:border-accent-color flex-1 min-w-0"
                                    id={`withdrawal-amount-${request._id || request.id}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const requestId = request._id || request.id;
                                      const amountInput = document.getElementById(`withdrawal-amount-${requestId}`);
                                      const verifiedAmount = amountInput.value;
                                      if (verifiedAmount && parseFloat(verifiedAmount) > 0) {
                                        // Get current user balance for the account type
                                        const accountType = request.accountType;
                                        const userAccount = data.createdAccounts.find(acc => acc.type === accountType);
                                        const currentBalance = userAccount?.balance?.toString() || '0.00';
                                        const balanceAmount = parseFloat(currentBalance);
                                        const withdrawalAmount = parseFloat(verifiedAmount);
                                        
                                        let confirmMessage = `Are you sure you want to approve this withdrawal request?\n\nAmount: ₹${verifiedAmount}\nAccount Type: ${accountType}\nCurrent Balance: ₹${currentBalance}`;
                                        
                                        if (withdrawalAmount > balanceAmount) {
                                          confirmMessage += `\n\n⚠️ WARNING: Withdrawal amount (₹${verifiedAmount}) exceeds current balance (₹${currentBalance}). This will likely fail due to insufficient funds.`;
                                        }
                                        
                                        if (window.confirm(confirmMessage)) {
                                          handleWithdrawalVerification(requestId, 'approve', verifiedAmount);
                                        }
                                      } else {
                                        alert('Please enter a valid amount');
                                      }
                                    }}
                                    className="bg-gradient-to-r from-success-color to-green-600 hover:from-green-600 hover:to-success-color text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-sm whitespace-nowrap"
                                  >
                                    Approve
                                  </button>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => {
                                    // Get current user balance for the account type
                                    const accountType = request.accountType;
                                    const userAccount = data.createdAccounts.find(acc => acc.type === accountType);
                                    const currentBalance = userAccount?.balance?.toString() || '0.00';
                                    const balanceAmount = parseFloat(currentBalance);
                                    const withdrawalAmount = parseFloat(request.amount);
                                    
                                    let confirmMessage = `Are you sure you want to approve this withdrawal request?\n\nAmount: ₹${request.amount}\nAccount Type: ${accountType}\nCurrent Balance: ₹${currentBalance}`;
                                    
                                    if (withdrawalAmount > balanceAmount) {
                                      confirmMessage += `\n\n⚠️ WARNING: Withdrawal amount (₹${request.amount}) exceeds current balance (₹${currentBalance}). This will likely fail due to insufficient funds.`;
                                    }
                                    
                                    if (window.confirm(confirmMessage)) {
                                      handleWithdrawalVerification(request._id || request.id, 'approve', request.amount);
                                    }
                                  }}
                                  className="bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-sm flex-1 flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  <span className="hidden sm:inline">Quick Approve (₹{request.amount})</span>
                                  <span className="sm:hidden">Approve ₹{request.amount}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason (required):');
                                    if (reason && reason.trim()) {
                                      if (window.confirm(`Are you sure you want to reject this withdrawal request?\n\nReason: ${reason}`)) {
                                        handleWithdrawalVerification(request._id || request.id, 'reject', null, reason);
                                      }
                                    } else if (reason !== null) {
                                      alert('Rejection reason is required');
                                    }
                                  }}
                                  className="bg-gradient-to-r from-danger-color to-red-600 hover:from-red-600 hover:to-danger-color text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg text-sm whitespace-nowrap"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {(data.depositRequests.filter(request => request.status === 'pending').length === 0 && 
                      data.withdrawalRequests.filter(request => request.status === 'pending').length === 0) && (
                      <div className="text-center text-text-secondary py-8">
                        <div className="text-4xl mb-2">✅</div>
                        <p>No pending payment verifications for {selectedUser ? selectedUser.fullName : 'any user'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment History - Combined Deposits and Withdrawals */}
            {(data.depositRequests.filter(request => request.status !== 'pending').length > 0 || 
              data.withdrawalRequests.filter(request => request.status !== 'pending').length > 0) && (
              <div className="mt-8">
                <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 shadow-xl">
                  <h3 className="text-2xl font-bold text-text-primary mb-6">
                    {selectedUser ? `${selectedUser.fullName}'s Payment History` : 'Payment History'}
                    <span className="text-sm font-normal text-text-secondary ml-2">
                      (Deposits & Withdrawals)
                    </span>
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Combined deposits and withdrawals, sorted by date */}
                    {[
                      // Add deposits with type indicator
                      ...data.depositRequests
                        .filter(request => request.status !== 'pending')
                        .map(request => ({ ...request, transactionType: 'deposit' })),
                      // Add withdrawals with type indicator
                      ...data.withdrawalRequests
                        .filter(request => request.status !== 'pending')
                        .map(request => ({ ...request, transactionType: 'withdrawal' }))
                    ]
                      .sort((a, b) => {
                        try {
                          const dateA = new Date(a.submittedAt || a.createdAt || a.verifiedAt);
                          const dateB = new Date(b.submittedAt || b.createdAt || b.verifiedAt);
                          return isNaN(dateB.getTime()) ? -1 : (isNaN(dateA.getTime()) ? 1 : dateB - dateA);
                        } catch (error) {
                          return 0;
                        }
                      })
                      .map(request => (
                        <div key={request._id || request.id} className="bg-hover-bg border border-border-color rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                  request.transactionType === 'deposit' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {request.transactionType === 'deposit' ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                      DEPOSIT
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                      WITHDRAWAL
                                    </>
                                  )}
                                </div>
                                <span className="text-text-secondary text-sm">
                                  {new Date(request.submittedAt || request.createdAt || request.verifiedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-text-secondary text-sm">Account:</span>
                                  <div className="font-semibold text-text-primary">{request.accountType}</div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Amount:</span>
                                  <div className={`font-semibold ${
                                    request.transactionType === 'deposit' ? 'text-success-color' : 'text-accent-color'
                                  }`}>
                                    {request.transactionType === 'deposit' ? '+' : '-'}₹{request.amount}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Method:</span>
                                  <div className="font-semibold text-text-primary capitalize">
                                    {request.method === 'bank' ? 'Bank Transfer' : 
                                     request.method === 'upi' ? 'UPI Transfer' : 
                                     request.upiApp || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-secondary text-sm">Status:</span>
                                  <div className={`font-semibold ${
                                    request.status === 'approved' ? 'text-success-color' : 'text-danger-color'
                                  }`}>
                                    {request.status.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              {request.verifiedAmount && request.verifiedAmount !== request.amount && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <span className="text-text-secondary text-sm">Verified Amount: </span>
                                  <span className="font-semibold text-yellow-800">₹{request.verifiedAmount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              )}


            </div>
            ) : (
              <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-8 shadow-xl text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">No Accounts Created Yet</h3>
                <p className="text-text-secondary mb-6">
                  Create accounts first in the Accounts section to manage their financial details here.
                </p>
                <button
                  onClick={onBack}
                  className="bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Go to Accounts
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full-Screen Image Popup Modal */}
      {imagePopup.isOpen && imagePopup.selectedImage && (
        <div 
          ref={imagePopupRef}
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-white">Payment Proof</h3>
                {imagePopup.selectedImage.name && (
                  <span className="text-gray-300 text-sm">{imagePopup.selectedImage.name}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-black bg-opacity-50 rounded-lg p-2">
                  <button
                    onClick={handleZoomOut}
                    className="text-white hover:text-accent-color transition-colors p-2 rounded"
                    title="Zoom Out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <span className="text-white text-sm px-2">
                    {Math.round(imagePopup.scale * 100)}%
                  </span>
                  
                  <button
                    onClick={handleZoomIn}
                    className="text-white hover:text-accent-color transition-colors p-2 rounded"
                    title="Zoom In"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={resetZoom}
                    className="text-white hover:text-accent-color transition-colors p-2 rounded"
                    title="Reset Zoom"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                <button
                  onClick={closeImagePopup}
                  className="text-white hover:text-red-400 transition-colors p-2 rounded"
                  title="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center overflow-hidden relative">
            <div
              className="relative"
              style={{
                transform: `translate(${imagePopup.position.x}px, ${imagePopup.position.y}px) scale(${imagePopup.scale})`,
                transition: imagePopup.isDragging ? 'none' : 'transform 0.1s ease-out',
                cursor: imagePopup.isDragging ? 'grabbing' : 'grab'
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <img 
                src={imagePopup.selectedImage.src} 
                alt={imagePopup.selectedImage.name}
                className="max-w-none max-h-none select-none"
                style={{
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  objectFit: 'contain'
                }}
                draggable={false}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="text-center text-gray-300 text-sm">
              <div className="flex justify-center items-center gap-6">
                <span>🖱️ Scroll to zoom</span>
                <span>🖱️ Drag to pan</span>
                <span>📱 Pinch to zoom (mobile)</span>
                <span>👆 Drag to pan (mobile)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;