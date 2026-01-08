import mongoose from "mongoose";

const depositRequestSchema = new mongoose.Schema(
  {
    // User and account reference
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    accountType: { type: String, required: true },
    
    // Deposit details
    amount: { type: Number, required: true },
    verifiedAmount: { type: Number }, // Amount verified by admin
    upiApp: { type: String, required: true }, // Selected UPI app
    
    // Payment proof
    paymentProof: { type: String, required: true }, // Base64 encoded image
    proofName: { type: String, required: true },
    proofType: { type: String, required: true },
    
    // Status and verification
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who verified
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    
    // Timestamps
    submittedAt: { type: Date, default: Date.now },
    processedAt: { type: Date }
  },
  { timestamps: true }
);

const DepositRequest = mongoose.model("DepositRequest", depositRequestSchema);
export default DepositRequest;
