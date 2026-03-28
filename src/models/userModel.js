import Joi from "joi";
import { model, Schema } from "mongoose";
import { dbTableName } from "../utils/constants.js"

export const addressValidation = Joi.object({
    name: Joi.string().required().min(2).max(100),
    mobile: Joi.string().pattern(/^\+?\d{10,15}$/).required(),
    pincode: Joi.string().length(6).required(),
    locality: Joi.string().required(),
    addressLine: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    landmark: Joi.string().optional().allow(""),
    addressType: Joi.string().valid("Home", "Work").default("Home"),
    isDefault: Joi.boolean().default(false),
});

export const userValidation = Joi.object({
    idToken: Joi.string().messages({
        "string.empty": "idToken is required",
    }),
    email: Joi.string().email().lowercase(),
    password: Joi.string().min(6),
    name: Joi.string(),
    company: Joi.string(),
    mobile: Joi.string(),
    deliveryAddress: addressValidation.optional(),
    businessAddress: addressValidation.optional(),
    addresses: Joi.array().items(addressValidation).optional(),
    pincode: Joi.string().length(6),
    city: Joi.string(),
    state: Joi.string(),
    role: Joi.number().valid(0, 1, 2, 3, 4),
});

export const loginValidation = Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
});

const AddressSchema = new Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    pincode: { type: String, required: true },
    locality: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    landmark: { type: String, default: "" },
    addressType: { type: String, enum: ["Home", "Work"], default: "Home" },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new Schema(
    {
        uId: { type: Number, unique: true, required: true },
        name: { type: String, default: "" },
        email: { type: String, unique: true, sparse: true },
        password: { type: String },
        company: { type: String, default: "" },
        mobile: { type: String, required: true },
        addresses: [AddressSchema],
        deliveryAddress: { type: AddressSchema, default: null },
        businessAddress: { type: AddressSchema, default: null },
        pincode: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        rewardPoints: { type: Number, default: 0 },
        role: { type: Number, default: 1 }, // 0: Super Admin, 1: User, 2: Product Manager, 3: Order Manager
        isActive: { type: Boolean, default: true },
    }, { timestamps: true },
);
export const userModel = model(dbTableName.USER, userSchema);

