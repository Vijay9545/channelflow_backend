import {
    orderModel, orderValidation
} from "../models/orderModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage } from "../utils/constants.js";
import { v4 as uuidv4 } from "uuid";
import { userModel } from "../models/userModel.js";
import { cartModel } from "../models/cartModel.js";
import { rewardModel } from "../models/rewardModel.js";
import { productModel } from "../models/productModel.js";
import { getPriceByQty } from "../utils/pricing.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function placeOrder(req, res) {
    const userId = req.user._id.toString();
    const { error, value } = orderValidation.validate(req.body, { abortEarly: false });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details.map(d => d.message).join(", "));
    }
    
    // TotalAmount provided by frontend is ignored for security.
    const { name, company, mobile, gst, deliveryAddress, businessAddress, order, usePoint = 0 } = value;
    
    try {
        let calculatedTotalAmount = 0;
        const processedOrderItems = [];

        // Fetch products and use prices provided by frontend
        for (const item of order) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                 return response.error(res, resStatusCode.NOT_FOUND, `Product not found for ID: ${item.productId}`);
            }

            const itemFinalPrice = (item.price || 0) * item.qty;
            calculatedTotalAmount += itemFinalPrice;

            processedOrderItems.push({
                ...item,
                finalPrice: itemFinalPrice
            });
        }

        const orderId = uuidv4();
        const today = new Date();
        const reward = await rewardModel.findOne({ isActive: true, fromDate: { $lte: today }, toDate: { $gte: today } }).lean();

        let earnedPoints = 0;
        if (reward) {
            earnedPoints = Math.floor((calculatedTotalAmount / 100) * reward.point);
        }
        
        await userModel.updateOne({ _id: userId }, {
            $set: { name, deliveryAddress, businessAddress, company, mobile },
            $inc: { rewardPoints: earnedPoints - usePoint },
        });
        
        const [newOrder] = await Promise.all([
            orderModel.create({ 
                orderId, 
                userId, 
                name, 
                company, 
                mobile, 
                gst, 
                deliveryAddress,
                businessAddress,
                order: processedOrderItems, 
                totalAmount: calculatedTotalAmount, 
                rewardPoints: earnedPoints, 
                usePoint 
            }),
            cartModel.deleteMany({ userId }),
        ]);
        
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, { ...newOrder.toObject(), earnedPoints });
    } catch (err) {
        console.error("placeOrder error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
}

export async function getOrderList(req, res) {
    const userId = req.user?._id?.toString();
    try {
        let orders = await orderModel.find({ userId }).sort({ createdAt: -1 }).populate("order.productId", "title mainImage variants").lean();
        const result = orders.map(order => {
            const totalAmount = order.totalAmount;
            const orderItems = order.order.map(item => {
                const p = item.productId;
                const type = item.type;
                const qty = item.qty || 1;
                const price = item.price;
                const finalPrice = item.finalPrice // || price * qty;
                return {
                    productId: p?._id?.toString() ?? null,
                    title: p?.title ?? "",
                    mainImage: p?.mainImage ?? "",
                    qty,
                    price,
                    finalPrice,
                    type,
                    mrp: p?.variants?.[type]?.mrp ?? null,
                };
            });
            return { ...order, order: orderItems, totalAmount };
        });
        const grandTotal = result.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        return response.success(res, resStatusCode.SUCCESS, resMessage.ACTION_COMPLETE, { orders: result, grandTotal });
    } catch (err) {
        console.error("getOrderList error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getOrderById(req, res) {
    const { id } = req.params;
    const userId = req.user?._id?.toString();
    try {
        const order = await orderModel.findOne({ _id: id, userId }).sort({ createdAt: -1 }).populate("order.productId", "title mainImage price mrp");
        return response.success(res, resStatusCode.SUCCESS, resMessage.ACTION_COMPLETE, order);
    } catch (err) {
        console.error("getOrderById error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getAllOrders(req, res) {
    try {
        let orders = await orderModel.find().sort({ createdAt: -1 }).populate("userId", "name mobile").populate("order.productId", "title mainImage variants").lean();
        const result = orders.map(order => {
            const orderItems = (order.order || []).map(item => {
                const p = item.productId;
                const type = item.type;
                const qty = item.qty || 1;
                const price = item.price;
                const finalPrice = item.finalPrice;
                return {
                    productId: p?._id?.toString() ?? null,
                    title: p?.title ?? "",
                    mainImage: p?.mainImage ?? "",
                    qty,
                    price,
                    finalPrice,
                    type,
                    mrp: p?.variants?.[type]?.mrp ?? null,
                };
            });
            return { ...order, order: orderItems };
        });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, result);
    } catch (err) {
        console.error("getAllOrders error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
}