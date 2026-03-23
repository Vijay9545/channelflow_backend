import express from 'express';
import { productImages } from './src/utils/uploadHandler.js';
import FormData from 'form-data';
import fetch from 'node-fetch';

const app = express();

// Dummy endpoint using the actual productImages middleware from your backend
app.post('/test-upload', productImages, (req, res) => {
    if (req.uploadedImages && req.uploadedImages.length > 0) {
        res.json({ success: true, uploadedImages: req.uploadedImages });
    } else {
        res.status(400).json({ success: false, message: 'No image uploaded' });
    }
});

const PORT = 8009;
const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    
    try {
        // Create a dummy image buffer
        const imageBuffer = Buffer.from('Testing 123', 'utf-8');
        
        // Prepare form data
        const form = new FormData();
        form.append('mainImage', imageBuffer, {
            filename: 'dummy-product-image.jpg',
            contentType: 'image/jpeg'
        });

        console.log("Sending a simulated file upload to your backend's middleware...");
        
        const response = await fetch(`http://localhost:${PORT}/test-upload`, {
            method: 'POST',
            body: form
        });
        
        const data = await response.json();
        console.log("Backend Response:", data);
        
        if (data.success && data.uploadedImages[0].s3Url.includes('s3')) {
            console.log("✅ SUCCESS! Your backend's uploadHandler correctly uploaded the image to S3.");
        } else {
            console.log("❌ FAILED. S3 Url not found in response.");
        }
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        server.close();
        process.exit(0);
    }
});
