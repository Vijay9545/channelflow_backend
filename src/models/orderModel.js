import Joi from "joi";
import mongoose, { Schema, model, Types } from "mongoose";
import { dbTableName } from "../utils/constants.js";

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: Types.ObjectId, ref: dbTableName.PRODUCT, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        finalPrice: { type: Number, required: true },
        type: { type: String, required: true },
        title: { type: String, default: "" },
    }, { _id: false },
);
const orderSchema = new Schema(
    {
        orderId: { type: String, required: true },
        userId: { type: Types.ObjectId, ref: dbTableName.USER, required: true },
        name: { type: String, required: true },
        company: { type: String, default: "" },
        mobile: { type: String, required: true },
        gst: { type: String, default: "" },
        deliveryAddress: { type: String, required: true },
        businessAddress: { type: String, default: "" },
        pincode: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        order: { type: [orderItemSchema], required: true },
        rewardPoints: { type: Number, default: 0 },
        usePoint: { type: Number, default: 0 },
        shippingFee: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        subtotal: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        pointsRedeemed: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "" },
        paymentId: { type: String, default: "" },
        paymentStatus: { type: String, default: "PENDING" },
        shiprocketOrderId: { type: String, default: null },
        shiprocketShipmentId: { type: String, default: null },
        estimatedDelivery: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    }, { timestamps: true },
);
export const orderModel = model(dbTableName.ORDER, orderSchema);

export const orderValidation = Joi.object({
    name: Joi.string().trim().min(2).max(100).required().messages({
        "any.required": "Name is required",
        "string.empty": "Name cannot be empty",
        "string.min": "Name must be at least 2 characters",
        "string.max": "Name cannot exceed 100 characters",
    }),
    company: Joi.string().trim().optional().max(150).messages({
        "string.base": "Company must be a string",
        "string.max": "Company name cannot exceed 150 characters",
    }),
    mobile: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages({
        "any.required": "Mobile number is required",
        "string.empty": "Mobile number cannot be empty",
        "string.pattern.base": "Mobile number must be 10-15 digits (e.g., 9876543210, +919876543210)",
    }),
    gst: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).allow("").messages({
        "string.pattern.base": "GST number must be a valid GSTIN (e.g., 22AAAAA0000A1Z5)",
    }),
    deliveryAddress: Joi.string().required().max(250).messages({
        "any.required": "Delivery Address is required",
        "string.empty": "Delivery Address cannot be empty",
        "string.base": "Delivery Address must be a string",
        "string.max": "Delivery Address cannot exceed 250 characters",
    }),
    businessAddress: Joi.string().optional().allow("").max(250).messages({
        "string.base": "Business Address must be a string",
        "string.max": "Business Address cannot exceed 250 characters",
    }),
    pincode: Joi.string().length(6).required().messages({
        "any.required": "Pincode is required",
        "string.empty": "Pincode cannot be empty",
        "string.length": "Pincode must be 6 digits",
    }),
    city: Joi.string().required().messages({
        "any.required": "City is required",
        "string.empty": "City cannot be empty",
    }),
    state: Joi.string().required().messages({
        "any.required": "State is required",
        "string.empty": "State cannot be empty",
    }),
    totalAmount: Joi.number().min(0).optional().messages({
        "any.required": "Total amount is required",
        "number.base": "Total amount must be a number",
        "number.min": "Total amount cannot be negative",
    }),
    subtotal: Joi.number().min(0).optional().messages({
        "number.base": "Subtotal must be a number",
        "number.min": "Subtotal cannot be negative",
    }),
    shippingFee: Joi.number().min(0).optional().messages({
        "number.base": "Shipping fee must be a number",
        "number.min": "Shipping fee cannot be negative",
    }),
    taxAmount: Joi.number().min(0).optional().messages({
        "number.base": "Tax amount must be a number",
        "number.min": "Tax amount cannot be negative",
    }),
    tax: Joi.number().min(0).optional().messages({
        "number.base": "Tax must be a number",
        "number.min": "Tax cannot be negative",
    }),
    usePoint: Joi.number().optional().messages({
        "number.base": "Use Point must be a number",
    }),
    pointsRedeemed: Joi.number().optional().messages({
        "number.base": "Points redeemed must be a number",
    }),
    paymentMethod: Joi.string().optional().allow("").messages({
        "string.base": "Payment method must be a string",
    }),
    paymentId: Joi.string().optional().allow("").messages({
        "string.base": "Payment ID must be a string",
    }),
    paymentStatus: Joi.string().optional().allow("").messages({
        "string.base": "Payment status must be a string",
    }),
    estimatedDelivery: Joi.string().optional().allow("").messages({
        "string.base": "Estimated delivery must be a string",
    }),
    order: Joi.array().items(
        Joi.object({
            productId: Joi.string().length(24).hex().required().messages({
                "any.required": "Product ID is required",
                "string.empty": "Product ID cannot be empty",
                "string.length": "Product ID must be exactly 24 characters",
                "string.hex": "Product ID must be a valid ObjectId",
            }),
            qty: Joi.number().integer().min(1).required().messages({
                "any.required": "Quantity is required",
                "number.base": "Quantity must be a number",
                "number.min": "Quantity must be at least 1",
            }),
            price: Joi.number().positive().required().messages({
                "any.required": "Price is required",
                "number.base": "Price must be a number",
                "number.positive": "Price must be greater than 0",
            }),
            finalPrice: Joi.number().positive().optional().messages({
                "any.required": "Final Price is required",
                "number.base": "Final Price must be a number",
                "number.positive": "Final Price must be greater than 0",
            }),
            type: Joi.string().required().messages({
                "any.required": "Type is required",
                "string.base": "Type must be a string",
            }),
            title: Joi.string().optional().allow("").messages({
                "string.base": "Title must be a string",
            }),
        }),
    ),
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

export const getCartValidation = Joi.object({
    type: Joi.string().valid("customer", "retailer", "distributor").required().messages({
        "any.required": "type is required",
        "string.base": "type must be a string",
        "any.only": "type must be one of [customer, retailer, distributor]"
    }),
});
