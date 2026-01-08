import mongoose from "mongoose";
import User from "./models/User.js";
import Admin from "./models/Admin.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const checkAdminUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check for admin users
    const adminUsers = await Admin.find({});
    console.log(`👑 Found ${adminUsers.length} admin users:`, adminUsers.map(admin => ({
      id: admin._id,
      email: admin.email,
      name: admin.name
    })));

    // Check for regular users that might be admins
    const regularUsers = await User.find({}).select('email fullName');
    console.log(`👤 Found ${regularUsers.length} regular users:`, regularUsers.map(user => ({
      id: user._id,
      email: user.email,
      fullName: user.fullName
    })));

    // Check if there are any users with admin-like emails
    const adminLikeUsers = regularUsers.filter(user => 
      user.email.includes('admin') || 
      user.email.includes('forex') ||
      user.email === 'admin@forex.com'
    );
    
    if (adminLikeUsers.length > 0) {
      console.log(`🔍 Found ${adminLikeUsers.length} admin-like users:`, adminLikeUsers.map(user => ({
        id: user._id,
        email: user.email,
        fullName: user.fullName
      })));
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
checkAdminUsers();
