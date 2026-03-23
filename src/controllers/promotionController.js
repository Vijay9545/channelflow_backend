import { promotionModel } from "../models/promotionModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";

// @desc    Get sale popup info
// @route   GET /api/promotions/popup
export const getPromoPopup = async (req, res) => {
    try {
        const promo = await promotionModel.findOne({});
        
        if (promo && promo.active) {
            return res.status(resStatusCode.ACTION_COMPLETE).json({
                active: true,
                imageUrl: promo.imageUrl,
                targetScreen: promo.targetScreen
            });
        }

        return res.status(resStatusCode.ACTION_COMPLETE).json({
            active: false
        });

    } catch (error) {
        console.error("Error fetching promotion popup:", error);
        return response.error(res, resStatusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR, error);
    }
};

// @desc    Create or update sale popup info
// @route   POST /api/promotions/popup
export const updatePromoPopup = async (req, res) => {
    try {
        const { active, targetScreen } = req.body;
        
        let imageUrl = req.body.imageUrl;
        // Handle image upload if a new file is provided
        if (req.uploadedImages && req.uploadedImages.length > 0) {
            imageUrl = req.uploadedImages[0].s3Url;
        }

        let promo = await promotionModel.findOne({});

        if (promo) {
            // Update existing
            promo.active = active !== undefined ? active : promo.active;
            promo.imageUrl = imageUrl || promo.imageUrl;
            promo.targetScreen = targetScreen || promo.targetScreen;
            await promo.save();
        } else {
            // Create new
            if (!imageUrl || !targetScreen) {
                return response.error(res, resStatusCode.CLIENT_ERROR, "Image and targetScreen are required for initial setup", {});
            }
            promo = new promotionModel({
                active: active !== undefined ? active : false,
                imageUrl,
                targetScreen
            });
            await promo.save();
        }

        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, promo);

    } catch (error) {
        console.error("Error updating promotion popup:", error);
        return response.error(res, resStatusCode.INTERNAL_SERVER_ERROR, resMessage.INTERNAL_SERVER_ERROR, error);
    }
};
