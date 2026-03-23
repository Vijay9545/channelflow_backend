import mongoose from 'mongoose';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import { productModel } from './src/models/productModel.js';
import connectDB from './db/dbconnect.js';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function run() {
    await connectDB();
    console.log("Connected to DB...");

    try {
        // 1. Create a dummy buffer
        console.log("Creating dummy image buffer...");
        const buffer = Buffer.from('Testing Image 123', 'utf-8');

        // 2. Upload to S3
        console.log("Uploading to S3...");
        const timestamp = Date.now();
        const fileName = `placeholder-${timestamp}.jpg`;
        const s3Key = `products/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: 'image/jpeg',
            ContentDisposition: 'inline',
        });
        
        await s3.send(command);
        const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        console.log(`✅ Uploaded successfully! Image URL: ${s3Url}`);

        // 3. Update all products in the database
        console.log("Updating products in the database...");
        const result = await productModel.updateMany(
            {}, // Match all products
            { $set: { mainImage: s3Url } }
        );

        console.log(`✅ Updated ${result.modifiedCount} products!`);

    } catch (err) {
        console.error("❌ Failed:", err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

run();
