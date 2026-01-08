import ReferralLink from "../models/ReferralLink.js";
import User from "../models/User.js";

// =============== CREATE REFERRAL LINK ===============
export const createReferralLink = async (req, res) => {
  try {
    const { customId } = req.body;

    if (!customId || customId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Custom ID is required"
      });
    }

    // Check if customId already exists
    const existingLink = await ReferralLink.findOne({ customId: customId.trim() });
    if (existingLink) {
      return res.status(409).json({
        success: false,
        message: "Custom ID already exists. Please choose a different one."
      });
    }

    // Generate the full referral link
    const baseUrl = process.env.FRONTEND_URL || "https://www.zerofx.club";
    const link = `${baseUrl}/?ref=${customId.trim()}`;

    const referralLink = await ReferralLink.create({
      customId: customId.trim(),
      link
    });

    return res.status(201).json({
      success: true,
      message: "Referral link created successfully",
      referralLink
    });
  } catch (error) {
    console.error("Create Referral Link Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET ALL REFERRAL LINKS ===============
export const getAllReferralLinks = async (req, res) => {
  try {
    const referralLinks = await ReferralLink.find({})
      .sort({ createdAt: -1 })
      .select("customId link visitorCount signupCount isActive createdAt updatedAt");

    return res.status(200).json({
      success: true,
      referralLinks
    });
  } catch (error) {
    console.error("Get All Referral Links Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== GET REFERRAL LINK BY ID ===============
export const getReferralLinkById = async (req, res) => {
  try {
    const { id } = req.params;

    const referralLink = await ReferralLink.findById(id);
    if (!referralLink) {
      return res.status(404).json({
        success: false,
        message: "Referral link not found"
      });
    }

    // Get all users who signed up via this referral link
    const users = await User.find({ referredBy: id })
      .select("email fullName createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      referralLink: {
        ...referralLink.toObject(),
        users: users.map(user => ({
          email: user.email,
          fullName: user.fullName,
          signupDate: user.createdAt
        }))
      }
    });
  } catch (error) {
    console.error("Get Referral Link By ID Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== UPDATE REFERRAL LINK ===============
export const updateReferralLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { customId } = req.body;

    if (!customId || customId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Custom ID is required"
      });
    }

    const referralLink = await ReferralLink.findById(id);
    if (!referralLink) {
      return res.status(404).json({
        success: false,
        message: "Referral link not found"
      });
    }

    // Check if new customId already exists (excluding current link)
    const existingLink = await ReferralLink.findOne({
      customId: customId.trim(),
      _id: { $ne: id }
    });
    if (existingLink) {
      return res.status(409).json({
        success: false,
        message: "Custom ID already exists. Please choose a different one."
      });
    }

    // Update customId and regenerate link
    const baseUrl = process.env.FRONTEND_URL || "https://www.zerofx.club";
    referralLink.customId = customId.trim();
    referralLink.link = `${baseUrl}/?ref=${customId.trim()}`;
    await referralLink.save();

    return res.status(200).json({
      success: true,
      message: "Referral link updated successfully",
      referralLink
    });
  } catch (error) {
    console.error("Update Referral Link Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== DELETE REFERRAL LINK ===============
export const deleteReferralLink = async (req, res) => {
  try {
    const { id } = req.params;

    const referralLink = await ReferralLink.findByIdAndDelete(id);
    if (!referralLink) {
      return res.status(404).json({
        success: false,
        message: "Referral link not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Referral link deleted successfully"
    });
  } catch (error) {
    console.error("Delete Referral Link Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== TOGGLE REFERRAL LINK STATUS ===============
export const toggleReferralLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const referralLink = await ReferralLink.findById(id);
    if (!referralLink) {
      return res.status(404).json({
        success: false,
        message: "Referral link not found"
      });
    }

    referralLink.isActive = !referralLink.isActive;
    await referralLink.save();

    return res.status(200).json({
      success: true,
      message: `Referral link ${referralLink.isActive ? "activated" : "deactivated"} successfully`,
      referralLink
    });
  } catch (error) {
    console.error("Toggle Referral Link Status Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== TRACK VISITOR ===============
export const trackVisitor = async (req, res) => {
  try {
    const { customId } = req.body;

    if (!customId) {
      return res.status(400).json({
        success: false,
        message: "Custom ID is required"
      });
    }

    const referralLink = await ReferralLink.findOne({ customId: customId.trim() });
    if (!referralLink) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code"
      });
    }

    if (!referralLink.isActive) {
      return res.status(400).json({
        success: false,
        message: "Referral link is inactive"
      });
    }

    // Increment visitor count
    referralLink.visitorCount += 1;
    await referralLink.save();

    return res.status(200).json({
      success: true,
      message: "Visitor tracked successfully"
    });
  } catch (error) {
    console.error("Track Visitor Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =============== VALIDATE REFERRAL CODE ===============
export const validateReferralCode = async (req, res) => {
  try {
    const { customId } = req.params;

    const referralLink = await ReferralLink.findOne({ customId: customId.trim() });
    if (!referralLink) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
        valid: false
      });
    }

    if (!referralLink.isActive) {
      return res.status(400).json({
        success: false,
        message: "Referral link is inactive",
        valid: false
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: "Referral code is valid"
    });
  } catch (error) {
    console.error("Validate Referral Code Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

