import express from "express";
import profileUpload from "../middleware/profileUpload.js";
import { saveProfile } from "../controllers/profile.controller.js";

const router = express.Router();

router.post(
  "/save",
  profileUpload.fields([
    { name: "panDocument", maxCount: 1 },
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  saveProfile
);

export default router;
