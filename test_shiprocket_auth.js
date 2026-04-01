import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const testShiprocketAuth = async () => {
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    console.log("Testing with Email:", email);
    console.log("Testing with Password length:", password?.length);

    try {
        const response = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
            email,
            password,
        });

        console.log("✅ Success! Response data:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("❌ Error Status:", error.response?.status);
        console.error("❌ Error Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("❌ Error Message:", error.message);
    }
};

testShiprocketAuth();
