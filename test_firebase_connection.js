import admin from "./config/firebase.js";

async function verifyFirebase() {
    try {
        const appName = admin.app().name;
        console.log(`✅ Firebase is connected! App Name: ${appName}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Firebase connection failed:", error.message);
        process.exit(1);
    }
}

verifyFirebase();
