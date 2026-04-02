import { Router } from "express";
const router = Router();
import {
    getPromoPopup,
    updatePromoPopup
} from "../controllers/promotionController.js";
import { validateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { createS3Uploader } from "../utils/uploadHandler.js";

const promoImage = createS3Uploader({
    folderName: 'promotions',
    filePrefix: 'promo',
    fieldType: 'single',
    fieldName: 'image',
    fileSizeMB: 5, // 5MB limit
});

// GET endpoint (Public)
router.get("/popup", getPromoPopup);

// Admin endpoint to configure the popup
router.post("/popup", validateAccessToken, authorizeRoles(0), promoImage, updatePromoPopup);

export default router;
