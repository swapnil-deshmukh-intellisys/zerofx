import express from "express";
import {
  createReferralLink,
  getAllReferralLinks,
  getReferralLinkById,
  updateReferralLink,
  deleteReferralLink,
  toggleReferralLinkStatus,
  trackVisitor,
  validateReferralCode
} from "../controllers/referral.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/track-visitor", trackVisitor);
router.get("/validate/:customId", validateReferralCode);

// Admin-only routes (require authentication and admin role)
// Note: adminMiddleware already checks authentication, but we use both for extra security
router.use(authMiddleware);
router.use(adminMiddleware);

router.post("/", createReferralLink);
router.get("/", getAllReferralLinks);
router.get("/:id", getReferralLinkById);
router.put("/:id", updateReferralLink);
router.delete("/:id", deleteReferralLink);
router.patch("/:id/toggle", toggleReferralLinkStatus);

export default router;

