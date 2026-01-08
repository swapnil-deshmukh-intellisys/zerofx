import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    // Linked User (store ObjectId)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Personal Details
    fullName: { type: String },
    fatherName: { type: String },
    motherName: { type: String },
    gender: { type: String },
    dateOfBirth: { type: String },
    mobileCode: { type: String },
    mobileNumber: { type: String },

    // Address
    country: { type: String },
    state: { type: String },
    city: { type: String },
    postalCode: { type: String },
    streetAddress: { type: String },

    // Bank Info
    accountName: { type: String },
    bankAccount: { type: String },
    bankAddress: { type: String },
    swiftCode: { type: String },
    bankName: { type: String },

    // UPI Info
    upiId: { type: String },
    upiApp: { type: String },

    // Profile Picture
    profilePicture: { type: String },

    // Document Uploads
    panDocument: { type: String },
    aadharFront: { type: String },
    aadharBack: { type: String },

    // Document Verification Status
    verificationStatus: { 
      type: String, 
      enum: ['unverified', 'verified'], 
      default: 'unverified' 
    },
  },
  { timestamps: true } // Optional: createdAt, updatedAt
);

export default mongoose.model("Profile", ProfileSchema);
