import {
    categoryModel, categoryValidation, idValidation
} from "../models/categoryModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function addCategory(req, res) {
    const { name } = req.body;
    const { error } = categoryValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const existsCategory = await categoryModel.findOne({ name });
        if (existsCategory) {
            return response.error(res, resStatusCode.FORBIDDEN, resMessage.CONFLICT_FOUND);
        };
        const newCategory = await categoryModel.create({ name });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, newCategory);
    } catch (error) {
        console.error("addCategory Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getCategoryById(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const category = await categoryModel.findById(id);
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, category);
    } catch (error) {
        console.error("getCategoryById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getCategoryList(req, res) {
    try {
        const category = await categoryModel.find({ isActive: true });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, category);
    } catch (error) {
        console.error("getCategoryList Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function updateCategoryById(req, res) {
    const { id } = req.params;
    const { name, isActive } = req.body;
    try {
        const { error } = idValidation.validate({ id });
        if (error) {
            return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
        };
        await categoryModel.findByIdAndUpdate(id, {
            $set: { name, isActive }
        }, { new: false, runValidators: true });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE);
    } catch (error) {
        console.error("updateCategoryById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};