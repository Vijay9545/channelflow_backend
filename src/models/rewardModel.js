import Joi from "joi";
import { Schema, model } from "mongoose";
import { dbTableName } from "../utils/constants.js";

const rewardSchema = new Schema(
    {
        point: { type: Number, require: true },
        fromDate: { type: Date, require: true },
        toDate: { type: Date, require: true },
        isActive: { type: Boolean, default: true },
    }, { timestamps: true },
);
export const rewardModel = model(dbTableName.REWARD, rewardSchema);

export const rewardValidation = Joi.object({
    point: Joi.number().required().messages({
        "number.base": "Point must be a number",
        "any.required": "Point is required",
    }),
    fromDate: Joi.date().required().messages({
        "date.base": "From Date must be a valid date",
        "any.required": "From Date is required",
    }),
    toDate: Joi.date().required().messages({
        "date.base": "To Date must be a valid date",
        "any.required": "To Date is required",
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


