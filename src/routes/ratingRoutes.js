import { Router } from "express";
const router = Router();
import {
    addRating,
    getProductRatings,
    deleteRating,
} from "../controllers/ratingController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/add", validateAccessToken, addRating);
router.get("/product/:productId", getProductRatings);
router.delete("/:ratingId", validateAccessToken, deleteRating);

export default router;
