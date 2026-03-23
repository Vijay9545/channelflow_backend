import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import { productModel } from './src/models/productModel.js';
import connectDB from './db/dbconnect.js';

async function checkProduct() {
    await connectDB();
    console.log("Connected to DB...");

    try {
        const product = await productModel.findOne().sort({ createdAt: -1 });
        if (product) {
            console.log("\n==== Latest Product Saved ====");
            console.log("Title: ", product.title);
            console.log("SKU: ", product.sku);
            console.log("Image URL: ", product.mainImage);
            console.log("Active State: ", product.isActive);
            console.log("==============================\n");
            
            // Try fetching the image to see if it's publicly accessible
            try {
                const response = await fetch(product.mainImage);
                console.log(`Image Fetch HTTP Status: ${response.status} ${response.statusText}`);
                if (response.status === 403) {
                    console.error("❌ The image is returning 403 Forbidden! The S3 bucket is blocking public access.");
                } else if (response.status === 200) {
                    console.log("✅ The image URL is perfectly accessible to the public internet.");
                }
            } catch (fetchErr) {
                console.log("Error testing internet fetch of image:", fetchErr.message);
            }

        } else {
            console.log("No products found in the database.");
        }
    } catch (err) {
        console.error("Failed:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

checkProduct();
