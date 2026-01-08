import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import DepositModal from '../components/DepositModal';
import WithdrawalModal from '../components/WithdrawalModal';
import { accountAPI, depositAPI, withdrawalAPI } from '../services/api';

const AccountDetailsPage = ({ account, onBack, onSignOut, onProfileClick }) => {
  const [adminData, setAdminData] = useState({
    balance: '0.00',
    equity: '0.00',
    margin: '0.00',
    currency: '₹',
    mt5Id: '',
    mt5Password: '',
    mt5Server: ''
  });
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [depositRequests, setDepositRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  // Load deposit requests
  const loadDepositRequests = async () => {
    try {
      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Load from localStorage for offline mode
        const savedRequests = JSON.parse(localStorage.getItem('depositRequests') || '[]');
        // Filter requests for current account type
        const accountRequests = savedRequests.filter(request => 
          request.accountType === account.type
        );
        setDepositRequests(accountRequests);
        return;
      }

      // Load from API
      const response = await depositAPI.getCurrentUserDepositRequests();
      if (response.success) {
        // Filter requests for current account type
        const accountRequests = response.depositRequests.filter(request => 
          request.accountType === account.type
        );
        setDepositRequests(accountRequests);
      }
    } catch (error) {
      console.error('Error loading deposit requests:', error);
      // Fallback to localStorage
      const savedRequests = JSON.parse(localStorage.getItem('depositRequests') || '[]');
      const accountRequests = savedRequests.filter(request => 
        request.accountType === account.type
      );
      setDepositRequests(accountRequests);
    }
  };

  // Load withdrawal requests
  const loadWithdrawalRequests = async () => {
    try {
      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Load from localStorage for offline mode
        const savedRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
        // Filter requests for current account type
        const accountRequests = savedRequests.filter(request => 
          request.accountType === account.type
        );
        setWithdrawalRequests(accountRequests);
        return;
      }

      // Load from API
      const response = await withdrawalAPI.getCurrentUserWithdrawalRequests();
      if (response.success) {
        // Filter requests for current account type
        const accountRequests = response.withdrawalRequests.filter(request => 
          request.accountType === account.type
        );
        setWithdrawalRequests(accountRequests);
      }
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      // Fallback to localStorage
      const savedRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
      const accountRequests = savedRequests.filter(request => 
        request.accountType === account.type
      );
      setWithdrawalRequests(accountRequests);
    }
  };

  // Load account data from API
  useEffect(() => {
    const loadAccountData = async () => {
      if (!account?._id && !account?.id) return;
      
      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // For offline mode, use the account's own data
        if (account) {
          setAdminData({
            balance: account.balance || 0,
            currency: account.currency || '₹',
            equity: account.equity || 0,
            margin: account.margin || 0,
            mt5Id: account.mt5Id || '',
            mt5Password: account.mt5Password || '',
            mt5Server: account.mt5Server || ''
          });
        }
        return;
      }
      
      try {
        const response = await accountAPI.getAccountById(account._id || account.id);
        if (response.success) {
          setAdminData({
            balance: response.account.balance,
            currency: response.account.currency,
            equity: response.account.equity,
            margin: response.account.margin,
            mt5Id: response.account.mt5Id || '',
            mt5Password: response.account.mt5Password || '',
            mt5Server: response.account.mt5Server || ''
          });
        }
      } catch (error) {
        console.error('Error loading account data:', error);
        // Fallback to account's own data
        if (account) {
          setAdminData({
            balance: account.balance || 0,
            currency: account.currency || '₹',
            equity: account.equity || 0,
            margin: account.margin || 0,
            mt5Id: account.mt5Id || '',
            mt5Password: account.mt5Password || '',
            mt5Server: account.mt5Server || ''
          });
        }
      }
    };

    loadAccountData();
    loadDepositRequests();
    loadWithdrawalRequests();

    // Listen for balance updates
    const handleBalanceUpdate = (event) => {
      if (event.detail.accountType === account?.type) {
        loadAccountData();
      }
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, [account]);

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
          accountId: account._id || account.id,
          accountType: account.type,
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
        // Refresh deposit requests
        loadDepositRequests();
        return;
      }

      // Create request object with file
      const requestData = {
        accountId: account._id || account.id,
        accountType: account.type,
        amount: depositRequest.amount,
        upiApp: depositRequest.upiApp,
        paymentProof: depositRequest.proof // Send file directly
      };

      // Submit to API
      await depositAPI.submitDepositRequest(requestData);
      
      // Show success message
      alert('Deposit request submitted successfully! Admin will verify and process your payment.');
      // Refresh deposit requests
      loadDepositRequests();
    } catch (error) {
      console.error('Error submitting deposit request:', error);
      alert(`Error submitting deposit request: ${error.message}`);
    }
  };

  const handleWithdrawalRequest = async (withdrawalRequest) => {
    try {
      // Check if user is in offline mode
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (user.offline) {
        // Handle withdrawal request locally for offline mode
        const withdrawalRequests = JSON.parse(localStorage.getItem('withdrawalRequests') || '[]');
        const newRequest = {
          id: Date.now().toString(),
          accountId: account._id || account.id,
          accountType: account.type,
          amount: withdrawalRequest.amount,
          method: withdrawalRequest.method,
          accountDetails: withdrawalRequest.accountDetails,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        withdrawalRequests.push(newRequest);
        localStorage.setItem('withdrawalRequests', JSON.stringify(withdrawalRequests));
        
        alert('Withdrawal request submitted successfully! (Offline mode)');
        // Refresh withdrawal requests
        loadWithdrawalRequests();
        return;
      }

      // Create request object
      const requestData = {
        accountId: account._id || account.id,
        accountType: account.type,
        amount: withdrawalRequest.amount,
        method: withdrawalRequest.method,
        accountDetails: withdrawalRequest.accountDetails
      };

      console.log('🔍 Withdrawal request data:', requestData);

      // Submit to API
      await withdrawalAPI.submitWithdrawalRequest(requestData);
      
      alert('Withdrawal request submitted successfully!');
      // Refresh withdrawal requests
      loadWithdrawalRequests();
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      alert(`Error submitting withdrawal request: ${error.message}`);
    }
  };
  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Header userEmail={''} onSignOut={onSignOut} onProfileClick={onProfileClick} onBack={onBack} showBackButton={true} isAdmin={false} onHomeClick={() => window.location.href = '/'} onAccountsClick={onBack} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-text-secondary mb-4">No account selected.</div>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Back to Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <Header userEmail={''} onSignOut={onSignOut} onProfileClick={onProfileClick} onBack={onBack} showBackButton={true} isAdmin={false} onHomeClick={() => window.location.href = '/'} onAccountsClick={onBack} />

      <main className="py-6">
        <div className="container-custom">
          <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute -top-6 right-6 w-24 h-24 bg-accent-color/10 rounded-full blur-xl"></div>
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="text-text-secondary uppercase tracking-widest text-xs mb-2">Balance</div>
                <div className="text-5xl sm:text-6xl font-extrabold text-text-primary">{adminData.currency}{adminData.balance}</div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-10 mb-6">
                <div className="text-text-secondary">Equity: <span className="font-semibold text-text-primary">₹{adminData.equity}</span></div>
                <div className="hidden sm:block h-4 w-px bg-border-color" />
                <div className="text-text-secondary">Margin: <span className="font-semibold text-text-primary">₹{adminData.margin}</span></div>
              </div>

              {/* MT5 Trading Platform Details */}
              <div className="bg-hover-bg border border-border-color rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">MT5 Trading Platform</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-text-secondary text-sm mb-1">MT5 ID</div>
                    <div className="font-semibold text-text-primary break-all">
                      {adminData.mt5Id || 'Not assigned'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-text-secondary text-sm mb-1">Password</div>
                    <div className="font-semibold text-text-primary break-all">
                      {adminData.mt5Password || 'Not assigned'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-text-secondary text-sm mb-1">Server</div>
                    <div className="font-semibold text-text-primary break-all">
                      {adminData.mt5Server || 'Not assigned'}
                    </div>
                  </div>
                </div>
                <div className="text-center text-text-secondary text-xs mt-3">
                  Contact admin to update your MT5 credentials
                </div>
              </div>

              <div className="text-center text-text-secondary mb-6">
                ACCOUNT: <span className="font-semibold text-text-primary">{account.id}</span> | <span className="font-semibold text-text-primary">{account.type}</span> | LEVERAGE: <span className="font-semibold text-text-primary">1 : 500</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6">
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Deposit
                </button>
                <button 
                  onClick={() => setShowWithdrawalModal(true)}
                  className="bg-transparent border border-danger-color text-danger-color hover:bg-danger-color hover:text-text-quaternary font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Withdraw
                </button>
                <button className="bg-transparent border border-border-color text-text-secondary hover:text-text-primary hover:border-text-primary font-semibold py-3 px-6 rounded-xl transition-all duration-300">Change Password</button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex space-x-2 border-b border-border-color mb-4">
              <button className="px-4 py-2 rounded-t-lg bg-hover-bg text-text-primary font-semibold">Payment History</button>
              <button className="px-4 py-2 rounded-t-lg text-text-secondary hover:text-text-primary">Trading History</button>
            </div>
            
            {/* Payment History Content */}
            {(depositRequests.length > 0 || withdrawalRequests.length > 0) ? (
              <div className="bg-card-bg border border-border-color rounded-xl p-6">
                <div className="space-y-4">
                  {/* Deposit Requests */}
                  {depositRequests
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt || a.submittedAt);
                      const dateB = new Date(b.createdAt || b.submittedAt);
                      return dateB - dateA;
                    })
                    .map((request, index) => (
                      <div key={`deposit-${request._id || request.id || index}`} className="bg-hover-bg rounded-lg p-4 border border-border-color">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-accent-color rounded-full"></div>
                          <span className="text-sm font-semibold text-accent-color">DEPOSIT</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <span className="text-text-secondary text-sm">Amount:</span>
                                <div className="font-bold text-accent-color text-lg">₹{request.amount}</div>
                              </div>
                              <div>
                                <span className="text-text-secondary text-sm">Status:</span>
                                <div className={`font-semibold ${
                                  request.status === 'approved' ? 'text-success-color' : 
                                  request.status === 'rejected' ? 'text-danger-color' : 
                                  'text-warning-color'
                                }`}>
                                  {request.status?.toUpperCase() || 'PENDING'}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-secondary text-sm">Date:</span>
                                <div className="font-semibold text-text-primary">
                                  {new Date(request.createdAt || request.submittedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-secondary text-sm">UPI App:</span>
                                <div className="font-semibold text-text-primary capitalize">
                                  {request.upiApp || 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            {request.verifiedAmount && (
                              <div className="mt-3 pt-3 border-t border-border-color">
                                <div className="flex justify-between items-center">
                                  <span className="text-text-secondary text-sm">Verified Amount:</span>
                                  <span className="font-bold text-success-color">₹{request.verifiedAmount}</span>
                                </div>
                              </div>
                            )}
                            
                            {request.rejectionReason && (
                              <div className="mt-3 pt-3 border-t border-border-color">
                                <div className="text-text-secondary text-sm mb-1">Rejection Reason:</div>
                                <div className="text-danger-color text-sm">{request.rejectionReason}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* Withdrawal Requests */}
                  {withdrawalRequests
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt || a.submittedAt);
                      const dateB = new Date(b.createdAt || b.submittedAt);
                      return dateB - dateA;
                    })
                    .map((request, index) => (
                      <div key={`withdrawal-${request._id || request.id || index}`} className="bg-hover-bg rounded-lg p-4 border border-border-color">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-danger-color rounded-full"></div>
                          <span className="text-sm font-semibold text-danger-color">WITHDRAWAL</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <span className="text-text-secondary text-sm">Amount:</span>
                                <div className="font-bold text-danger-color text-lg">₹{request.amount}</div>
                              </div>
                              <div>
                                <span className="text-text-secondary text-sm">Status:</span>
                                <div className={`font-semibold ${
                                  request.status === 'approved' ? 'text-success-color' : 
                                  request.status === 'rejected' ? 'text-danger-color' : 
                                  'text-warning-color'
                                }`}>
                                  {request.status?.toUpperCase() || 'PENDING'}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-secondary text-sm">Date:</span>
                                <div className="font-semibold text-text-primary">
                                  {new Date(request.createdAt || request.submittedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <span className="text-text-secondary text-sm">Method:</span>
                                <div className="font-semibold text-text-primary capitalize">
                                  {request.method === 'upi' ? 'UPI Transfer' : 'Bank Transfer'}
                                </div>
                              </div>
                            </div>
                            
                            {request.verifiedAmount && (
                              <div className="mt-3 pt-3 border-t border-border-color">
                                <div className="flex justify-between items-center">
                                  <span className="text-text-secondary text-sm">Verified Amount:</span>
                                  <span className="font-bold text-success-color">₹{request.verifiedAmount}</span>
                                </div>
                              </div>
                            )}
                            
                            {request.rejectionReason && (
                              <div className="mt-3 pt-3 border-t border-border-color">
                                <div className="text-text-secondary text-sm mb-1">Rejection Reason:</div>
                                <div className="text-danger-color text-sm">{request.rejectionReason}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-card-bg border border-border-color rounded-xl p-6 text-center">
                <div className="text-text-secondary mb-3">No payment records found</div>
                <div className="text-text-secondary text-sm">Your deposit and withdrawal requests will appear here once submitted.</div>
              </div>
            )}
          </div>

          
        </div>
      </main>

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        accountType={account?.type}
        onDepositRequest={handleDepositRequest}
      />

      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        accountType={account?.type}
        currentBalance={adminData.balance || 0}
        onWithdrawalRequest={handleWithdrawalRequest}
      />
    </div>
  );
};

export default AccountDetailsPage;


