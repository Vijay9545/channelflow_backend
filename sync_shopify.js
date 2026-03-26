import mongoose from "mongoose";
import dotenv from "dotenv";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";

// Import models
import { categoryModel } from "./src/models/categoryModel.js";
import { subCategoryModel } from "./src/models/subCategoryModel.js";
import { productModel } from "./src/models/productModel.js";

dotenv.config();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_URL;
const API_KEY = process.env.SHOPIFY_API_KEY;
const API_SECRET = process.env.SHOPIFY_API_SECRET;
const ADMIN_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const MONGO_URL = process.env.MONGOURL;

// Initialize Shopify
const shopify = shopifyApi({
    apiKey: API_KEY,
    apiSecretKey: API_SECRET,
    adminApiAccessToken: ADMIN_TOKEN,
    scopes: ["read_products", "read_collections"],
    hostName: SHOPIFY_STORE,
    apiVersion: "2024-01", // Use direct string
    isEmbeddedApp: false,
});

async function sync() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URL);
        console.log("✅ Connected to MongoDB.");

        // Create a custom app session (must explicitly use the token)
        const session = {
            shop: SHOPIFY_STORE,
            accessToken: ADMIN_TOKEN,
            state: "state",
            isOnline: false,
        };
        const client = new shopify.clients.Rest({ session });

        // 1. Fetch Collections
        console.log("\n📦 Fetching Shopify Collections...");
        const customCol = await client.get({ path: "custom_collections" });
        const smartCol = await client.get({ path: "smart_collections" });
        const allShopifyCollections = [...customCol.body.custom_collections, ...smartCol.body.smart_collections];
        
        console.log(`✅ Found ${allShopifyCollections.length} Shopify collections.`);

        for (const col of allShopifyCollections) {
            let category = await categoryModel.findOne({ name: col.title });
            if (!category) {
                category = await categoryModel.create({ name: col.title, description: col.body_html || "" });
                console.log(`🆕 Created Category: ${category.name}`);
            }

            let subCategory = await subCategoryModel.findOne({ name: col.title, categoryId: category._id });
            if (!subCategory) {
                subCategory = await subCategoryModel.create({ 
                    name: col.title, 
                    categoryId: category._id,
                    description: `Main sub-category for ${col.title}`
                });
                console.log(`🆕 Created SubCategory: ${subCategory.name}`);
            }
        }

        // 2. Fetch Products
        console.log("\n🏷️ Fetching Shopify Products...");
        const productsData = await client.get({ path: "products" });
        const shopifyProducts = productsData.body.products;
        console.log(`✅ Found ${shopifyProducts.length} Shopify products.`);

        for (const sp of shopifyProducts) {
            console.log(`\nProcessing Product: ${sp.title} (ID: ${sp.id})`);

            let subCategoryId;
            if (sp.product_type) {
                let cat = await categoryModel.findOne({ name: sp.product_type });
                if (!cat) cat = await categoryModel.create({ name: sp.product_type });
                let sub = await subCategoryModel.findOne({ name: sp.product_type, categoryId: cat._id });
                if (!sub) sub = await subCategoryModel.create({ name: sp.product_type, categoryId: cat._id });
                subCategoryId = sub._id;
            } else {
                const firstSub = await subCategoryModel.findOne();
                subCategoryId = firstSub?._id;
            }

            if (!subCategoryId) continue;

            const firstVariant = sp.variants[0];
            const price = parseFloat(firstVariant.price || 0);
            const mrp = parseFloat(firstVariant.compare_at_price || price);
            const qty = firstVariant.inventory_quantity || 0;

            const productPayload = {
                title: sp.title,
                mainImage: sp.image?.src || (sp.images[0]?.src) || "",
                images: sp.images.map(img => img.src),
                variants: {
                    distributor: { qty, price: price * 0.8, mrp, miniOrderQty: 10 },
                    retailer: { qty, price: price * 0.9, mrp, miniOrderQty: 5 },
                    customer: { qty, price, mrp, miniOrderQty: 1 }
                },
                subCategoryId: subCategoryId,
                sku: firstVariant.sku || `SHOPIFY-${sp.id}`,
                isActive: sp.status === "active"
            };

            await productModel.findOneAndUpdate(
                { sku: productPayload.sku },
                { $set: productPayload },
                { upsert: true, new: true }
            );
            console.log(`✅ Synced Product: ${sp.title}`);
        }

        console.log("\n🎉 SHOPIFY SDK SYNC COMPLETED SUCCESSFULLY!");
    } catch (error) {
        console.error("\n❌ Sync failed:");
        if (error.response) {
            console.error(`Status: ${error.response.code}`);
            console.error(`Data: ${JSON.stringify(error.response.body)}`);
        } else {
            console.error(error.message);
        }
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

sync();
