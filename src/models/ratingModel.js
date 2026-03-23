import Joi from "joi";
import { model, Schema, Types } from "mongoose";
import { dbTableName } from "../utils/constants.js";

const ratingSchema = new Schema(
    {
        productId: { type: Types.ObjectId, ref: dbTableName.PRODUCT, required: true },
        userId: { type: Types.ObjectId, ref: dbTableName.USER, required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        review: { type: String, default: "" },
        userName: { type: String, default: "" },
    },
    { timestamps: true }
);

export const ratingModel = model(dbTableName.RATING, ratingSchema);

export const ratingValidation = Joi.object({
    productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
        "any.required": "Product ID is required",
        "string.pattern.base": "Product ID must be a valid MongoDB ObjectId",
    }),
    rating: Joi.number().min(1).max(5).required().messages({
        "any.required": "Rating is required",
        "number.min": "Rating must be at least 1",
        "number.max": "Rating cannot be more than 5",
    }),
    review: Joi.string().allow("").messages({
        "string.base": "Review must be a string",
    }),
    userName: Joi.string().allow("").messages({
        "string.base": "User name must be a string",
    }),
});
