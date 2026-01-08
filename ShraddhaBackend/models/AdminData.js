import mongoose from "mongoose";

const adminDataSchema = new mongoose.Schema(
  {
    // Account type reference
    accountType: { type: String, required: true, unique: true },
    
    // Financial data managed by admin
    balance: { type: Number, default: 0.00 },
    currency: { type: String, default: '₹' },
    equity: { type: Number, default: 0.00 },
    margin: { type: Number, default: 0.00 },
    
    // Admin settings
    isActive: { type: Boolean, default: true },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const AdminData = mongoose.model("AdminData", adminDataSchema);
export default AdminData;
