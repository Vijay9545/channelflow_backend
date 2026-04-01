import { Router } from "express";
const router = Router();
import {
    placeOrder,
    getOrderList,
    getOrderById,
    getAllOrders,
    trackOrder,
    getShippingRate
} from "../controllers/orderController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/placeOrder", validateAccessToken, placeOrder);
router.get("/getShippingRate", validateAccessToken, getShippingRate);
router.get("/getOrderList", validateAccessToken, getOrderList);
router.get("/getAllOrders", validateAccessToken, authorizeRoles(0, 3), getAllOrders);
router.get("/getOrder/:id", validateAccessToken, getOrderById);
router.get("/track/:id", validateAccessToken, trackOrder);

export default router;