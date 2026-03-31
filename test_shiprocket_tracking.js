import "dotenv/config";
import mongoose from "mongoose";
import { orderModel } from "./src/models/orderModel.js";
import { trackShiprocketShipment } from "./src/utils/shiprocket.js";

async function testTracking() {
    try {
        console.log("🔗 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGOURL);
        console.log("✅ Connected!");

        const order = await orderModel.findOne({ shiprocketShipmentId: { $ne: null } });
        
        if (order) {
            console.log(`🔍 Found order with Shipment ID: ${order.shiprocketShipmentId}`);
            console.log("📡 Fetching tracking data...");
            const result = await trackShiprocketShipment(order.shiprocketShipmentId);
            if (result.success) {
                console.log("✅ Tracking Data:", JSON.stringify(result.trackingData, null, 2));
            } else {
                console.error("❌ Tracking Fetch Failed:", result.error);
            }
        } else {
            console.warn("⚠️ No orders found with a Shiprocket Shipment ID.");
        }
    } catch (err) {
        console.error("❌ Test error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

testTracking();
