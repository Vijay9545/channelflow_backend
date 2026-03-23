import { Router } from "express";
const router = Router();
import {
    addSubCategory,
    getSubCategoryById,
    getSubCategoryList,
    updateSubCategoryById,
    deleteSubCategory,
} from "../controllers/subCategoryController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/addSubCategory", validateAccessToken, authorizeRoles(0), addSubCategory);
router.get("/getSubCategory/:id", validateAccessToken, getSubCategoryById);
router.get("/getSubCategoryList", validateAccessToken, getSubCategoryList);
router.put("/updateSubCategory/:id", validateAccessToken, authorizeRoles(0), updateSubCategoryById);
router.delete("/deleteSubCategory/:id", validateAccessToken, authorizeRoles(0), deleteSubCategory);

export default router;