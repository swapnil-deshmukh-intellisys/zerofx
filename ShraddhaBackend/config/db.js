// config/db.js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Connect using Atlas URI
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    
    if (process.env.NODE_ENV === "production") {
      console.log("🚫 Production mode - database connection required. Exiting...");
      process.exit(1);
    } else {
      console.log("⚠️  Development mode - continuing without database");
      console.log("🚫 Some features may not work without database connection");
    }
  }
};
