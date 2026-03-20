import Joi from 'joi';
import { Schema, model, Types } from 'mongoose';
import { dbTableName } from "../utils/constants.js"

const subCategorySchema = new Schema(
    {
        name: { type: String, required: true },
        categoryId: { type: Types.ObjectId, ref: dbTableName.CATEGORY, required: true },
        isActive: { type: Boolean, default: true },
    }, { timestamps: true }
);
export const subCategoryModel = model(dbTableName.SUB_CATEGORY, subCategorySchema);

export const subCategoryValidation = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
        'string.base': 'Category Name must be a text value.',
        'string.empty': 'Category Name is required and cannot be empty.',
        'string.min': 'Category Name must be at least 3 characters long.',
        'string.max': 'Category Name cannot be longer than 100 characters.',
        'any.required': 'Category Name is required.'
    }),
    categoryId: Joi.string().required().messages({
        "string.base": "Category ID must be a valid ID.",
        "string.empty": "Category ID is required.",
        "any.required": "Category ID is required."
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
