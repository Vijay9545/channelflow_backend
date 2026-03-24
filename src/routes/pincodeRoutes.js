import express from "express";
import {
    addPincode,
    getPincodeById,
    getPincodeList,
    updatePincodeById,
    deletePincode,
    checkPincodeServiceability
} from "../controllers/pincodeController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";

const pincodeRouter = express.Router();

pincodeRouter.post("/addPincode", validateAccessToken, authorizeRoles(0, 2), addPincode);
pincodeRouter.get("/getPincodeById/:id", validateAccessToken, authorizeRoles(0, 2), getPincodeById);
pincodeRouter.get("/getPincodeList", getPincodeList);
pincodeRouter.put("/updatePincodeById/:id", validateAccessToken, authorizeRoles(0, 2), updatePincodeById);
pincodeRouter.delete("/deletePincode/:id", validateAccessToken, authorizeRoles(0, 2), deletePincode);
pincodeRouter.post("/checkServiceability", checkPincodeServiceability);

export default pincodeRouter;
