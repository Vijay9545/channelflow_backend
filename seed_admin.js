import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { userModel } from "./src/models/userModel.js";

dotenv.config();

async function seedAdmin() {
    try {
        const monogoUrl = process.env.MONGOURL;
        if (!monogoUrl) {
            console.error("MONGOURL not found in environment variables.");
            process.exit(1);
        }

        await mongoose.connect(monogoUrl);
        console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

        const adminEmail = "admin@channelflow.com";
        const adminPassword = "admin123456";

        // Check if admin already exists
        const existingAdmin = await userModel.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`Admin with email ${adminEmail} already exists. Skipping...`);
            process.exit(0);
        }

        // Generate a unique uId
        const lastUser = await userModel.findOne().sort({ uId: -1 }).exec();
        const newUId = (lastUser?.uId || 0) + 1;

        // Hash the password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create the admin user
        await userModel.create({
            uId: newUId,
            name: "Super Admin",
            email: adminEmail,
            password: hashedPassword,
            company: "Channel Flow",
            mobile: "+910000000000",
            deliveryAddress: "Main Office",
            role: 0, // Super Admin
            isActive: true
        });

        console.log("-----------------------------------------");
        console.log("Super Admin created successfully!");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log("-----------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seedAdmin();
