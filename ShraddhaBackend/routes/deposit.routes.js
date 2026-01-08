import express from "express";
import { 
  submitDepositRequest, 
  getDepositRequests, 
  verifyDepositRequest, 
  getCurrentUserDepositRequests 
} from "../controllers/deposit.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// User routes
router.post("/submit", upload.single('paymentProof'), submitDepositRequest);
router.get("/user", getCurrentUserDepositRequests);

// Admin routes (for now, all authenticated users can access - you can add admin role check later)
router.get("/admin", getDepositRequests);
router.put("/admin/:requestId/verify", verifyDepositRequest);

export default router;
