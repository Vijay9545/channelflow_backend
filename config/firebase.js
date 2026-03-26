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
        console.log("Attempting to initialize Firebase with FIREBASE_SERVICE_ACCOUNT env var...");
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseError) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env var:", parseError.message);
    }
}

if (!serviceAccount) {
    const serviceAccountPath = join(__dirname, "channelflow-4e2da-firebase-adminsdk-fbsvc-9d3b7b047d.json");
    try {
        console.log(`Searching for local Firebase config at: ${serviceAccountPath}`);
        serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    } catch (fileError) {
        console.warn("Could not find or read local service account file. This is expected on Render if FIREBASE_SERVICE_ACCOUNT env var is set.");
    }
}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin Initialized Successfully");
    } catch (initError) {
        console.error("❌ Firebase Admin Initialization Error:", initError.message);
    }
} else if (!serviceAccount) {
    console.error("❌ Firebase Admin NOT initialized: No credentials found in FIREBASE_SERVICE_ACCOUNT env var or local JSON file.");
    console.info("💡 Tip: On Render, add your Firebase JSON content as a 'FIREBASE_SERVICE_ACCOUNT' environment variable.");
}

export default admin;



// var admin = require("firebase-admin");

// var serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
