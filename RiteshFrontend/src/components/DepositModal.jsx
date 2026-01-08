import React, { useState } from 'react';
import QRCode from '../assets/QR2.jpg';
import PhonepeLogo from '../assets/Phonepe.png';
import GpayLogo from '../assets/Gpay.png';
import PytmLogo from '../assets/Pytm.png';
import BpayLogo from '../assets/bpay.png';

const DepositModal = ({ isOpen, onClose, accountType, onDepositRequest }) => {
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [selectedUPI, setSelectedUPI] = useState('');
  const [step, setStep] = useState(1); // 1: Amount, 2: UPI Selection, 3: QR Code, 4: Upload Proof

  const upiApps = [
    { 
      id: 'phonepe', 
      name: 'PhonePe', 
      logo: PhonepeLogo, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500'
    },
    { 
      id: 'gpay', 
      name: 'Google Pay', 
      logo: GpayLogo, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500'
    },
    { 
      id: 'paytm', 
      name: 'Paytm', 
      logo: PytmLogo, 
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-600'
    },
    { 
      id: 'bharatpe', 
      name: 'BharatPe', 
      logo: BpayLogo, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500'
    }
  ];

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      setStep(2);
    }
  };

  const handleUPISelection = (upiId) => {
    setSelectedUPI(upiId);
    setStep(3);
  };

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const handleSubmitDeposit = () => {
    if (paymentProof) {
      const depositRequest = {
        id: Date.now().toString(),
        accountType,
        amount: parseFloat(amount),
        upiApp: selectedUPI,
        status: 'pending',
        timestamp: new Date().toISOString(),
        proof: paymentProof
      };
      onDepositRequest(depositRequest);
      onClose();
      setStep(1);
      setAmount('');
      setPaymentProof(null);
      setSelectedUPI('');
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setAmount('');
    setPaymentProof(null);
    setSelectedUPI('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Deposit Funds</h2>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 1 && (
          <div>
            <div className="mb-4">
              <p className="text-text-secondary mb-2">Account Type: <span className="font-semibold text-text-primary">{accountType}</span></p>
            </div>
            <form onSubmit={handleAmountSubmit}>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm mb-2">Enter Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent border border-border-color text-text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-accent-color focus:ring-2 focus:ring-accent-color/20 transition-all duration-300"
                  placeholder="Enter amount to deposit"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Continue to Payment
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-text-primary mb-2">Select UPI App</h3>
              <p className="text-text-secondary">Choose your preferred UPI app for payment</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {upiApps.map((app) => {
                return (
                  <button
                    key={app.id}
                    onClick={() => handleUPISelection(app.id)}
                    className={`bg-gradient-to-r ${app.color} hover:scale-105 text-white font-semibold py-4 px-4 rounded-lg transition-all duration-300 shadow-lg flex flex-col items-center gap-2 hover:shadow-xl`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img 
                        src={app.logo} 
                        alt={app.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-sm font-medium">{app.name}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-transparent border border-border-color text-text-secondary hover:text-text-primary hover:border-text-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300"
            >
              Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-text-primary mb-2">Scan QR Code to Pay</h3>
              <p className="text-text-secondary mb-2">Amount: <span className="font-semibold text-accent-color">₹{amount}</span></p>
              <p className="text-text-secondary text-sm">Using: <span className="font-semibold text-text-primary">{upiApps.find(app => app.id === selectedUPI)?.name}</span></p>
            </div>
            
            <div className="text-center mb-3">
              <p className="text-text-secondary text-xs">For amount over 2000 please use another device to scan the QR code from</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg mb-6 flex justify-center">
              <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center border-2 border-gray-200">
                <img 
                  src={QRCode} 
                  alt="UPI Payment QR Code" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>

            <div className="bg-accent-color/10 border border-accent-color/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-text-primary mb-2">Payment Details:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Amount:</span>
                  <span className="text-text-primary font-semibold">₹{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Account:</span>
                  <span className="text-text-primary font-semibold">{accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Payment Method:</span>
                  <span className="text-text-primary font-semibold">UPI - {upiApps.find(app => app.id === selectedUPI)?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-transparent border border-border-color text-text-secondary hover:text-text-primary hover:border-text-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-gradient-to-r from-success-color to-green-600 hover:from-green-600 hover:to-success-color text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
              >
                I Have Made Payment
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-text-primary mb-2">Upload Payment Screenshot</h3>
              <p className="text-text-secondary">Please upload a screenshot of your payment confirmation</p>
            </div>

            <div className="mb-6">
              <label className="block text-text-secondary text-sm mb-2">Payment Screenshot</label>
              <div className="border-2 border-dashed border-border-color rounded-lg p-6 text-center hover:border-accent-color transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofUpload}
                  className="hidden"
                  id="payment-proof"
                />
                <label htmlFor="payment-proof" className="cursor-pointer">
                  {paymentProof ? (
                    <div>
                      <div className="text-success-color text-4xl mb-2">✓</div>
                      <p className="text-text-primary font-semibold">{paymentProof.name}</p>
                      <p className="text-text-secondary text-sm">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-text-secondary text-4xl mb-2">📷</div>
                      <p className="text-text-primary font-semibold">Click to upload</p>
                      <p className="text-text-secondary text-sm">PNG, JPG, JPEG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-warning-color/10 border border-warning-color/20 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="text-warning-color text-xl mr-3">⚠️</div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Important:</h4>
                  <p className="text-text-secondary text-sm">
                    Your deposit will be processed after the verification. This usually takes 3-5 minutes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-transparent border border-border-color text-text-secondary hover:text-text-primary hover:border-text-primary font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmitDeposit}
                disabled={!paymentProof}
                className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-all duration-300 ${
                  paymentProof
                    ? 'bg-gradient-to-r from-accent-color to-primary-blue hover:from-primary-blue hover:to-accent-color text-text-quaternary hover:scale-105 shadow-lg'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
