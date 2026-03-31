import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';

// Helper to strip quotes from environment variables
const stripQuotes = (str) => {
    if (!str) return str;
    return str.trim().replace(/^['"]|['"]$/g, '');
};

const isProduction = stripQuotes(process.env.ENVIRONMENT) === 'production';
const forceS3 = stripQuotes(process.env.UPLOAD_TO_S3) === 'true';

export let s3;
const awsRegion = stripQuotes(process.env.AWS_REGION);
const awsAccessKey = stripQuotes(process.env.AWS_ACCESS_KEY_ID);
const awsSecretKey = stripQuotes(process.env.AWS_SECRET_ACCESS_KEY);

if (awsRegion && awsAccessKey && awsSecretKey) {
    s3 = new S3Client({
        region: awsRegion,
        credentials: {
            accessKeyId: awsAccessKey,
            secretAccessKey: awsSecretKey,
        },
    });
    console.log('[S3] Client initialized successfully for region:', awsRegion);
} else {
    console.warn('[S3] AWS credentials or region missing. S3 uploads will only work if ENVIRONMENT=production or UPLOAD_TO_S3=true and credentials are provided.');
}

const saveLocally = async (file, folderName, filePrefix, fieldname) => {
    const timestamp = Date.now();
    const first4Chars = file.originalname.slice(0, 4);
    const ext = file.originalname.includes('.') ? file.originalname.slice(file.originalname.lastIndexOf('.')) : '.jpg';
    const filename = `${filePrefix}-${timestamp}-${first4Chars}${ext}`;
    const localFolder = `${process.cwd()}/public/${folderName}`;

    if (!fs.existsSync(localFolder)) {
        fs.mkdirSync(localFolder, { recursive: true });
    };

    const filePath = `${localFolder}/${filename}`;
    fs.writeFileSync(filePath, file.buffer);
    const baseUrl = stripQuotes(process.env.BASE_URL) || `http://localhost:${process.env.PORT || 8001}`;
    console.log('[Local Upload] Saved to:', `${baseUrl}/${folderName}/${filename}`);
    return {
        field: fieldname,
        fileName: filename,
        originalName: file.originalname,
        s3Url: `${baseUrl}/${folderName}/${filename}`,
    };
};

const storage = multer.memoryStorage();
export const createS3Uploader = ({ folderName, filePrefix = '', fieldType = 'single', fieldName, customFields = [], fileSizeMB, } = {}) => {
    const limits = {
        fileSize: (fileSizeMB || 5) * 1024 * 1024,
    };
    const upload = multer({
        storage,
        limits,
    });

    let multerUpload;
    if (fieldType === 'single') {
        multerUpload = upload.single(fieldName);
    } else if (fieldType === 'array') {
        multerUpload = upload.array(fieldName, customFields?.[0]?.maxCount || 1);
    } else if (fieldType === 'fields') {
        multerUpload = upload.fields(customFields);
    } else {
        throw new Error("Invalid fieldType for uploader");
    };

    return [
        multerUpload,
        async (req, res, next) => {
            try {
                const files = req.files || (req.file ? { [fieldName]: [req.file] } : {});
                if (!req.file && (!req.files || Object.keys(req.files).length === 0)) {
                    console.log('[Upload Handler] No files found in request');
                    return next();
                }

                req.uploadedImages = [];
                const bucketName = stripQuotes(process.env.AWS_BUCKET_NAME);

                for (const [key, fileArray] of Object.entries(files)) {
                    for (const file of fileArray) {
                        if (isProduction || forceS3) {
                            console.log('[S3 Upload] Attempting upload for:', file.originalname);
                            const timestamp = Date.now();
                            const first4Chars = file.originalname.slice(0, 4);
                            const ext = path.extname(file.originalname);
                            const isBlob = ext === '.blob' || !ext;
                            const finalExt = isBlob ? '.jpg' : ext;
                            const finalMime = isBlob ? 'image/jpeg' : file.mimetype;
                            const filename = `${filePrefix}-${timestamp}-${first4Chars}${finalExt}`;
                            const s3Key = `${folderName}/${filename}`;

                            if (!s3) {
                                console.error('[S3 Upload] S3 client not initialized. Check your ENV variables.');
                                throw new Error("S3 client not initialized. Check your AWS credentials in Render environment variables.");
                            }

                            if (!bucketName) {
                                console.error('[S3 Upload] AWS_BUCKET_NAME is missing.');
                                throw new Error("AWS_BUCKET_NAME is missing in environment variables.");
                            }

                            const command = new PutObjectCommand({
                                Bucket: bucketName,
                                Key: s3Key,
                                Body: file.buffer,
                                ContentType: finalMime,
                                ContentDisposition: "inline",
                            });

                            await s3.send(command);
                            const s3Url = `https://${bucketName}.s3.${awsRegion || 'ap-south-1'}.amazonaws.com/${s3Key}`;

                            req.uploadedImages.push({
                                field: key,
                                index: key.includes('[') ? key.split('[')?.[1]?.[0] : undefined,
                                fileName: filename,
                                originalName: file.originalname,
                                s3Url,
                            });
                            console.log('[S3 Upload] Success:', s3Url);
                        } else {
                            const localFile = await saveLocally(file, folderName, filePrefix, file.fieldname);
                            req.uploadedImages.push({
                                field: key,
                                ...localFile,
                            });
                        };
                    };
                };
                next();
            } catch (error) {
                console.error('[Upload Handler] Critical Error:', error.message);
                // Attach status to error for global handler
                error.status = 500;
                next(error);
            };
        },
    ];
};

const maxDetailImages = 15;
const detailImageFields = Array.from({ length: maxDetailImages }, (_, i) => ({
    name: `news[${i}][image]`,
    maxCount: 1
}));

export const newsImages = createS3Uploader({
    folderName: 'news',
    filePrefix: 'news',
    fieldType: 'fields',
    customFields: [
        { name: 'mainImage', maxCount: 1 },
        ...detailImageFields
    ],
    fileSizeMB: 1,
});

export const blogImage = createS3Uploader({
    folderName: 'blog',
    filePrefix: 'blog',
    fieldType: 'single',
    fieldName: 'image',
    fileSizeMB: 1,
});

export const productImages = createS3Uploader({
    folderName: 'products',
    filePrefix: 'product',
    fieldType: 'fields',
    customFields: [
        { name: 'mainImage', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ],
    fileSizeMB: 2,
});

export const categoryImages = createS3Uploader({
    folderName: 'categories',
    filePrefix: 'category',
    fieldType: 'single',
    fieldName: 'image',
    fileSizeMB: 2,
});
