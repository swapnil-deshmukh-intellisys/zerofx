import mongoose from "mongoose";
import User from "../models/User.js";
import Account from "../models/Account.js";
import AdminData from "../models/AdminData.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const migrateExistingUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process`);

    let processedUsers = 0;
    let createdAccounts = 0;

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // Check if user already has accounts
      const existingAccounts = await Account.find({ user: user._id });
      
      if (existingAccounts.length === 0) {
        console.log(`  📝 No accounts found, creating account for selected type: ${user.accountType}`);
        
        // Create account for the selected account type with Live status
        try {
          await Account.create({
            user: user._id,
            type: user.accountType, // Use the account type selected during signup
            status: 'Live',
            initialDeposit: 0,
            leverage: '1:500',
            balance: 0  // Always start with zero balance
          });
          createdAccounts++;
          console.log(`    ✅ Created ${user.accountType} account`);
        } catch (accountError) {
          console.error(`    ❌ Error creating ${user.accountType} account:`, accountError.message);
        }

        // Initialize admin data for the selected account type if it doesn't exist
        try {
          await AdminData.findOneAndUpdate(
            { accountType: user.accountType },
            {
              accountType: user.accountType,
              balance: 0,  // Always start with zero balance
              currency: '₹',
              equity: 0.00,
              margin: 0.00
            },
            { upsert: true, new: true }
          );
          console.log(`    ✅ Initialized AdminData for ${user.accountType}`);
        } catch (adminError) {
          console.error(`    ❌ Error initializing AdminData for ${user.accountType}:`, adminError.message);
        }
      } else {
        console.log(`  ℹ️  User already has ${existingAccounts.length} accounts, skipping...`);
      }
      
      processedUsers++;
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Processed ${processedUsers} users`);
    console.log(`📊 Created ${createdAccounts} new accounts`);

  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  }
};

// Run migration
migrateExistingUsers();
