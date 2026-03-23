import { Router } from "express";
const router = Router();
import {
    addSingleProduct,
    getProductById,
    getProductList,
    getProductPricing,
    deleteProduct,
    updateProduct,
} from "../controllers/productController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { productImages } from "../utils/uploadHandler.js";

router.post("/addSingleProduct", validateAccessToken, authorizeRoles(0, 2), productImages, addSingleProduct);
router.get("/getProduct/:id", validateAccessToken, getProductById);
router.get("/getProductPricing/:id", validateAccessToken, getProductPricing);
router.get("/getProductList", validateAccessToken, getProductList);
router.delete("/deleteProduct/:id", validateAccessToken, authorizeRoles(0, 2), deleteProduct);
router.put("/updateProduct/:id", validateAccessToken, authorizeRoles(0, 2), productImages, updateProduct);

export default router;