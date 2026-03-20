import {
    rewardModel, rewardValidation, idValidation
} from "../models/rewardModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function addRewardPoint(req, res) {
    const { fromDate, toDate, point } = req.body;
    const { error } = rewardValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const newRewardPoint = await rewardModel.create({ fromDate, toDate, point });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, newRewardPoint);
    } catch (error) {
        console.error("addRewardPoint Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getAllRewardPoint(req, res) {
    try {
        const reward = await rewardModel.find().lean();
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, reward);
    } catch (error) {
        console.error("getAllRewardPoint Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getRewardPointById(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const reward = await rewardModel.findById({ _id: id });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, reward);
    } catch (error) {
        console.error("getRewardPointById Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function updateRewardPoint(req, res) {
    let { id } = req.params;
    const { fromDate, toDate, point, isActive } = req.body;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        await rewardModel.findByIdAndUpdate(id, {
            $set: {
                fromDate,
                toDate,
                point,
                isActive,
            },
        }, { new: true, runValidators: true });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE);
    } catch (error) {
        console.error("updateRewardPoint Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function inactiveRewardPoint(req, res) {
    let { id } = req.params;
    const { isActive } = req.body;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        await rewardModel.findByIdAndUpdate(id, {
            $set: {
                isActive,
            },
        }, { new: true, runValidators: true });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE);
    } catch (error) {
        console.error("inactiveRewardPoint Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};