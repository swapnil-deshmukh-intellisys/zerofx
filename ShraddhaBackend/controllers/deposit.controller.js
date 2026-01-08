import DepositRequest from "../models/DepositRequest.js";
import Account from "../models/Account.js";
import AdminData from "../models/AdminData.js";

// =============== SUBMIT DEPOSIT REQUEST ===============
export const submitDepositRequest = async (req, res) => {
  try {
    const { accountId, amount, upiApp } = req.body;
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment proof image is required" });
    }

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Create deposit request with relative file path
    const relativePath = req.file.path.replace(/\\/g, '/').split('uploads/')[1]; // Convert to relative path
    const depositRequest = await DepositRequest.create({
      user: userId,
      account: accountId,
      accountType: account.type,
      amount,
      upiApp,
      paymentProof: relativePath, // Store relative path instead of absolute path
      proofName: req.file.originalname,
      proofType: req.file.mimetype
    });

    res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully",
      depositRequest
    });
  } catch (error) {
    console.error("Submit Deposit Request Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET DEPOSIT REQUESTS (ADMIN) ===============
export const getDepositRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const depositRequests = await DepositRequest.find(query)
      .populate('user', 'fullName email')
      .populate('account', 'accountNumber type status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      depositRequests
    });
  } catch (error) {
    console.error("Get Deposit Requests Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== VERIFY DEPOSIT REQUEST (ADMIN) ===============
export const verifyDepositRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, verifiedAmount, rejectionReason } = req.body;
    const adminId = req.user.id;

    const depositRequest = await DepositRequest.findById(requestId);
    if (!depositRequest) {
      return res.status(404).json({ success: false, message: "Deposit request not found" });
    }

    if (action === 'approve') {
      // Update deposit request status
      depositRequest.status = 'approved';
      depositRequest.verifiedAmount = verifiedAmount || depositRequest.amount;
      depositRequest.verifiedBy = adminId;
      depositRequest.verifiedAt = new Date();
      depositRequest.processedAt = new Date();
      await depositRequest.save();

      // Update account balance
      const account = await Account.findById(depositRequest.account);
      if (account) {
        account.balance += depositRequest.verifiedAmount;
        await account.save();
      }

      // Update admin data
      await AdminData.findOneAndUpdate(
        { accountType: depositRequest.accountType },
        {
          $inc: { balance: depositRequest.verifiedAmount },
          lastUpdatedBy: adminId,
          lastUpdatedAt: new Date()
        },
        { upsert: true }
      );

      res.status(200).json({
        success: true,
        message: "Deposit request approved successfully"
      });
    } else if (action === 'reject') {
      // Update deposit request status
      depositRequest.status = 'rejected';
      depositRequest.verifiedBy = adminId;
      depositRequest.verifiedAt = new Date();
      depositRequest.rejectionReason = rejectionReason;
      depositRequest.processedAt = new Date();
      await depositRequest.save();

      res.status(200).json({
        success: true,
        message: "Deposit request rejected"
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    console.error("Verify Deposit Request Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET CURRENT USER DEPOSIT REQUESTS ===============
export const getCurrentUserDepositRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const depositRequests = await DepositRequest.find({ user: userId })
      .populate('account', 'accountNumber type status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      depositRequests
    });
  } catch (error) {
    console.error("Get User Deposit Requests Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
