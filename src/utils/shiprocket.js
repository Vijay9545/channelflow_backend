import axios from "axios";

/**
 * Get Shiprocket Auth Token
 * @returns {Promise<string|null>}
 */
export const getShiprocketToken = async () => {
    try {
        const email = process.env.SHIPROCKET_EMAIL;
        const password = process.env.SHIPROCKET_PASSWORD;

        if (!email || !password) {
            console.error("❌ SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set in .env");
            return null;
        }

        const response = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
            email,
            password,
        });

        if (response.data && response.data.token) {
            return response.data.token;
        }
        return null;
    } catch (error) {
        console.error("❌ Shiprocket Auth Error:", error.response?.data || error.message);
        return null;
    }
};

/**
 * Fetch all Pickup Locations (Warehouses)
 * @param {string} token 
 * @returns {Promise<any[]>}
 */
export const getPickupLocations = async (token) => {
    try {
        const response = await axios.get("https://apiv2.shiprocket.in/v1/external/settings/company/pickup", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.data) {
            return response.data.data.shipping_address || [];
        }
        return [];
    } catch (error) {
        console.error("❌ Shiprocket Pickup Fetch Error:", error.response?.data || error.message);
        return [];
    }
};

/**
 * Get Primary Pickup Location Nickname
 * @param {string} token 
 * @returns {Promise<string>}
 */
export const getPrimaryPickupNickname = async (token) => {
    const locations = await getPickupLocations(token);
    if (locations.length > 0) {
        // Find primary or default to the first one
        const primary = locations.find((l) => l.is_primary === 1) || locations.data?.[0] || locations[0];
        return primary.pickup_location; // This is the nickname
    }
    return "Primary"; // Default fallback
};

/**
 * Create Adhoc Order in Shiprocket
 * @param {object} orderData 
 * @returns {Promise<object>}
 */
export const createShiprocketOrder = async (orderData) => {
    try {
        const token = await getShiprocketToken();
        if (!token) throw new Error("Could not authenticate with Shiprocket");

        const pickupNickname = await getPrimaryPickupNickname(token);

        // Map items to Shiprocket format
        const orderItems = orderData.order.map((item) => ({
            name: item.title || "Product", // Note: Backend order items need title!
            sku: item.productId.toString(), // Using DB ID as SKU
            units: item.qty,
            selling_price: item.price.toString(),
            discount: "0",
            tax: "0",
        }));

        const totalWeight = orderData.order.reduce((sum, item) => sum + (0.5 * item.qty), 0);

        const payload = {
            order_id: orderData.orderId,
            order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
            pickup_location: pickupNickname,
            billing_customer_name: orderData.name,
            billing_last_name: " ",
            billing_address: orderData.deliveryAddress,
            billing_city: orderData.city,
            billing_pincode: orderData.pincode,
            billing_state: orderData.state,
            billing_country: "India",
            billing_email: "orders@channelflow.in", // Placeholder email as not collected in database
            billing_phone: orderData.mobile,
            shipping_is_billing: true,
            order_items: orderItems,
            payment_method: orderData.paymentMethod?.toUpperCase() === "COD" ? "COD" : "Prepaid",
            shipping_charges: orderData.shippingFee || 0,
            total_discount: orderData.usePoint || 0,
            sub_total: orderData.subtotal,
            length: 10,
            breadth: 10,
            height: 10,
            weight: totalWeight,
        };

        console.log("📡 Sending to Shiprocket:", JSON.stringify(payload, null, 2));

        const response = await axios.post(
            "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
            console.log("✅ Shiprocket Order Created:", response.data);
            return {
                success: true,
                shiprocketOrder: response.data,
            };
        }
        return { success: false, message: "Empty response from Shiprocket" };
    } catch (error) {
        console.error("❌ Shiprocket Order Creation Error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
        };
    }
};

/**
 * Track Shipment by ID
 * @param {string} shipmentId 
 * @returns {Promise<object>}
 */
export const trackShiprocketShipment = async (shipmentId) => {
    try {
        const token = await getShiprocketToken();
        if (!token) throw new Error("Could not authenticate with Shiprocket");

        const response = await axios.get(
            `https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
            return {
                success: true,
                trackingData: response.data,
            };
        }
        return { success: false, message: "Empty response from Shiprocket" };
    } catch (error) {
        console.error("❌ Shiprocket Tracking Error:", error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message,
        };
    }
};
