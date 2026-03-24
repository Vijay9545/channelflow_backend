import {
    pincodeModel, pincodeValidation, idValidation
} from "../models/pincodeModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";

const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function addPincode(req, res) {
    const { pincode, city, state, isActive } = req.body;
    const { error } = pincodeValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const existsPincode = await pincodeModel.findOne({ pincode, isDelete: false });
        if (existsPincode) {
            return response.error(res, resStatusCode.FORBIDDEN, "Pincode already exists");
        };
        const newPincode = await pincodeModel.create({ pincode, city, state, isActive, isDelete: false });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, newPincode);
    } catch (error) {
        console.error("addPincode Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getPincodeById(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const pincode = await pincodeModel.findOne({ _id: id, isDelete: false });
        if (!pincode) {
            return response.error(res, resStatusCode.NOT_FOUND, "Pincode not found");
        }
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, pincode);
    } catch (error) {
        console.error("getPincodeById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getPincodeList(req, res) {
    try {
        const pincodes = await pincodeModel.find({ isDelete: false });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, pincodes);
    } catch (error) {
        console.error("getPincodeList Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function updatePincodeById(req, res) {
    const { id } = req.params;
    const { pincode, city, state, isActive } = req.body;
    try {
        const { error } = idValidation.validate({ id });
        if (error) {
            return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
        };
        const updatedPincode = await pincodeModel.findOneAndUpdate({ _id: id, isDelete: false }, {
            $set: { pincode, city, state, isActive }
        }, { new: true, runValidators: true });

        if (!updatedPincode) {
            return response.error(res, resStatusCode.NOT_FOUND, "Pincode not found");
        }

        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, updatedPincode);
    } catch (error) {
        console.error("updatePincodeById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function deletePincode(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }
    try {
        const pincode = await pincodeModel.findOneAndUpdate(
            { _id: id, isDelete: false },
            { isDelete: true, isActive: false },
            { new: true }
        );
        if (!pincode) {
            return response.error(res, resStatusCode.NOT_FOUND, "Pincode not found");
        }
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Pincode deleted successfully", pincode);
    } catch (err) {
        console.error("deletePincode Error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export async function checkPincodeServiceability(req, res) {
    const { pincode } = req.body;
    if (!pincode) {
        return response.error(res, resStatusCode.CLIENT_ERROR, "Pincode is required");
    }
    try {
        const data = await pincodeModel.findOne({ pincode, isActive: true, isDelete: false });
        if (data) {
            return response.success(res, resStatusCode.ACTION_COMPLETE, "Pincode is serviceable", { serviceable: true, city: data.city, state: data.state });
        } else {
            return response.success(res, resStatusCode.ACTION_COMPLETE, "Pincode is not serviceable", { serviceable: false });
        }
    } catch (error) {
        console.error("checkPincodeServiceability Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
}
