import mongoose from "mongoose";
import User from "./models/User.js";
import Account from "./models/Account.js";
import AdminData from "./models/AdminData.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const testFullSignup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clean up any existing test data
    await User.deleteOne({ email: 'test-signup@example.com' });
    await Account.deleteMany({ user: { $exists: false } }); // Clean up orphaned accounts

    // Test data - simulate the exact signup request
    const signupData = {
      accountType: 'Standard',
      email: 'test-signup@example.com',
      password: 'testpassword123',
      repeatPassword: 'testpassword123',
      fullName: 'Test Signup User',
      fatherName: 'Test Father',
      motherName: 'Test Mother',
      gender: 'male',
      dateOfBirth: new Date('1990-01-01'),
      mobileCode: '+91',
      mobileNumber: '1234567890',
      country: 'US',
      state: 'California',
      city: 'Los Angeles',
      postalCode: '90210',
      streetAddress: '123 Test Street',
      termsAccepted: true,
      privacyAccepted: true
    };

    console.log("🔄 Testing full signup process...");
    console.log("Signup data:", { accountType: signupData.accountType, email: signupData.email });
    
    // Step 1: Create user (simulating auth.controller.js signup)
    console.log("Step 1: Creating user...");
    const user = await User.create({
      accountType: signupData.accountType,
      email: signupData.email,
      password: signupData.password,
      fullName: signupData.fullName,
      fatherName: signupData.fatherName,
      motherName: signupData.motherName,
      gender: signupData.gender,
      dateOfBirth: signupData.dateOfBirth,
      mobileCode: signupData.mobileCode,
      mobileNumber: signupData.mobileNumber,
      country: signupData.country,
      state: signupData.state,
      city: signupData.city,
      postalCode: signupData.postalCode,
      streetAddress: signupData.streetAddress,
      termsAccepted: signupData.termsAccepted,
      privacyAccepted: signupData.privacyAccepted,
    });

    console.log("✅ User created:", {
      id: user._id,
      email: user.email,
      accountType: user.accountType
    });

    // Step 2: Create account (simulating the account creation in signup)
    console.log("Step 2: Creating account...");
    const newAccount = await Account.create({
      user: user._id,
      type: user.accountType, // Use the account type selected during signup
      status: 'Live',
      initialDeposit: 0,
      leverage: '1:500',
      balance: 0  // Always start with zero balance
    });

    console.log("✅ Account created:", {
      accountId: newAccount._id,
      accountNumber: newAccount.accountNumber,
      type: newAccount.type,
      status: newAccount.status,
      balance: newAccount.balance
    });

    // Step 3: Initialize admin data
    console.log("Step 3: Initializing admin data...");
    const adminData = await AdminData.findOneAndUpdate(
      { accountType: user.accountType },
      {
        accountType: user.accountType,
        balance: 0,  // Always start with zero balance
        currency: 'USD',
        equity: 0.00,
        margin: 0.00
      },
      { upsert: true, new: true }
    );

    console.log("✅ AdminData initialized:", adminData);

    // Step 4: Test account retrieval (simulating getUserAccounts)
    console.log("Step 4: Testing account retrieval...");
    const accounts = await Account.find({ user: user._id }).sort({ createdAt: -1 });
    console.log("✅ Accounts found:", accounts.length);
    
    if (accounts.length > 0) {
      console.log("Account details:", {
        id: accounts[0]._id,
        accountNumber: accounts[0].accountNumber,
        type: accounts[0].type,
        status: accounts[0].status,
        balance: accounts[0].balance
      });
    }

    // Step 5: Test the full account retrieval with admin data (like the API endpoint)
    console.log("Step 5: Testing full account retrieval with admin data...");
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

    console.log("✅ Accounts with admin data:", accountsWithAdminData.length);
    if (accountsWithAdminData.length > 0) {
      console.log("Final account data:", {
        id: accountsWithAdminData[0]._id,
        accountNumber: accountsWithAdminData[0].accountNumber,
        type: accountsWithAdminData[0].type,
        balance: accountsWithAdminData[0].balance,
        currency: accountsWithAdminData[0].currency
      });
    }

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    await Account.deleteOne({ _id: newAccount._id });
    await User.deleteOne({ _id: user._id });
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 Full signup test completed successfully!");
    console.log("The account creation process is working correctly.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
      errors: error.errors
    });
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
};

// Run test
testFullSignup();
