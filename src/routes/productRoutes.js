import { Router } from "express";
const router = Router();
import {
    addSingleProduct,
    getProductById,
    getProductList,
    getProductPricing,
} from "../controllers/productController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/addSingleProduct", validateAccessToken, authorizeRoles(0, 2), addSingleProduct);
router.get("/getProduct/:id", validateAccessToken, getProductById);
router.get("/getProductPricing/:id", validateAccessToken, getProductPricing);
router.get("/getProductList", validateAccessToken, getProductList);

export default router;