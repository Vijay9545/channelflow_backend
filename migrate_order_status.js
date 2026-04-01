import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { orderModel } from "./src/models/orderModel.js";

async function run() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGOURL);
        console.log("✅ Connected to MongoDB");

        const res = await orderModel.updateMany(
            { orderStatus: { $exists: false } },
            { $set: { orderStatus: "PLACED" } }
        );

        console.log("✅ Migration Results:", res);
        console.log("Updated", res.modifiedCount, "orders to 'PLACED' status.");

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

run();
