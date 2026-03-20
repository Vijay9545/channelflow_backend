'use strict'
import { Router } from "express";
import user from "./userRoutes.js";
import category from "./categoryRoutes.js";
import subCategory from "./subCategoryRoutes.js";
import product from "./productRoutes.js";
import cart from "./cartRoutes.js";
import order from "./orderRoutes.js";
import reward from "./rewardRoutes.js";

const router = Router();

router.use("/user", user);
router.use("/category", category);
router.use("/sub-category", subCategory);
router.use("/product", product);
router.use("/cart", cart);
router.use("/order", order);
router.use("/reward", reward);

export default router;