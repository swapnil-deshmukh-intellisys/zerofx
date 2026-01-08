import mongoose from "mongoose";
import User from "./models/User.js";
import Account from "./models/Account.js";
import AdminData from "./models/AdminData.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const debugAccountCreation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find the user we just created in the API test
    const user = await User.findOne({ email: 'api-test@example.com' });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:", {
      id: user._id,
      email: user.email,
      accountType: user.accountType
    });

    // Check if user already has accounts
    const existingAccounts = await Account.find({ user: user._id });
    console.log("📊 Existing accounts:", existingAccounts.length);

    if (existingAccounts.length === 0) {
      console.log("🔄 No accounts found, creating account...");
      
      try {
        const newAccount = await Account.create({
          user: user._id,
          type: user.accountType,
          status: 'Live',
          initialDeposit: 0,
          leverage: '1:500',
          balance: 0
        });

        console.log("✅ Account created successfully:", {
          id: newAccount._id,
          accountNumber: newAccount.accountNumber,
          type: newAccount.type,
          status: newAccount.status,
          balance: newAccount.balance
        });

        // Initialize admin data
        const adminData = await AdminData.findOneAndUpdate(
          { accountType: user.accountType },
          {
            accountType: user.accountType,
            balance: 0,
            currency: 'USD',
            equity: 0.00,
            margin: 0.00
          },
          { upsert: true, new: true }
        );

        console.log("✅ AdminData initialized:", adminData);

      } catch (accountError) {
        console.error("❌ Account creation failed:", accountError);
        console.error("Error details:", {
          message: accountError.message,
          name: accountError.name,
          code: accountError.code,
          errors: accountError.errors
        });
      }
    } else {
      console.log("ℹ️  User already has accounts:", existingAccounts.map(acc => ({
        id: acc._id,
        type: acc.type,
        status: acc.status,
        balance: acc.balance
      })));
    }

    // Now test the getUserAccounts logic
    console.log("\n🔄 Testing getUserAccounts logic...");
    const accounts = await Account.find({ user: user._id }).sort({ createdAt: -1 });
    console.log("📊 Accounts found:", accounts.length);

    if (accounts.length > 0) {
      // Get admin data
      const adminDataMap = {};
      const adminDataList = await AdminData.find({});
      adminDataList.forEach(data => {
        adminDataMap[data.accountType] = data;
      });

      const accountsWithAdminData = accounts.map(account => {
        const adminData = adminDataMap[account.type];
        return {
          ...account.toObject(),
          balance: adminData ? adminData.balance : account.balance,
          currency: adminData ? adminData.currency : account.currency,
          equity: adminData ? adminData.equity : account.equity,
          margin: adminData ? adminData.margin : account.margin
        };
      });

      console.log("✅ Final accounts with admin data:", accountsWithAdminData.map(acc => ({
        id: acc._id,
        accountNumber: acc.accountNumber,
        type: acc.type,
        balance: acc.balance,
        currency: acc.currency
      })));
    }

  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
};

// Run debug
debugAccountCreation();
