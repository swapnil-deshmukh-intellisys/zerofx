import mongoose from "mongoose";
import DepositRequest from "./models/DepositRequest.js";
import Account from "./models/Account.js";
import User from "./models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const testSpecificUserRequests = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const userId = '68c10ca7bd99043b3f193c33';
    const userEmail = 'riteshrjawale123@gmail.com';
    
    console.log(`🔍 Testing user: ${userEmail} (${userId})`);

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return;
    }
    
    console.log("👤 User found:", {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      accountType: user.accountType
    });

    // Get user's accounts
    const userAccounts = await Account.find({ user: userId });
    console.log(`📋 Found ${userAccounts.length} accounts for user:`, userAccounts.map(acc => ({ 
      id: acc._id, 
      type: acc.type, 
      status: acc.status,
      accountNumber: acc.accountNumber
    })));
    
    const accountIds = userAccounts.map(account => account._id);
    console.log(`🆔 Account IDs to search:`, accountIds);
    
    // Get deposit requests for user's accounts
    const depositRequests = await DepositRequest.find({ 
      account: { $in: accountIds } 
    }).populate('user', 'fullName email')
      .populate('account', 'accountNumber type status')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${depositRequests.length} deposit requests for user`);
    if (depositRequests.length > 0) {
      console.log("📋 Deposit requests:");
      depositRequests.forEach((request, index) => {
        console.log(`${index + 1}. ID: ${request._id}`);
        console.log(`   User: ${request.user?.fullName || 'N/A'} (${request.user?.email || 'N/A'})`);
        console.log(`   Account: ${request.account?.accountNumber || 'N/A'} (${request.accountType})`);
        console.log(`   Amount: $${request.amount}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Created: ${request.createdAt}`);
        console.log("   ---");
      });
    } else {
      console.log("❌ No deposit requests found for this user");
      
      // Let's check if there are any deposit requests that might be linked to this user directly
      console.log("🔍 Checking if any deposit requests are linked to this user directly...");
      const directDepositRequests = await DepositRequest.find({ user: userId });
      console.log(`📊 Found ${directDepositRequests.length} deposit requests linked directly to user`);
      
      if (directDepositRequests.length > 0) {
        console.log("📋 Direct deposit requests:");
        directDepositRequests.forEach((request, index) => {
          console.log(`${index + 1}. ID: ${request._id}`);
          console.log(`   Account: ${request.account}`);
          console.log(`   Amount: $${request.amount}`);
          console.log(`   Status: ${request.status}`);
          console.log("   ---");
        });
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
};

// Run test
testSpecificUserRequests();
