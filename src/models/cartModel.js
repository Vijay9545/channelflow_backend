import Joi from "joi";
import mongoose, { Schema, model, Types } from "mongoose";
import { dbTableName } from "../utils/constants.js";

const customVariantSchema = new mongoose.Schema(
    {
        _id: false,
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
        miniOrderQty: { type: Number, required: true },
    }, { _id: false }
);

const cartSchema = new Schema(
    {
        userId: { type: Types.ObjectId, ref: dbTableName.USER, required: true },
        productId: { type: Types.ObjectId, ref: dbTableName.PRODUCT, required: true },
        distributor: { type: customVariantSchema, default: undefined },
        retailer: { type: customVariantSchema, default: undefined },
        customer: { type: customVariantSchema, default: undefined },
        qty: { type: Number, required: true },
        isActive: { type: Boolean, default: true },
    }, { timestamps: true },
);
export const cartModel = model(dbTableName.CART, cartSchema);

export const cartValidation = Joi.object({
    userId: Joi.string().length(24).hex().required().messages({
        "any.required": "User ID is required",
        "string.length": "User ID must be exactly 24 characters",
        "string.hex": "User ID must be a valid ObjectId",
    }),
    productId: Joi.string().length(24).hex().required().messages({
        "any.required": "Product ID is required",
        "string.length": "Product ID must be exactly 24 characters",
        "string.hex": "Product ID must be a valid ObjectId",
    }),
    qty: Joi.number().min(1).required().messages({
        "any.required": "Quantity is required",
        "number.base": "Quantity must be a number",
        "number.min": "Quantity must be at least 1",
    }),
    isUpdate: Joi.boolean().optional(),
    distributor: Joi.object({
        qty: Joi.number().min(1).required().messages({
            "any.required": "Distributor qty is required",
        }),
        price: Joi.number().min(0).optional().messages({
            "any.required": "Distributor price is required",
        }),
        mrp: Joi.number().min(0).optional().messages({
            "any.required": "Distributor MRP is required",
        }),
        miniOrderQty: Joi.number().optional().messages({
            "any.required": "Distributor mini Order Qty is required",
            "number.base": "Distributor mini Order Qty must be a number"
        }),
    }).optional(),
    retailer: Joi.object({
        qty: Joi.number().min(1).required().messages({
            "any.required": "Retailer qty is required",
        }),
        price: Joi.number().min(0).optional().messages({
            "any.required": "Retailer price is required",
        }),
        mrp: Joi.number().min(0).optional().messages({
            "any.required": "Retailer MRP is required",
        }),
        miniOrderQty: Joi.number().optional().messages({
            "any.required": "Retailer mini Order Qty is required",
            "number.base": "Retailer mini Order Qty must be a number"
        }),
    }).optional(),
    customer: Joi.object({
        qty: Joi.number().min(1).required().messages({
            "any.required": "Customer qty is required",
        }),
        price: Joi.number().min(0).optional().messages({
            "any.required": "Customer price is required",
        }),
        mrp: Joi.number().min(0).optional().messages({
            "any.required": "Customer MRP is required",
        }),
        miniOrderQty: Joi.number().optional().messages({
            "any.required": "Customer mini Order Qty is required",
            "number.base": "Customer mini Order Qty must be a number"
        }),
    }).optional(),
}).custom((obj, helpers) => {
    const fields = ["distributor", "retailer", "customer"];
    const filled = fields.filter((f) => obj[f] && Object.keys(obj[f]).length > 0);
    if (filled.length > 1) {
        return helpers.message("Only one of distributor, retailer, or customer is allowed");
    };
    if (filled.length === 0) {
        return helpers.message("At least one of distributor, retailer, or customer is required");
    };
    return obj;
});
export const deleteCartValidation = Joi.object({
    productId: Joi.string().length(24).hex().required().messages({
        "string.base": "productId must be a string",
        "string.empty": "productId is required",
        "string.length": "productId must be exactly 24 characters",
        "string.hex": "productId must be a valid hexadecimal string",
        "any.required": "productId is required",
    }),
});