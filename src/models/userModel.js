import Joi from "joi";
import { model, Schema } from "mongoose";
import { dbTableName } from "../utils/constants.js"

export const userValidation = Joi.object({
    idToken: Joi.string().messages({
        "string.empty": "idToken is required",
    }),
    email: Joi.string().email().lowercase(),
    password: Joi.string().min(6),
    name: Joi.string(),
    company: Joi.string(),
    mobile: Joi.string(),
    deliveryAddress: Joi.string(),
    businessAddress: Joi.string(),
    pincode: Joi.string().length(6),
    city: Joi.string(),
    state: Joi.string(),
    role: Joi.number().valid(0, 1, 2, 3, 4),
});

export const loginValidation = Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
});

const userSchema = new Schema(
    {
        uId: { type: Number, unique: true, required: true },
        name: { type: String, default: "" },
        email: { type: String, unique: true, sparse: true },
        password: { type: String },
        company: { type: String, default: "" },
        mobile: { type: String, required: true },
        deliveryAddress: { type: String, default: "" },
        businessAddress: { type: String, default: "" },
        pincode: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        rewardPoints: { type: Number },
        role: { type: Number, default: 1 }, // 0: Super Admin, 1: User, 2: Product Manager, 3: Order Manager
        isActive: { type: Boolean, default: true },
    }, { timestamps: true },
);
export const userModel = model(dbTableName.USER, userSchema);

