import express from "express";
import { 
  getAdminData, 
  updateAdminData, 
  getAccountTypes, 
  getDepositStatistics,
  getAllUsers,
  getUserById,
  getUserDepositRequests,
  getUserWithdrawalRequests,
  verifyUser
} from "../controllers/admin.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/data", getAdminData);
router.put("/data", updateAdminData);
router.get("/account-types", getAccountTypes);
router.get("/statistics", getDepositStatistics);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.get("/users/:userId/deposits", getUserDepositRequests);
router.get("/users/:userId/withdrawals", getUserWithdrawalRequests);
router.put("/verify-user/:userId", verifyUser);

export default router;
