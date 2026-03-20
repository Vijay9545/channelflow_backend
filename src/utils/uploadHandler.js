import multer from 'multer';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';

const isProduction = process.env.ENVIRONMENT === 'production';
export const s3 = new S3Client({
    region: process.env.AWS_REGION || "",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

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
    console.log('s3Url', `${process.env.BASE_URL}/${process.env.PORT}/${folderName}/${filename}`, '::::', 'field:', fieldname);
    return {
        field: fieldname,
        fileName: filename,
        originalName: file.originalname,
        s3Url: `${process.env.BASE_URL}/${folderName}/${filename}`,
        // s3Url: `https://molimornode-production.up.railway.app/${folderName}/${filename}`,
    };
};

const storage = multer.memoryStorage();
export const createS3Uploader = ({ folderName, filePrefix = '', fieldType = 'single', fieldName, customFields = [], fileSizeMB, } = {}) => {
    const limits = {
        fileSize: fileSizeMB * 1024 * 1024,
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
                req.uploadedImages = [];
                for (const [key, fileArray] of Object.entries(files)) {
                    for (const file of fileArray) {
                        if (isProduction) {
                            const timestamp = Date.now();
                            const first4Chars = file.originalname.slice(0, 4);
                            const ext = path.extname(file.originalname);
                            const isBlob = ext === '.blob'; // or use mimetype check if needed
                            const finalExt = isBlob ? '.jpg' : ext; // Default to .jpg if it's a blob
                            const finalMime = isBlob ? 'image/jpeg' : file.mimetype; // Default to image/jpeg if it's a blob
                            const filename = `${filePrefix}-${timestamp}-${first4Chars}${finalExt}`;
                            const s3Key = `${folderName}/${filename}`;

                            const command = new PutObjectCommand({
                                Bucket: process.env.AWS_BUCKET_NAME,
                                Key: s3Key,
                                Body: file.buffer,
                                ContentType: finalMime, //file.mimetype, //ext,
                                ContentDisposition: "inline",
                            });
                            await s3.send(command);
                            const s3Url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
                            // const baseUrl = process.env.BASE_URL || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

                            // const s3Url = `${baseUrl}/${s3Key}`;

                            req.uploadedImages.push({
                                field: key,
                                index: key.split('[')?.[1]?.[0],
                                fileName: filename,
                                originalName: file.originalname,
                                s3Url,
                            });
                            console.log('[S3 Upload] uploadedImages =>', req.uploadedImages);
                        } else {
                            console.log(file)
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
                console.error('[S3 Upload] Error occurred during file upload:', error);
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
    fieldType: 'single',
    fieldName: 'mainImage',
    fileSizeMB: 2,
});

export const categoryImages = createS3Uploader({
    folderName: 'categories',
    filePrefix: 'category',
    fieldType: 'single',
    fieldName: 'image',
    fileSizeMB: 2,
});
