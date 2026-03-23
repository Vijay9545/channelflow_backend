import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// download your service account key JSON from Firebase Console
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseError) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env var:", parseError);
    }
}

if (!serviceAccount) {
    const serviceAccountPath = join(__dirname, "channel-flow-b4b92-firebase-adminsdk-fbsvc-cc1c1241f8.json");
    try {
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    } catch (fileError) {
        console.error("Error reading Firebase service account file:", fileError.message);
    }
}

if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin Initialized Successfully");
} else if (!serviceAccount) {
    console.error("Firebase Admin could not be initialized: No service account credentials found.");
}

export default admin;



// var admin = require("firebase-admin");

// var serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
