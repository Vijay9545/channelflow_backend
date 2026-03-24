import Joi from "joi";
import { model, Schema } from "mongoose";
import { dbTableName } from "../utils/constants.js";

const pincodeSchema = new Schema(
    {
        pincode: { type: String, required: true, unique: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        isDelete: { type: Boolean, default: false },
    }, { timestamps: true }
);

export const pincodeModel = model(dbTableName.PINCODE, pincodeSchema);

export const pincodeValidation = Joi.object({
    pincode: Joi.string().length(6).required().messages({
        "string.empty": "Pincode is required",
        "string.length": "Pincode must be 6 digits",
    }),
    city: Joi.string().required().messages({
        "string.empty": "City is required",
    }),
    state: Joi.string().required().messages({
        "string.empty": "State is required",
    }),
    isActive: Joi.boolean(),
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
