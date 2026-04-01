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
import { createShiprocketOrder, trackShiprocketShipment, getShippingRates, cancelShiprocketOrder } from "../utils/shiprocket.js";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

/**
 * Strips "(Estimated Delivery: ...)" strings from the end of addresses
 */
function stripDeliveryEstimate(address) {
    if (!address) return "";
    return address.replace(/\n?\(Estimated Delivery:.*?\)/g, "").trim();
}

export async function placeOrder(req, res) {
    const userId = req.user._id.toString();
    const { error, value } = orderValidation.validate(req.body, { abortEarly: false });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details.map(d => d.message).join(", "));
    }
    
    const { 
        name, company, mobile, gst, deliveryAddress, businessAddress, pincode, city, state, order, 
        usePoint = 0, pointsRedeemed = 0, shippingFee = 0, taxAmount = 0, tax = 0, subtotal: frontendSubtotal,
        paymentMethod, paymentId, paymentStatus, estimatedDelivery = "" 
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
        
        // Clean existing pollution from addresses
        const cleanDeliveryAddress = stripDeliveryEstimate(deliveryAddress);
        const cleanBusinessAddress = stripDeliveryEstimate(businessAddress);

        // Sanity check: If businessAddress looks like a delivery estimate (e.g. "1-2"), 
        // and we have an estimatedDelivery value, we should NOT overwrite the user's business address with it.
        const updatedUserData = { name, deliveryAddress: cleanDeliveryAddress, company, mobile, pincode, city, state };
        if (cleanBusinessAddress && !/^\d+-\d+/.test(cleanBusinessAddress)) {
            updatedUserData.businessAddress = cleanBusinessAddress;
        }
        if (estimatedDelivery) {
            updatedUserData.estimatedDelivery = estimatedDelivery;
        }

        await userModel.updateOne({ _id: userId }, {
            $set: updatedUserData,
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
                deliveryAddress: cleanDeliveryAddress,
                businessAddress: cleanBusinessAddress,
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
                paymentStatus,
                estimatedDelivery
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

export async function getShippingRate(req, res) {
    const { pincode, weight, cod } = req.query;
    
    if (!pincode || !weight) {
        return response.error(res, resStatusCode.CLIENT_ERROR, "Pincode and weight are required");
    }

    try {
        const result = await getShippingRates({
            delivery_postcode: pincode,
            weight: parseFloat(weight),
            cod: cod === 'true' || cod === '1'
        });

        if (result.success) {
            return response.success(res, resStatusCode.SUCCESS, "Shipping rate fetched", result);
        } else {
            return response.error(res, resStatusCode.CLIENT_ERROR, result.message || result.error);
        }
    } catch (err) {
        console.error("getShippingRate error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
}

export async function cancelOrder(req, res) {
    const { id } = req.params;
    const { cancelReason } = req.body;
    const userId = req.user?._id?.toString();

    if (!cancelReason) {
        return response.error(res, resStatusCode.CLIENT_ERROR, "Cancellation reason is required");
    }

    try {
        const order = await orderModel.findOne({ _id: id, userId });
        if (!order) {
            return response.error(res, resStatusCode.NOT_FOUND, "Order not found");
        }

        // Check if order is eligible for cancellation
        if (['CANCELLED', 'SHIPPED', 'DELIVERED'].includes(order.orderStatus)) {
            return response.error(res, resStatusCode.CLIENT_ERROR, `Order cannot be cancelled as it is already ${order.orderStatus.toLowerCase()}`);
        }

        // 1. Reverse Reward Points
        const user = await userModel.findById(userId);
        if (user) {
            // Points used for discount should be returned
            const pointsToReturn = order.pointsRedeemed || order.usePoint || 0;
            // Points earned from this purchase should be revoked
            const pointsToRevoke = order.rewardPoints || 0;

            const netChange = pointsToReturn - pointsToRevoke;
            
            await userModel.updateOne(
                { _id: userId },
                { $inc: { rewardPoints: netChange } }
            );
            console.log(`♻️ Points Reversal: Returned ${pointsToReturn}, Revoked ${pointsToRevoke} for user ${userId}`);
        }

        // 2. Update Order Status
        order.orderStatus = 'CANCELLED';
        order.cancelReason = cancelReason;
        order.cancelledAt = new Date();
        await order.save();

        // 3. Cancel in Shiprocket if synced
        if (order.shiprocketOrderId) {
            try {
                // Shiprocket expects an array of IDs
                await cancelShiprocketOrder([order.shiprocketOrderId]);
                console.log(`📡 Shiprocket cancellation sent for order ${order.orderId}`);
            } catch (srErr) {
                console.error("⚠️ Shiprocket cancellation failed:", srErr);
            }
        }

        return response.success(res, resStatusCode.SUCCESS, "Order cancelled successfully", {
            orderId: order.orderId,
            status: order.orderStatus,
            cancelledAt: order.cancelledAt
        });

    } catch (err) {
        console.error("cancelOrder error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
}