import {
    cartModel, cartValidation, deleteCartValidation
} from "../models/cartModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";
import { userModel } from "../models/userModel.js";
import { productModel } from "../models/productModel.js";
import { getPriceByQty } from "../utils/pricing.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function addToCart(req, res) {
    const userId = req.user?._id.toString();
    const { productId, qty = 1, distributor, retailer, customer, isUpdate } = req.body;
    const { error } = cartValidation.validate({ ...req.body, userId });
    
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }
    
    try {
        const type = customer ? "customer" : retailer ? "retailer" : distributor ? "distributor" : null;
        if (!type) {
            return response.error(res, resStatusCode.CLIENT_ERROR, "Type is required (customer / retailer / distributor)");
        }
        
        const product = await productModel.findById(productId);
        if (!product) {
            return response.error(res, resStatusCode.NOT_FOUND, "Product not found");
        }

        const cart = await cartModel.findOne({ userId, productId });
        const allTypes = ["customer", "retailer", "distributor"];
        
        let newQty = Number(qty);
        
        if (cart) {
            if (!isUpdate) {
                const presentType = allTypes.find(t => !!cart[t]);
                if (!presentType || presentType === type) {
                    newQty = cart.qty + Number(qty);
                }
            }
        }
        
        const typeData = req.body[type] || {};
        const calculatedPrice = typeData.price; // Use price from frontend
        
        const updatedTypeData = {
            ...typeData,
            qty: newQty,
        };

        let savedCart;
        if (cart) {
            const updateOps = { $set: { [type]: updatedTypeData, qty: newQty }, $unset: {} };
            allTypes.filter(t => t !== type).forEach(t => updateOps.$unset[t] = "");
            savedCart = await cartModel.findByIdAndUpdate(cart._id, updateOps, { new: true, runValidators: true });
        } else {
            savedCart = await cartModel.create({
                userId,
                productId,
                qty: newQty,
                [type]: updatedTypeData,
            });
        }
        
        const total = (calculatedPrice || 0) * newQty;
        
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, {
            cartId: savedCart._id,
            productId: savedCart.productId,
            quantity: newQty,
            price: calculatedPrice,
            total: total,
            cartDetails: savedCart
        });

    } catch (error) {
        console.error("addToCart Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export async function getCart(req, res) {
    let userId = req.user?._id?.toString();
    try {
        const cartItems = await cartModel.find({ userId }).populate("productId").lean();
        const user = await userModel.findOne({ _id: userId })
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, { cartItems, totalRewardPoint: user?.rewardPoints });
    } catch (error) {
        console.error("getCart Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function deleteCart(req, res) {
    let userId = req.user?._id?.toString();
    let { productId } = req.query;
    const { error } = deleteCartValidation.validate(req.query);
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        await cartModel.findOneAndDelete({ userId, productId });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE);
    } catch (error) {
        console.error("deleteCart Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};