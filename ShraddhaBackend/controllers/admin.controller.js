import AdminData from "../models/AdminData.js";
import DepositRequest from "../models/DepositRequest.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

// =============== GET ALL ADMIN DATA ===============
export const getAdminData = async (req, res) => {
  try {
    const adminData = await AdminData.find({}).sort({ accountType: 1 });
    
    res.status(200).json({
      success: true,
      adminData
    });
  } catch (error) {
    console.error("Get Admin Data Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== UPDATE ADMIN DATA ===============
export const updateAdminData = async (req, res) => {
  try {
    const { accountType, balance, currency, equity, margin } = req.body;
    const adminId = req.user.id;

    if (!accountType) {
      return res.status(400).json({ success: false, message: "Account type is required" });
    }

    // Validate numeric fields
    if (balance !== undefined && (isNaN(balance) || balance < 0)) {
      return res.status(400).json({ success: false, message: "Balance must be a valid positive number" });
    }
    if (equity !== undefined && (isNaN(equity) || equity < 0)) {
      return res.status(400).json({ success: false, message: "Equity must be a valid positive number" });
    }
    if (margin !== undefined && (isNaN(margin) || margin < 0)) {
      return res.status(400).json({ success: false, message: "Margin must be a valid positive number" });
    }

    const updateData = {
      lastUpdatedBy: adminId,
      lastUpdatedAt: new Date()
    };

    if (balance !== undefined) updateData.balance = balance;
    if (currency !== undefined) updateData.currency = currency;
    if (equity !== undefined) updateData.equity = equity;
    if (margin !== undefined) updateData.margin = margin;

    const adminData = await AdminData.findOneAndUpdate(
      { accountType },
      updateData,
      { upsert: true, new: true }
    );

    // Update all accounts of this type
    await Account.updateMany(
      { type: accountType },
      {
        balance: balance !== undefined ? balance : { $set: "balance" },
        currency: currency !== undefined ? currency : { $set: "currency" }
      }
    );

    res.status(200).json({
      success: true,
      message: "Admin data updated successfully",
      adminData
    });
  } catch (error) {
    console.error("Update Admin Data Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET ACCOUNT TYPES ===============
export const getAccountTypes = async (req, res) => {
  try {
    // Get unique account types from created accounts
    const accountTypes = await Account.distinct('type');
    
    res.status(200).json({
      success: true,
      accountTypes
    });
  } catch (error) {
    console.error("Get Account Types Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET DEPOSIT STATISTICS ===============
export const getDepositStatistics = async (req, res) => {
  try {
    const totalRequests = await DepositRequest.countDocuments();
    const pendingRequests = await DepositRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await DepositRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await DepositRequest.countDocuments({ status: 'rejected' });

    const totalDeposited = await DepositRequest.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$verifiedAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalDeposited: totalDeposited[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Get Deposit Statistics Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET ALL USERS ===============
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // Get account information and profile data for each user
    const usersWithAccounts = await Promise.all(users.map(async (user) => {
      const accounts = await Account.find({ user: user._id });
      const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      
      // Get profile data if it exists
      const profile = await Profile.findOne({ user: user._id });
      
      return {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        accountType: user.accountType,
        createdAt: user.createdAt,
        lastLogin: user.updatedAt, // Using updatedAt as lastLogin for now
        status: 'Active', // Default status
        totalAccounts: accounts.length,
        totalBalance: totalBalance,
        // Include profile information from User model
        phone: user.mobileCode && user.mobileNumber ? `${user.mobileCode}${user.mobileNumber}` : null,
        country: user.country,
        city: user.city,
        state: user.state,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        fatherName: user.fatherName,
        motherName: user.motherName,
        postalCode: user.postalCode,
        streetAddress: user.streetAddress,
        verified: user.verified || false,
        // Include profile data from Profile model (documents, etc.)
        profilePicture: profile?.profilePicture || null,
        idDocument: profile?.panDocument || null,
        addressProof: profile?.aadharFront || null,
        aadharBack: profile?.aadharBack || null,
        bankAccount: profile?.bankAccount || null,
        bankName: profile?.bankName || null,
        bankAddress: profile?.bankAddress || null,
        swiftCode: profile?.swiftCode || null,
        accountName: profile?.accountName || null,
        upiId: profile?.upiId || null,
        upiApp: profile?.upiApp || null
      };
    }));

    res.status(200).json({
      success: true,
      users: usersWithAccounts
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET USER BY ID ===============
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user's accounts with individual balances
    const accounts = await Account.find({ user: userId });
    
    // Use individual account data only (no global admin data override)
    const accountsWithData = accounts.map(account => {
      return {
        ...account.toObject(),
        // Use individual account balance, not global admin data
        balance: account.balance,
        currency: account.currency,
        equity: account.equity,
        margin: account.margin,
        mt5Id: account.mt5Id,
        mt5Password: account.mt5Password,
        mt5Server: account.mt5Server
      };
    });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        accounts: accountsWithData
      }
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET USER DEPOSIT REQUESTS ===============
export const getUserDepositRequests = async (req, res) => {
  console.log("🚀 getUserDepositRequests function called!");
  try {
    const { userId } = req.params;
    console.log(`🔍 Getting deposit requests for user: ${userId}`);
    
    // Get user's accounts
    const userAccounts = await Account.find({ user: userId });
    console.log(`📋 Found ${userAccounts.length} accounts for user:`, userAccounts.map(acc => ({ id: acc._id, type: acc.type, status: acc.status })));
    
    const accountIds = userAccounts.map(account => account._id);
    console.log(`🆔 Account IDs to search:`, accountIds);
    
    // Get deposit requests for user's accounts
    const depositRequests = await DepositRequest.find({ 
      account: { $in: accountIds } 
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${depositRequests.length} deposit requests for user`);
    if (depositRequests.length > 0) {
      console.log(`📋 Deposit requests:`, depositRequests.map(req => ({ id: req._id, account: req.account, amount: req.amount, status: req.status })));
    }

    // Convert ObjectIds to strings for proper serialization
    const serializedDepositRequests = depositRequests.map(request => ({
      ...request.toObject(),
      _id: request._id.toString(),
      user: request.user.toString(),
      account: request.account.toString(),
      verifiedBy: request.verifiedBy ? request.verifiedBy.toString() : null
    }));

    res.status(200).json({
      success: true,
      depositRequests: serializedDepositRequests
    });
  } catch (error) {
    console.error("Get User Deposit Requests Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== VERIFY USER ===============
export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Verified status must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { verified },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${verified ? 'verified' : 'unverified'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error("Verify User Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET USER WITHDRAWAL REQUESTS ===============
export const getUserWithdrawalRequests = async (req, res) => {
  console.log("🚀 getUserWithdrawalRequests function called!");
  try {
    const { userId } = req.params;
    console.log(`🔍 Getting withdrawal requests for user: ${userId}`);
    
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Get withdrawal requests for the specific user
    const withdrawalRequests = await WithdrawalRequest.find({ 
      userId: userId 
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${withdrawalRequests.length} withdrawal requests for user`);
    if (withdrawalRequests.length > 0) {
      console.log(`📋 Withdrawal requests:`, withdrawalRequests.map(req => ({ 
        id: req._id, 
        userId: req.userId, 
        amount: req.amount, 
        status: req.status 
      })));
    }

    // Return withdrawal requests directly (MongoDB handles ObjectId serialization)
    res.status(200).json({
      success: true,
      withdrawalRequests
    });
  } catch (error) {
    console.error("❌ Get User Withdrawal Requests Error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
