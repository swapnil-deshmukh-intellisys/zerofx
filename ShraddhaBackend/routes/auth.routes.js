import express from "express";
import { signup, login, adminLogin, getProfile, createAdminUser, forgotPassword, verifyOTP, resetPassword, validateAdminAccess, sendEmailVerificationOTP } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/admin-login", adminLogin);
router.get("/profile", authMiddleware, getProfile); 
router.post("/create-admin", createAdminUser); // No auth required for creating admin user

// Email verification routes
router.post("/send-email-verification", sendEmailVerificationOTP);

// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Admin validation route
router.post("/validate-admin", validateAdminAccess);

export default router;
