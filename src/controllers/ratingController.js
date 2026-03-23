import { ratingModel, ratingValidation } from "../models/ratingModel.js";
import { productModel } from "../models/productModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";

const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export const addRating = async (req, res) => {
    const userId = req?.user?._id;
    const { productId, rating, review, userName } = req.body;

    const { error } = ratingValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }

    try {
        const product = await productModel.findById(productId);
        if (!product) {
            return response.error(res, resStatusCode.NOT_FOUND, "Product not found");
        }

        let existingRating = await ratingModel.findOne({ productId, userId });

        if (existingRating) {
            existingRating.rating = rating;
            existingRating.review = review || existingRating.review;
            existingRating.userName = userName || existingRating.userName;
            await existingRating.save();
            return response.success(res, resStatusCode.ACTION_COMPLETE, "Rating updated successfully", existingRating);
        } else {
            const newRating = await ratingModel.create({
                productId,
                userId,
                rating,
                review,
                userName
            });
            return response.success(res, resStatusCode.CREATED, "Rating added successfully", newRating);
        }
    } catch (error) {
        console.error("addRating Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const getProductRatings = async (req, res) => {
    const { productId } = req.params;

    try {
        const ratings = await ratingModel.find({ productId }).sort({ createdAt: -1 });
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Ratings retrieved successfully", ratings);
    } catch (error) {
        console.error("getProductRatings Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const deleteRating = async (req, res) => {
    const { ratingId } = req.params;
    const userId = req?.user?._id;
    const userRole = req?.user?.role;

    try {
        const rating = await ratingModel.findById(ratingId);
        if (!rating) {
            return response.error(res, resStatusCode.NOT_FOUND, "Rating not found");
        }

        // Allow deletion if owner or admin (assuming role 0 is super admin)
        if (rating.userId.toString() !== userId.toString() && userRole !== 0) {
            return response.error(res, resStatusCode.FORBIDDEN, resMessage.UNAUTHORIZED);
        }

        await ratingModel.findByIdAndDelete(ratingId);
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Rating deleted successfully");
    } catch (error) {
        console.error("deleteRating Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};
