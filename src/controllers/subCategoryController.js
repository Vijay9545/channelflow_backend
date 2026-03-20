import {
    subCategoryModel, subCategoryValidation, idValidation
} from "../models/subCategoryModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function addSubCategory(req, res) {
    const { name, categoryId } = req.body;
    const { error } = subCategoryValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const existsSubCategory = await subCategoryModel.findOne({ name, categoryId });
        if (existsSubCategory) {
            return response.error(res, resStatusCode.FORBIDDEN, resMessage.CONFLICT_FOUND);
        };
        const newSubCategory = await subCategoryModel.create({ name, categoryId });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, newSubCategory);
    } catch (error) {
        console.error("addSubCategory Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getSubCategoryById(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const subCategory = await subCategoryModel.findById(id).populate('categoryId');
        const formattedData = {
            ...subCategory.toObject(),
            categoryId: subCategory?.categoryId._id,
            categoryName: subCategory?.categoryId.name,
        };
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, formattedData);
    } catch (error) {
        console.error("getSubCategoryById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getSubCategoryList(req, res) {
    try {
        const subCategory = await subCategoryModel.find({ isActive: true }).populate('categoryId').lean();
        const formattedData = subCategory.map(subCat => ({
            ...subCat,
            categoryId: subCat?.categoryId._id,
            categoryName: subCat?.categoryId.name,
        }));
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, formattedData);
    } catch (error) {
        console.error("getSubCategoryList Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function updateSubCategoryById(req, res) {
    const { id } = req.params;
    const { name, categoryId, isActive } = req.body;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        await subCategoryModel.findByIdAndUpdate(id, {
            $set: { name, categoryId, isActive }
        }, { new: false, runValidators: true });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE);
    } catch (error) {
        console.error("updateSubCategoryById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};