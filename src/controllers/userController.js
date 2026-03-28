import { userModel, userValidation, loginValidation, addressValidation } from "../models/userModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";
import admin from "../../config/firebase.js";
import { generateJWToken } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export const onboardUser = async (req, res) => {
    const { idToken } = req.body;
    const { error } = userValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const mobile = decodedToken?.phone_number;
        if (!mobile) {
            return response.error(res, resStatusCode.CLIENT_ERROR, resMessage.MOBILE_NO, {});
        };
        let user = await userModel.findOne({ mobile });
        if (!user) {
            const lastUser = await userModel.findOne().sort({ uId: -1 }).exec();
            const newUId = (lastUser?.uId || 0) + 1;
            user = await userModel.create({ mobile, uId: newUId });
        };
        const token = await generateJWToken({ _id: user._id, role: user.role });
        const resData = {
            ...user.toObject(),
            token,
        };
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ONBOARD_USER, resData);
    } catch (error) {
        console.error("onboardUser Error : ", error);
        let message = resMessage.TOKEN_INVALID;
        let status = resStatusCode.UNAUTHORIZED;

        if (error?.code === "auth/id-token-expired") {
            message = resMessage.TOKEN_EXPIRED;
        } else if (error?.code === "auth/argument-error") {
            message = resMessage.NO_TOKEN_PROVIDED
        } else {
            status = SERVER_ERROR_STATUS;
            message = SERVER_ERROR_MESSAGE;
        };
        return response.error(res, status, message);
    };
};

export const getUser = async (req, res) => {
    const userId = req?.user?._id.toString();
    try {
        const user = await userModel.findById({ _id: userId }).select('-role');
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, user);
    } catch (error) {
        console.error("getUser Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export const updateUser = async (req, res) => {
    const id = req?.user?._id.toString();
    const userData = req.body;
    try {
        const updatedUser = await userModel.findByIdAndUpdate(id, {
            $set: userData
        }, { new: true, runValidators: true });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, updatedUser);
    } catch (error) {
        console.error("updateUser Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export const addAddress = async (req, res) => {
    const userId = req.user._id;
    const { error, value } = addressValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return response.error(res, resStatusCode.NOT_FOUND, "User not found");
        }

        if (value.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        } else if (user.addresses.length === 0) {
            value.isDefault = true;
        }

        user.addresses.push(value);
        await user.save();

        return response.success(res, resStatusCode.ACTION_COMPLETE, "Address added successfully", user.addresses[user.addresses.length - 1]);
    } catch (err) {
        console.error("addAddress error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const updateAddress = async (req, res) => {
    const userId = req.user._id;
    const { id: addressId } = req.params;
    const { error, value } = addressValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return response.error(res, resStatusCode.NOT_FOUND, "User not found");
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return response.error(res, resStatusCode.NOT_FOUND, "Address not found");
        }

        if (value.isDefault && !address.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        Object.assign(address, value);
        await user.save();

        return response.success(res, resStatusCode.ACTION_COMPLETE, "Address updated successfully", address);
    } catch (err) {
        console.error("updateAddress error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const deleteAddress = async (req, res) => {
    const userId = req.user._id;
    const { id: addressId } = req.params;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return response.error(res, resStatusCode.NOT_FOUND, "User not found");
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return response.error(res, resStatusCode.NOT_FOUND, "Address not found");
        }

        const wasDefault = address.isDefault;
        user.addresses.pull(addressId);

        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Address deleted successfully");
    } catch (err) {
        console.error("deleteAddress error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const setDefaultAddress = async (req, res) => {
    const userId = req.user._id;
    const { id: addressId } = req.params;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return response.error(res, resStatusCode.NOT_FOUND, "User not found");
        }

        let addressFound = false;
        user.addresses.forEach(addr => {
            if (addr._id.toString() === addressId) {
                addr.isDefault = true;
                addressFound = true;
            } else {
                addr.isDefault = false;
            }
        });

        if (!addressFound) {
            return response.error(res, resStatusCode.NOT_FOUND, "Address not found");
        }

        await user.save();
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Default address updated", user.addresses);
    } catch (err) {
        console.error("setDefaultAddress error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const getAllUser = async (req, res) => {
    try {
        const user = await userModel.find().select('-role');
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, user);
    } catch (error) {
        console.error("getUser Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export const testFirebase = async (req, res) => {
    try {
        const appName = admin.app().name;
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Firebase is working properly", { appName });
    } catch (error) {
        console.error("testFirebase Error: ", error);
        return response.error(res, SERVER_ERROR_STATUS, "Firebase initialization check failed");
    };
};

export const serverNotSleep = async (req, res) => {
    try {
        const data = { working: true };
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, data);
    } catch (error) {
        console.error("serverNotSleep Error: ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export const register = async (req, res) => {
    const { email, password, role, name, mobile, company, deliveryAddress } = req.body;
    const { error } = userValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }
    try {
        const existsUser = await userModel.findOne({ email });
        if (existsUser) {
            return response.error(res, resStatusCode.FORBIDDEN, "User with this email already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const lastUser = await userModel.findOne().sort({ uId: -1 }).exec();
        const newUId = (lastUser?.uId || 0) + 1;

        const user = await userModel.create({
            email,
            password: hashedPassword,
            role: role || 1,
            name,
            mobile,
            company,
            deliveryAddress,
            uId: newUId
        });

        const token = await generateJWToken({ _id: user._id, role: user.role });
        return response.success(res, resStatusCode.CREATED, "Admin user created successfully", {
            userId: user._id,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        console.error("register Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const { error } = loginValidation.validate(req.body);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user || !user.password) {
            return response.error(res, resStatusCode.UNAUTHORIZED, "Invalid email or password");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response.error(res, resStatusCode.UNAUTHORIZED, "Invalid email or password");
        }
        const token = await generateJWToken({ _id: user._id, role: user.role });
        const resData = {
            ...user.toObject(),
            token
        };
        delete resData.password;
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Login successful", resData);
    } catch (error) {
        console.error("login Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};