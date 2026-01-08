import mongoose from "mongoose";
import User from "./models/User.js";
import Account from "./models/Account.js";
import AdminData from "./models/AdminData.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const testSignup = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test data
    const testUser = {
      accountType: 'Platinum',
      email: 'test@example.com',
      password: 'testpassword123',
      fullName: 'Test User',
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

    console.log("🔄 Testing user creation...");
    
    // Create user
    const user = await User.create(testUser);
    console.log("✅ User created:", {
      id: user._id,
      email: user.email,
      accountType: user.accountType
    });

    console.log("🔄 Testing account creation...");
    
    // Create account for the selected account type
    const newAccount = await Account.create({
      user: user._id,
      type: user.accountType,
      status: 'Live',
      initialDeposit: 0,
      leverage: '1:500',
      balance: 0
    });

    console.log("✅ Account created:", {
      accountId: newAccount._id,
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

    // Verify the account was created
    const createdAccount = await Account.findOne({ user: user._id });
    console.log("✅ Verification - Account found:", {
      id: createdAccount._id,
      accountNumber: createdAccount.accountNumber,
      type: createdAccount.type,
      balance: createdAccount.balance
    });

    // Clean up test data
    await Account.deleteOne({ _id: newAccount._id });
    await User.deleteOne({ _id: user._id });
    console.log("🧹 Test data cleaned up");

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
testSignup();
