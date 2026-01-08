import WithdrawalRequest from '../models/WithdrawalRequest.js';
import User from '../models/User.js';
import Account from '../models/Account.js';

// Submit withdrawal request
export const submitWithdrawalRequest = async (req, res) => {
  try {
    const { accountId, accountType, amount, method, accountDetails } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!accountId || !accountType || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    console.log('🔍 Withdrawal request details:', {
      accountId,
      userId,
      accountType,
      amount
    });

    // Check if account exists and belongs to user
    const account = await Account.findOne({ _id: accountId, user: userId });
    console.log('🔍 Account lookup result:', account);
    
    if (!account) {
      // Let's also check if the account exists at all
      const anyAccount = await Account.findById(accountId);
      console.log('🔍 Any account with this ID:', anyAccount);
      
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Check account balance (if available)
    if (account.balance && amount > account.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      accountId,
      accountType,
      amount,
      method,
      accountDetails
    });

    console.log('💾 Saving withdrawal request:', withdrawalRequest);
    await withdrawalRequest.save();
    console.log('✅ Withdrawal request saved successfully:', withdrawalRequest._id);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalRequest
    });
  } catch (error) {
    console.error('Error submitting withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user's withdrawal requests
export const getCurrentUserWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const withdrawalRequests = await WithdrawalRequest.find({ userId })
      .populate('accountId', 'type status balance')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      withdrawalRequests
    });
  } catch (error) {
    console.error('Error fetching user withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all withdrawal requests (admin)
export const getWithdrawalRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    console.log('🔍 Admin fetching withdrawal requests with filter:', filter);

    const withdrawalRequests = await WithdrawalRequest.find(filter)
      .populate('userId', 'fullName email')
      .populate('accountId', 'type status balance')
      .populate('verifiedBy', 'email')
      .sort({ createdAt: -1 });

    console.log('🔍 Found withdrawal requests:', withdrawalRequests.length);
    console.log('🔍 Withdrawal requests data:', withdrawalRequests);

    res.json({
      success: true,
      withdrawalRequests
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify withdrawal request (admin)
export const verifyWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, verifiedAmount, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal request has already been processed'
      });
    }

    if (action === 'approve') {
      // Deduct amount from user's account balance
      const account = await Account.findById(withdrawalRequest.accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      const amountToDeduct = verifiedAmount || withdrawalRequest.amount;
      
      if (account.balance < amountToDeduct) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance in account for withdrawal approval'
        });
      }

      // Deduct the amount from account balance
      account.balance -= amountToDeduct;
      await account.save();

      console.log(`💰 Withdrawal approved: ₹${amountToDeduct} deducted from account ${account.accountNumber}. New balance: ₹${account.balance}`);

      // Update withdrawal request
      withdrawalRequest.status = 'approved';
      withdrawalRequest.verifiedAmount = amountToDeduct;
      withdrawalRequest.verifiedAt = new Date();
      withdrawalRequest.verifiedBy = adminId;
    } else {
      // Update withdrawal request for rejection
      withdrawalRequest.status = 'rejected';
      withdrawalRequest.verifiedAt = new Date();
      withdrawalRequest.verifiedBy = adminId;
      
      if (rejectionReason) {
        withdrawalRequest.rejectionReason = rejectionReason;
      }
    }

    await withdrawalRequest.save();

    res.json({
      success: true,
      message: `Withdrawal request ${action}d successfully`,
      withdrawalRequest
    });
  } catch (error) {
    console.error('Error verifying withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
