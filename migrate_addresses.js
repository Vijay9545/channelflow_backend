import mongoose from "mongoose";
import dotenv from "dotenv";
import { userModel } from "./src/models/userModel.js";
import connectDB from "./db/dbconnect.js";

dotenv.config();

const migrate = async () => {
    try {
        await connectDB();
        const users = await userModel.find({});
        console.log(`Found ${users.length} users to check for migration.`);

        let migratedCount = 0;

        for (const user of users) {
            let changed = false;

            // If addresses array is empty and we have a legacy deliveryAddress string
            // (Note: Since I changed the schema type, if the data in DB was a string, 
            // Mongoose might have trouble loading it into the new AddressSchema type 
            // unless we handle it carefully or use lean())
            
            // To be safe, let's use the underlying collection directly or check the raw doc
            const rawUser = user.toObject();

            if ((rawUser.addresses?.length === 0 || !rawUser.addresses) && 
                (typeof rawUser.deliveryAddress === 'string' && rawUser.deliveryAddress.trim() !== "")) {
                
                console.log(`Migrating address for user: ${user.mobile}`);
                
                const newAddress = {
                    name: rawUser.name || "Default",
                    mobile: rawUser.mobile,
                    pincode: rawUser.pincode || "000000",
                    locality: rawUser.city || "Unknown",
                    addressLine: rawUser.deliveryAddress,
                    city: rawUser.city || "Unknown",
                    state: rawUser.state || "Unknown",
                    addressType: "Home",
                    isDefault: true
                };

                user.addresses = [newAddress];
                user.deliveryAddress = newAddress;
                changed = true;
            }

            if (changed) {
                await user.save();
                migratedCount++;
            }
        }

        console.log(`Migration completed. Migrated ${migratedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
