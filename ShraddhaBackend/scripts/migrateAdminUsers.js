import mongoose from 'mongoose';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateAdminUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/forex-trading');
    console.log('Connected to MongoDB');

    // Find admin users in User collection
    const adminUsers = await User.find({ email: 'admin@forex.com' });
    console.log(`Found ${adminUsers.length} admin users in User collection`);

    for (const user of adminUsers) {
      // Check if admin already exists in Admin collection
      const existingAdmin = await Admin.findOne({ email: user.email });
      
      if (existingAdmin) {
        console.log(`Admin user ${user.email} already exists in Admin collection`);
        continue;
      }

      // Create admin user in Admin collection
      const adminUser = await Admin.create({
        email: user.email,
        password: 'admin123', // Reset password to default
        fullName: user.fullName,
        role: 'admin',
        isActive: true,
        permissions: {
          canManageUsers: true,
          canManageAccounts: true,
          canViewReports: true,
          canManageSettings: true
        }
      });

      console.log(`Created admin user: ${adminUser.email}`);

      // Delete from User collection
      await User.findByIdAndDelete(user._id);
      console.log(`Removed admin user from User collection: ${user.email}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration
migrateAdminUsers();


