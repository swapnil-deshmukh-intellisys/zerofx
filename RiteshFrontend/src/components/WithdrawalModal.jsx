import React, { useState, useEffect } from 'react';
import { 
  FaUniversity, 
  FaMobile,
  FaWallet,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock
} from 'react-icons/fa';

const WithdrawalModal = ({ isOpen, onClose, accountType, currentBalance, onWithdrawalRequest }) => {
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('');
  const [step, setStep] = useState(1); // 1: Amount, 2: Method & Details, 3: Confirmation
  const [accountDetails, setAccountDetails] = useState({
    bankAccount: '',
    bankName: '',
    ifscCode: '',
    upiId: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState({});

  const withdrawalMethods = [
    { 
      id: 'bank', 
      name: 'Bank Transfer', 
      icon: FaUniversity, 
      color: 'from-blue-500 to-blue-600',
      description: 'Direct bank transfer (1-3 business days)'
    },
    { 
      id: 'upi', 
      name: 'UPI Transfer', 
      icon: FaMobile, 
      color: 'from-green-500 to-green-600',
      description: 'Instant UPI transfer'
    }
  ];

  const minWithdrawal = 100;
  const maxWithdrawal = Math.min((currentBalance || 0) * 0.9, 50000); // 90% of balance or 50k max

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount('');
      setWithdrawalMethod('');
      setAccountDetails({
        bankAccount: '',
        bankName: '',
        ifscCode: '',
        upiId: ''
      });
      setTermsAccepted(false);
      setErrors({});
    }
  }, [isOpen]);

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    const balance = currentBalance || 0;
    
    if (!value || isNaN(numValue)) {
      return 'Please enter a valid amount';
    }
    if (numValue < minWithdrawal) {
      return `Minimum withdrawal amount is ₹${minWithdrawal}`;
    }
    if (numValue > maxWithdrawal) {
      return `Maximum withdrawal amount is ₹${maxWithdrawal.toLocaleString()}`;
    }
    if (numValue > balance) {
      return 'Insufficient balance';
    }
    return null;
  };

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    const error = validateAmount(amount);
    if (error) {
      setErrors({ amount: error });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleMethodSelection = (method) => {
    setWithdrawalMethod(method);
    setErrors({});
  };

  const handleAccountDetailsChange = (field, value) => {
    setAccountDetails(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors({});
  };

  const handleNextStep = () => {
    if (!withdrawalMethod) {
      setErrors({ method: 'Please select a withdrawal method' });
      return;
    }

    if (withdrawalMethod === 'bank') {
      if (!accountDetails.bankAccount || !accountDetails.bankName || !accountDetails.ifscCode) {
        setErrors({ details: 'Please fill all bank details' });
        return;
      }
    } else if (withdrawalMethod === 'upi') {
      if (!accountDetails.upiId) {
        setErrors({ details: 'Please enter UPI ID' });
        return;
      }
    }

    setErrors({});
    setStep(3);
  };

  const handleSubmitWithdrawal = () => {
    if (!termsAccepted) {
      setErrors({ terms: 'Please accept the terms and conditions' });
      return;
    }

    const withdrawalRequest = {
      id: Date.now().toString(),
      accountType,
      amount: parseFloat(amount),
      method: withdrawalMethod,
      accountDetails,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    onWithdrawalRequest(withdrawalRequest);
    onClose();
    setStep(1);
    setAmount('');
    setWithdrawalMethod('');
    setAccountDetails({
      bankAccount: '',
      bankName: '',
      ifscCode: '',
      upiId: ''
    });
    setTermsAccepted(false);
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setAmount('');
    setWithdrawalMethod('');
    setAccountDetails({
      bankAccount: '',
      bankName: '',
      ifscCode: '',
      upiId: ''
    });
    setTermsAccepted(false);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Withdrawal will be in 3-5 min</h2>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Balance Update Note */}
        <div className="bg-warning-color/10 border border-warning-color/20 rounded-lg p-3 mb-6">
          <div className="text-center text-text-secondary text-sm">
            This balance will be updated after withdrawal and deposit request
            <br />
            For 2 minute instant withdrawal please take MT5/ odd-hub amount
          </div>
        </div>

        {/* Step 1: Amount */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Enter Withdrawal Amount</h3>
              
              <div className="bg-accent-color/10 border border-accent-color/20 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">Available Balance:</span>
                  <span className="font-semibold text-accent-color">₹{currentBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-text-secondary">
                  <span>Withdrawal Range:</span>
                  <span>₹{minWithdrawal} - ₹{maxWithdrawal.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleAmountSubmit}>
                <div className="mb-4">
                  <label className="block text-text-secondary text-sm mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                    min={minWithdrawal}
                    max={maxWithdrawal}
                    step="0.01"
                  />
                  {errors.amount && (
                    <p className="text-danger-color text-sm mt-1">{errors.amount}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Continue
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 2: Method & Details */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Select Withdrawal Method</h3>
              
              <div className="space-y-3 mb-6">
                {withdrawalMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelection(method.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                        withdrawalMethod === method.id
                          ? 'border-accent-color bg-accent-color/10'
                          : 'border-border-color hover:border-accent-color/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${method.color} text-white`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-text-primary">{method.name}</div>
                          <div className="text-sm text-text-secondary">{method.description}</div>
                        </div>
                        {withdrawalMethod === method.id && (
                          <FaCheckCircle className="w-5 h-5 text-accent-color" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {errors.method && (
                <p className="text-danger-color text-sm mb-4">{errors.method}</p>
              )}

              {/* Bank Details */}
              {withdrawalMethod === 'bank' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-text-primary">Bank Account Details</h4>
                  
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Account Number</label>
                    <input
                      type="text"
                      value={accountDetails.bankAccount}
                      onChange={(e) => handleAccountDetailsChange('bankAccount', e.target.value)}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={accountDetails.bankName}
                      onChange={(e) => handleAccountDetailsChange('bankName', e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary text-sm mb-2">IFSC Code</label>
                    <input
                      type="text"
                      value={accountDetails.ifscCode}
                      onChange={(e) => handleAccountDetailsChange('ifscCode', e.target.value.toUpperCase())}
                      placeholder="Enter IFSC code"
                      className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* UPI Details */}
              {withdrawalMethod === 'upi' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-text-primary">UPI Details</h4>
                  
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">UPI ID</label>
                    <input
                      type="text"
                      value={accountDetails.upiId}
                      onChange={(e) => handleAccountDetailsChange('upiId', e.target.value)}
                      placeholder="Enter UPI ID (e.g., user@paytm)"
                      className="w-full px-4 py-3 bg-hover-bg border border-border-color rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-color/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {errors.details && (
                <p className="text-danger-color text-sm mt-4">{errors.details}</p>
              )}

              <button
                onClick={handleNextStep}
                className="w-full bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105 mt-6"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Confirm Withdrawal</h3>
              
              <div className="bg-hover-bg rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Amount:</span>
                    <span className="font-semibold text-accent-color">₹{parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Method:</span>
                    <span className="font-semibold text-text-primary">
                      {withdrawalMethod === 'bank' ? 'Bank Transfer' : 'UPI Transfer'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Processing Time:</span>
                    <span className="font-semibold text-text-primary">
                      {withdrawalMethod === 'bank' ? '1-3 business days' : 'Instant'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-warning-color/10 border border-warning-color/20 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <FaExclamationTriangle className="w-5 h-5 text-warning-color mt-0.5" />
                  <div className="text-sm text-text-secondary">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Withdrawal requests are subject to admin approval</li>
                      <li>• Processing time may vary based on bank/UPI provider</li>
                      <li>• Incorrect account details may cause delays</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-text-secondary">
                  I agree to the terms and conditions and confirm that the provided account details are correct.
                </label>
              </div>

              {errors.terms && (
                <p className="text-danger-color text-sm mb-4">{errors.terms}</p>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-transparent border border-border-color text-text-secondary hover:text-text-primary hover:border-text-primary font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitWithdrawal}
                  className="flex-1 bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalModal;
