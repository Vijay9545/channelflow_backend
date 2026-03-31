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
import { createShiprocketOrder, trackShiprocketShipment } from "../utils/shiprocket.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export async function placeOrder(req, res) {
    const userId = req.user._id.toString();
    const { error, value } = orderValidation.validate(req.body, { abortEarly: false });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details.map(d => d.message).join(", "));
    }
    
    const { 
        name, company, mobile, gst, deliveryAddress, businessAddress, pincode, city, state, order, 
        usePoint = 0, pointsRedeemed = 0, shippingFee = 0, taxAmount = 0, tax = 0, subtotal: frontendSubtotal,
        paymentMethod, paymentId, paymentStatus 
    } = value;
    
    // Choose which points value and tax value to use
    const activePointsRedeemed = pointsRedeemed || usePoint;
    const activeTaxAmount = tax || taxAmount;
    
    try {
        let calculatedSubtotal = 0;
        const processedOrderItems = [];

        // Fetch products and verify prices
        for (const item of order) {
            const product = await productModel.findById(item.productId);
            if (!product) {
                 return response.error(res, resStatusCode.NOT_FOUND, `Product not found for ID: ${item.productId}`);
            }

            const itemFinalPrice = (item.price || 0) * item.qty;
            calculatedSubtotal += itemFinalPrice;

            processedOrderItems.push({
                ...item,
                title: product.title,
                finalPrice: itemFinalPrice
            });
        }

        // Final paid amount calculation
        const calculatedTotalAmount = (calculatedSubtotal + shippingFee + activeTaxAmount) - activePointsRedeemed;

        const orderId = uuidv4();
        const today = new Date();
        const reward = await rewardModel.findOne({ isActive: true, fromDate: { $lte: today }, toDate: { $gte: today } }).lean();

        let earnedPoints = 0;
        if (reward) {
            // Earn points based on subtotal (before tax and shipping)
            earnedPoints = Math.floor((calculatedSubtotal / 100) * reward.point);
        }
        
        await userModel.updateOne({ _id: userId }, {
            $set: { name, deliveryAddress, businessAddress, company, mobile, pincode, city, state },
            $inc: { rewardPoints: earnedPoints - activePointsRedeemed },
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
                pincode,
                city,
                state,
                order: processedOrderItems, 
                subtotal: calculatedSubtotal,
                shippingFee,
                taxAmount: activeTaxAmount,
                tax: activeTaxAmount,
                totalAmount: calculatedTotalAmount, 
                rewardPoints: earnedPoints, 
                usePoint: activePointsRedeemed,
                pointsRedeemed: activePointsRedeemed,
                paymentMethod,
                paymentId,
                paymentStatus
            }),
            cartModel.deleteMany({ userId }),
        ]);
        
        // Trigger Shiprocket Order Creation (Asynchronous)
        // We do this after successful DB save
        try {
            const shiprocketRes = await createShiprocketOrder(newOrder);
            if (shiprocketRes.success) {
                await orderModel.updateOne(
                    { _id: newOrder._id },
                    { 
                        shiprocketOrderId: shiprocketRes.shiprocketOrder.order_id,
                        shiprocketShipmentId: shiprocketRes.shiprocketOrder.shipment_id
                    }
                );
                console.log(`🚀 Shiprocket order updated for ${orderId}`);
            }
        } catch (srErr) {
            console.error("⚠️ Shiprocket integration failed (non-blocking):", srErr);
        }
        
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
            return { ...order, order: orderItems, totalAmount: order.totalAmount, subtotal: order.subtotal, shippingFee: order.shippingFee, taxAmount: order.taxAmount, tax: order.tax, pointsRedeemed: order.pointsRedeemed };
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

export async function trackOrder(req, res) {
    const { id } = req.params;
    try {
        const order = await orderModel.findById(id);
        if (!order) {
            return response.error(res, resStatusCode.NOT_FOUND, "Order not found");
        }

        if (!order.shiprocketShipmentId) {
            return response.error(res, resStatusCode.CLIENT_ERROR, "Shipment ID not found for this order. It might not have been processed through Shiprocket.");
        }

        const result = await trackShiprocketShipment(order.shiprocketShipmentId);
        if (result.success) {
            return response.success(res, resStatusCode.SUCCESS, "Tracking data fetched", result.trackingData);
        } else {
            return response.error(res, resStatusCode.BAD_REQUEST, result.error || "Failed to fetch tracking data");
        }
    } catch (err) {
        console.error("trackOrder error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
}