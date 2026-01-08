import mongoose from "mongoose";

const referralLinkSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    link: {
      type: String,
      required: true
    },
    visitorCount: {
      type: Number,
      default: 0
    },
    signupCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const ReferralLink = mongoose.model("ReferralLink", referralLinkSchema);
export default ReferralLink;

