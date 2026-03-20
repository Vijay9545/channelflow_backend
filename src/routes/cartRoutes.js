import { Router } from "express";
const router = Router();
import {
    addToCart,
    getCart,
    deleteCart
} from "../controllers/cartController.js";
import { validateAccessToken } from "../middleware/auth.js";

router.post("/addToCart", validateAccessToken, addToCart);
router.get("/getCart", validateAccessToken, getCart);
router.delete("/deleteCart", validateAccessToken, deleteCart);

export default router;