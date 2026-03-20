import mongoose from "mongoose";
import dotenv from "dotenv";
import { categoryModel } from "./src/models/categoryModel.js";
import { subCategoryModel } from "./src/models/subCategoryModel.js";
import { productModel } from "./src/models/productModel.js";

dotenv.config();

const MONGO_URL = process.env.MONGOURL || "mongodb://localhost:27017/molimor_channel_flow";

async function seed() {
    try {
        const monogoUrl = process.env.MONGOURL || "mongodb://localhost:27017/channel_flow";
        await mongoose.connect(monogoUrl);
        console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

        // Drop collections to clear data and indexes
        const collections = ["categorys", "sub_categorys", "products"];
        for (const colName of collections) {
            try {
                await mongoose.connection.db.collection(colName).drop();
                console.log(`Dropped collection: ${colName}`);
            } catch (e) {
                console.log(`Collection ${colName} not found or already dropped.`);
            }
        }

        // 1. Create Categories
        const categories = await categoryModel.create([
            { name: "Industrial Tools" },
            { name: "Safety Equipment" },
            { name: "Electrical Supplies" }
        ]);
        console.log(`Created ${categories.length} categories.`);

        // 2. Create Sub-Categories
        const subCategories = await subCategoryModel.create([
            { name: "Hand Tools", categoryId: categories[0]._id },
            { name: "Power Tools", categoryId: categories[0]._id },
            { name: "Protective Gear", categoryId: categories[1]._id },
            { name: "Cables & Wires", categoryId: categories[2]._id }
        ]);
        console.log(`Created ${subCategories.length} sub-categories.`);

        // 3. Create Products
        const productsData = [
            {
                title: "Professional Grade Hammer",
                mainImage: "https://placehold.co/600x400?text=Hammer",
                sku: "TOOL-HAM-01",
                subCategoryId: subCategories[0]._id,
                variants: {
                    distributor: { qty: 1000, price: 450, mrp: 800, miniOrderQty: 50 },
                    retailer: { qty: 500, price: 550, mrp: 800, miniOrderQty: 10 },
                    customer: { qty: 100, price: 750, mrp: 800, miniOrderQty: 1 }
                },
                priceTiers: [
                    { minQty: 100, price: 400 },
                    { minQty: 500, price: 350 }
                ],
                gst: "18%"
            },
            {
                title: "Safety Helmet - Heavy Duty",
                mainImage: "https://placehold.co/600x400?text=Helmet",
                sku: "SAFE-HEL-02",
                subCategoryId: subCategories[2]._id,
                variants: {
                    distributor: { qty: 2000, price: 200, mrp: 500, miniOrderQty: 100 },
                    retailer: { qty: 1000, price: 250, mrp: 500, miniOrderQty: 20 },
                    customer: { qty: 200, price: 450, mrp: 500, miniOrderQty: 1 }
                },
                priceTiers: [
                    { minQty: 200, price: 180 },
                    { minQty: 1000, price: 150 }
                ],
                gst: "12%"
            },
            {
                title: "High Performance Drill Machine",
                mainImage: "https://placehold.co/600x400?text=Drill",
                sku: "TOOL-DRI-03",
                subCategoryId: subCategories[1]._id,
                variants: {
                    distributor: { qty: 50, price: 2500, mrp: 4500, miniOrderQty: 5 },
                    retailer: { qty: 30, price: 3000, mrp: 4500, miniOrderQty: 2 },
                    customer: { qty: 10, price: 4000, mrp: 4500, miniOrderQty: 1 }
                },
                priceTiers: [
                    { minQty: 10, price: 2400 },
                    { minQty: 25, price: 2200 }
                ],
                gst: "18%"
            }
        ];

        const products = await productModel.create(productsData);
        console.log(`Created ${products.length} products.`);

        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
