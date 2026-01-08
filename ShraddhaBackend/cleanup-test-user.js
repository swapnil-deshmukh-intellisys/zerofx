import mongoose from "mongoose";
import User from "./models/User.js";
import Account from "./models/Account.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const cleanupTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find and delete the test user
    const user = await User.findOne({ email: 'api-test@example.com' });
    if (user) {
      console.log("🧹 Cleaning up test user:", user.email);
      
      // Delete associated accounts
      await Account.deleteMany({ user: user._id });
      console.log("✅ Accounts deleted");
      
      // Delete user
      await User.deleteOne({ _id: user._id });
      console.log("✅ User deleted");
    } else {
      console.log("ℹ️  Test user not found");
    }

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
};

// Run cleanup
cleanupTestUser();
