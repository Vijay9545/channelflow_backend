import mongoose from "mongoose";
import dotenv from "dotenv";

// Import all models
import { userModel } from "./src/models/userModel.js";
import { categoryModel } from "./src/models/categoryModel.js";
import { subCategoryModel } from "./src/models/subCategoryModel.js";
import { productModel } from "./src/models/productModel.js";
import { cartModel } from "./src/models/cartModel.js";
import { orderModel } from "./src/models/orderModel.js";
import { rewardModel } from "./src/models/rewardModel.js";
import { promotionModel } from "./src/models/promotionModel.js";
import { ratingModel } from "./src/models/ratingModel.js";
import { pincodeModel } from "./src/models/pincodeModel.js";

dotenv.config();

const SOURCE_URL = "mongodb+srv://vijaygirase955_db_user:sJwCkpOQQXO8Oe5u@cluster0.qxsmzod.mongodb.net/channelFlow?retryWrites=true&w=majority&appName=Cluster0";
const TARGET_URL = process.env.MONGOURL;

if (!TARGET_URL) {
    console.error("❌ TARGET_URL (MONGOURL) not found in .env file.");
    process.exit(1);
}

async function migrate() {
    let sourceConn, targetConn;
    try {
        console.log("🔌 Connecting to Source MongoDB...");
        sourceConn = await mongoose.createConnection(SOURCE_URL).asPromise();
        console.log("✅ Connected to Source:", sourceConn.name);

        console.log("🔌 Connecting to Target MongoDB...");
        targetConn = await mongoose.createConnection(TARGET_URL).asPromise();
        console.log("✅ Connected to Target:", targetConn.name);

        const models = [
            { name: "User", model: userModel },
            { name: "Category", model: categoryModel },
            { name: "SubCategory", model: subCategoryModel },
            { name: "Product", model: productModel },
            { name: "Cart", model: cartModel },
            { name: "Order", model: orderModel },
            { name: "Reward", model: rewardModel },
            { name: "Promotion", model: promotionModel },
            { name: "Rating", model: ratingModel },
            { name: "Pincode", model: pincodeModel }
        ];

        for (const m of models) {
            console.log(`\n--- Migrating ${m.name} ---`);
            
            // Get the collection name from the model
            const collectionName = m.model.collection.name;
            
            // Fetch all from source
            const sourceCollection = sourceConn.collection(collectionName);
            const docs = await sourceCollection.find({}).toArray();
            
            if (docs.length === 0) {
                console.log(`ℹ️ No documents found in ${m.name} collection. Skipping.`);
                continue;
            }

            console.log(`📦 Found ${docs.length} documents. Transferring...`);

            // Clear target collection first (Optional - but safer for clean migration)
            const targetCollection = targetConn.collection(collectionName);
            await targetCollection.deleteMany({});
            console.log(`🧹 Cleared target collection: ${collectionName}`);

            // Insert into target
            // Using targetCollection.insertMany directly bypasses Mongoose validation 
            // and allows us to keep the original _id.
            const result = await targetCollection.insertMany(docs);
            console.log(`✅ Successfully migrated ${result.insertedCount} ${m.name} documents.`);
        }

        console.log("\n🎉 DATA MIGRATION COMPLETED SUCCESSFULLY!");
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
    } finally {
        if (sourceConn) await sourceConn.close();
        if (targetConn) await targetConn.close();
        process.exit(0);
    }
}

migrate();
