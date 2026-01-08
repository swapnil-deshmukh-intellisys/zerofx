import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const adminMiddleware = async (req, res, next) => {
  console.log(`🔐 Admin middleware called for: ${req.method} ${req.path}`);
  const token = req.headers.authorization?.split(" ")[1];
  console.log(`🔑 Token present: ${!!token}`);

  if (!token) {
    console.log("❌ No token provided for admin route");
    return res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      console.log("❌ User does not have admin role");
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admin privileges required." });
    }

    // Verify admin exists and is active
    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      console.log("❌ Admin user not found or inactive");
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admin account not found or inactive." });
    }

    req.user = decoded; // Save decoded user info for later use
    req.admin = admin; // Save admin data for later use
    next();
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};

export default adminMiddleware;
