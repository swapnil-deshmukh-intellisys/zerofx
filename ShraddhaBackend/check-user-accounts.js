import mongoose from "mongoose";
import User from "./models/User.js";
import Account from "./models/Account.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const checkUserAccounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find the most recently created user (likely the one you just logged in with)
    const recentUser = await User.findOne().sort({ createdAt: -1 });
    if (!recentUser) {
      console.log("❌ No users found");
      return;
    }

    console.log("👤 Most recent user:", {
      id: recentUser._id,
      email: recentUser.email,
      accountType: recentUser.accountType,
      createdAt: recentUser.createdAt
    });

    // Check if user has accounts
    const accounts = await Account.find({ user: recentUser._id });
    console.log("📊 Accounts found:", accounts.length);

    if (accounts.length > 0) {
      console.log("✅ Accounts:", accounts.map(acc => ({
        id: acc._id,
        accountNumber: acc.accountNumber,
        type: acc.type,
        status: acc.status,
        balance: acc.balance,
        createdAt: acc.createdAt
      })));
    } else {
      console.log("❌ No accounts found for this user");
      console.log("🔄 This means the account creation during signup failed");
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
checkUserAccounts();
