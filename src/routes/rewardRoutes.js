import { Router } from "express";
const router = Router();
import {
    addRewardPoint,
    getAllRewardPoint,
    getRewardPointById,
    updateRewardPoint,
    inactiveRewardPoint
} from "../controllers/rewardController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/addRewardPoint", validateAccessToken, authorizeRoles(0), addRewardPoint);
router.get("/getAllRewardPoint", validateAccessToken, authorizeRoles(0), getAllRewardPoint);
router.get("/getRewardPointById/:id", validateAccessToken, authorizeRoles(0), getRewardPointById);
router.put("/updateRewardPoint/:id", validateAccessToken, authorizeRoles(0), updateRewardPoint);
router.put("/inactiveRewardPoint/:id", validateAccessToken, authorizeRoles(0), inactiveRewardPoint);

export default router;