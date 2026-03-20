import { Router } from "express";
const router = Router();
import {
    addCategory,
    getCategoryById,
    getCategoryList,
    updateCategoryById,
} from "../controllers/categoryController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/addCategory", validateAccessToken, authorizeRoles(0), addCategory);
router.get("/getCategory/:id", validateAccessToken, getCategoryById);
router.get("/getCategoryList", validateAccessToken, getCategoryList);
router.put("/updateCategory/:id", validateAccessToken, authorizeRoles(0), updateCategoryById);

export default router;