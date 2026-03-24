import mongoose from "mongoose";
import { pincodeModel } from "./src/models/pincodeModel.js";
import { checkPincodeServiceability } from "./src/controllers/pincodeController.js";
import connectDB from "./db/dbconnect.js";
import dotenv from "dotenv";

dotenv.config();

async function runTest() {
    await connectDB();
    
    try {
        // 1. Add a test pincode
        const testPincode = "425405";
        const testCity = "Shirpur";
        const testState = "Maharashtra";
        
        console.log(`Adding test pincode: ${testPincode}...`);
        await pincodeModel.findOneAndUpdate(
            { pincode: testPincode },
            { city: testCity, state: testState, isActive: true, isDelete: false },
            { upsert: true, new: true }
        );
        console.log("Test pincode added/updated.");

        // 2. Check serviceability by calling the controller directly
        console.log("Testing checkPincodeServiceability controller...");
        
        const req = {
            body: { pincode: testPincode }
        };
        
        let responseData = null;
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                responseData = data;
                return this;
            }
        };

        await checkPincodeServiceability(req, res);
        
        console.log("Controller Response:", JSON.stringify(responseData, null, 2));

        if (responseData && responseData.status === 200 && responseData.data.serviceable === true) {
            console.log("✅ Verification Successful: Pincode is serviceable.");
        } else {
            console.log("❌ Verification Failed.");
        }

    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        await mongoose.connection.close();
    }
}

runTest();
