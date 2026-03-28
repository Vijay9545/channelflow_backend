import { Router } from "express";
const router = Router();
import {
    onboardUser,
    getUser,
    updateUser,
    getAllUser,
    serverNotSleep,
    testFirebase,
    login,
    register,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from "../controllers/userController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

router.post("/onboardUser", onboardUser);
router.post("/login", login);
router.post("/register", validateAccessToken, authorizeRoles(0), register);
router.get("/getUser", validateAccessToken, getUser);
router.put("/updateUser", validateAccessToken, updateUser);
router.post("/address", validateAccessToken, addAddress);
router.put("/address/:id", validateAccessToken, updateAddress);
router.delete("/address/:id", validateAccessToken, deleteAddress);
router.patch("/address/:id/default", validateAccessToken, setDefaultAddress);
router.get("/getAllUser", validateAccessToken, authorizeRoles(0), getAllUser);
router.get("/serverNotSleep", serverNotSleep);
router.get("/test-firebase", testFirebase);

export default router;