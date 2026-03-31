import { Router } from "express";
const router = Router();
import {
    addRewardPoint,
    getAllRewardPoint,
    getRewardPointById,
    updateRewardPoint,
    inactiveRewardPoint,
    deleteRewardPoint,
    getActiveRewardPoint,
    calculateRewardPoints
} from "../controllers/rewardController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

// Admin Routes (Super Admin)
router.post("/addRewardPoint", validateAccessToken, authorizeRoles(0), addRewardPoint);
router.get("/getAllRewardPoint", validateAccessToken, authorizeRoles(0), getAllRewardPoint);
router.get("/getRewardPointById/:id", validateAccessToken, authorizeRoles(0), getRewardPointById);
router.put("/updateRewardPoint/:id", validateAccessToken, authorizeRoles(0), updateRewardPoint);
router.put("/inactiveRewardPoint/:id", validateAccessToken, authorizeRoles(0), inactiveRewardPoint);
router.delete("/deleteRewardPoint/:id", validateAccessToken, authorizeRoles(0), deleteRewardPoint);

// Public / User Routes (for calculation and viewing active rule)
router.get("/getActiveRewardPoint", getActiveRewardPoint);
router.post("/calculateRewardPoints", calculateRewardPoints);

export default router;