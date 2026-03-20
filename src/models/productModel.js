import Joi from "joi";
import mongoose, { model, Schema, Types } from "mongoose";
import { dbTableName } from "../utils/constants.js"

const variantSchema = new mongoose.Schema({
    _id: false,
    distributor: {
        _id: false,
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
        miniOrderQty: { type: Number, required: true },
    },
    retailer: {
        _id: false,
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
        miniOrderQty: { type: Number, required: true },
    },
    customer: {
        _id: false,
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        mrp: { type: Number, required: true },
        miniOrderQty: { type: Number, required: true },
    },
});

const tierSchema = new mongoose.Schema({
    minQty: { type: Number, required: true },
    price: { type: Number, required: true },
}, { _id: false });

const productSchema = new Schema(
    {
        title: { type: String, require: true },
        mainImage: { type: String, require: true },
        variants: variantSchema,
        priceTiers: { type: [tierSchema], default: [] },
        subCategoryId: { type: Types.ObjectId, ref: dbTableName.SUB_CATEGORY, required: true },
        sku: { type: String, require: true, unique: true },
        hsnCode: { type: String, default: "" },
        gst: { type: String, default: "" },
        isDelete: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    }, { timestamps: true },
);
export const productModel = model(dbTableName.PRODUCT, productSchema);

const variantObj = Joi.object({
    qty: Joi.number().required().messages({
        "any.required": "Quantity is required",
        "number.base": "Quantity must be a number",
    }),
    price: Joi.number().required().messages({
        "any.required": "Price is required",
        "number.base": "Price must be a number",
    }),
    mrp: Joi.number().required().messages({
        "any.required": "MRP is required",
        "number.base": "MRP must be a number",
    }),
    miniOrderQty: Joi.number().required().messages({
        "any.required": "Minimum order quantity is required",
        "number.base": "Minimum order quantity must be a number",
    }),
});

const tierObj = Joi.object({
    minQty: Joi.number().min(1).required().messages({
        "any.required": "Minimum quantity is required",
        "number.base": "Minimum quantity must be a number",
        "number.min": "Minimum quantity must be at least 1",
    }),
    price: Joi.number().min(0).required().messages({
        "any.required": "Tier price is required",
        "number.base": "Tier price must be a number",
        "number.min": "Tier price cannot be negative",
    }),
});

export const productValidation = Joi.object({
    title: Joi.string().trim().required().messages({
        "any.required": "Product title is required",
        "string.base": "Product title must be a string",
        "string.empty": "Product title cannot be empty",
    }),
    mainImage: Joi.string().uri().required().messages({
        "any.required": "Main image is required",
        "string.uri": "Main image must be a valid URL",
        "string.empty": "Main image cannot be empty",
    }),
    variants: Joi.object({
        distributor: variantObj.required().messages({
            "any.required": "Distributor details are required",
        }),
        retailer: variantObj.required().messages({
            "any.required": "Retailer details are required",
        }),
        customer: variantObj.required().messages({
            "any.required": "Customer details are required",
        }),
    }).required().messages({
        "any.required": "Variants are required",
    }),
    subCategoryId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
        "any.required": "Sub-category ID is required",
        "string.pattern.base": "Sub-category ID must be a valid MongoDB ObjectId",
    }),
    sku: Joi.string().trim().required().messages({
        "any.required": "SKU is required",
        "string.empty": "SKU cannot be empty",
    }),
    hsnCode: Joi.string().allow("").messages({
        "string.base": "HSN Code must be a string",
    }),
    gst: Joi.string().allow("").messages({
        "string.base": "GST must be a string",
    }),
    priceTiers: Joi.array().items(tierObj).default([]).messages({
        "array.base": "Price tiers must be an array"
    }),
});

export const idValidation = Joi.object({
    id: Joi.string().length(24).hex().required().messages({
        "string.base": "ID must be a string",
        "string.empty": "ID is required",
        "string.length": "ID must be exactly 24 characters",
        "string.hex": "ID must be a valid hexadecimal string",
        "any.required": "ID is required",
    }),
});