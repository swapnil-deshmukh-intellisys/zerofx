import mongoose from "mongoose";
import DepositRequest from "./models/DepositRequest.js";
import Account from "./models/Account.js";
import User from "./models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const checkDepositUserAssociation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all deposit requests with user and account information
    const allDepositRequests = await DepositRequest.find({})
      .populate('user', 'fullName email')
      .populate('account', 'accountNumber type status user')
      .sort({ createdAt: -1 });

    console.log(`📊 Total deposit requests: ${allDepositRequests.length}`);
    console.log("=" * 60);

    allDepositRequests.forEach((request, index) => {
      console.log(`${index + 1}. Deposit Request ID: ${request._id}`);
      console.log(`   Amount: $${request.amount}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Created: ${request.createdAt}`);
      
      // Check user association
      if (request.user) {
        console.log(`   👤 User: ${request.user.fullName} (${request.user.email})`);
        console.log(`   🆔 User ID: ${request.user._id}`);
      } else {
        console.log(`   ❌ No user associated`);
      }
      
      // Check account association
      if (request.account) {
        console.log(`   🏦 Account: ${request.account.accountNumber} (${request.account.type})`);
        console.log(`   🆔 Account ID: ${request.account._id}`);
        console.log(`   👤 Account User ID: ${request.account.user}`);
        
        // Check if user IDs match
        if (request.user && request.account.user) {
          const userMatch = request.user._id.toString() === request.account.user.toString();
          console.log(`   ✅ User IDs match: ${userMatch}`);
        } else {
          console.log(`   ❌ Cannot compare user IDs - missing data`);
        }
      } else {
        console.log(`   ❌ No account associated`);
      }
      
      console.log("   " + "-" * 50);
    });

    // Check for any orphaned requests
    console.log("\n🔍 Checking for orphaned requests...");
    const orphanedRequests = allDepositRequests.filter(req => !req.user || !req.account);
    console.log(`❌ Found ${orphanedRequests.length} orphaned requests`);

    // Check field names in the schema
    console.log("\n🔍 Checking DepositRequest schema fields...");
    const sampleRequest = allDepositRequests[0];
    if (sampleRequest) {
      console.log("📋 Available fields in DepositRequest:");
      console.log("   - user:", !!sampleRequest.user);
      console.log("   - account:", !!sampleRequest.account);
      console.log("   - accountId:", !!sampleRequest.accountId);
      console.log("   - accountType:", sampleRequest.accountType);
    }

  } catch (error) {
    console.error("❌ Check failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
};

// Run check
checkDepositUserAssociation();
