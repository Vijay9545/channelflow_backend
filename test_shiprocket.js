import "dotenv/config";
import { getShiprocketToken, getPickupLocations, getPrimaryPickupNickname } from "./src/utils/shiprocket.js";

async function testShiprocket() {
    console.log("🚀 Starting Shiprocket Integration Test...");
    
    // 1. Test Authentication
    console.log("\n🔑 Testing Authentication...");
    const token = await getShiprocketToken();
    if (token) {
        console.log("✅ Auth Success! Token obtained.");
    } else {
        console.error("❌ Auth Failed! Check your .env file for SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
        return;
    }

    // 2. Test Pickup Locations
    console.log("\n📍 Testing Pickup Locations...");
    const locations = await getPickupLocations(token);
    if (locations && locations.length > 0) {
        console.log(`✅ Found ${locations.length} pickup locations.`);
        console.log("First Location:", locations[0].pickup_location);
    } else {
        console.warn("⚠️ No pickup locations found or error occurred.");
    }

    // 3. Test Primary Pickup Nickname
    console.log("\n👤 Testing Primary Pickup Nickname...");
    const nickname = await getPrimaryPickupNickname(token);
    console.log(`✅ Result: ${nickname}`);

    console.log("\n✨ Test completed.");
}

testShiprocket();
