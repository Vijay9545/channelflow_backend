import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function testConnection() {
    try {
        console.log(`Testing connection to bucket: ${process.env.AWS_BUCKET_NAME} in region ${process.env.AWS_REGION}...`);
        
        // 1. Upload a test file
        const uploadCmd = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "test-connection.txt",
            Body: "This is a test file to verify S3 connection from the Node JS app.",
            ContentType: "text/plain",
        });
        await s3.send(uploadCmd);
        console.log("✅ Successfully connected to S3 and uploaded 'test-connection.txt'!");

        // 2. Clean up (delete the test file)
        const deleteCmd = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: "test-connection.txt",
        });
        await s3.send(deleteCmd);
        console.log("✅ Successfully cleaned up 'test-connection.txt'!");

    } catch (error) {
        console.error("❌ Failed to connect to S3:", error.message);
        console.error(error);
    }
}

testConnection();
