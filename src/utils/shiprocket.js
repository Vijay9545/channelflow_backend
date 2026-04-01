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
            console.error("❌ SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set in .env", { email: email?.length, password: password?.length });
            return null;
        }

        console.log("📡 Attempting Shiprocket Login for:", email);

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
        if (error.response?.data) {
             console.error("❌ Full Shiprocket Auth Error Response:", JSON.stringify(error.response.data, null, 2));
        }
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
/**
 * Get Primary Pickup Pincode
 * @param {string} token 
 * @returns {Promise<string>}
 */
export const getPrimaryPickupPincode = async (token) => {
    const locations = await getPickupLocations(token);
    if (locations.length > 0) {
        const primary = locations.find((l) => l.is_primary === 1) || locations.data?.[0] || locations[0];
        return primary.pin_code?.toString() || "110001";
    }
    return "110001"; // Fallback
};

/**
 * Get Shipping Rates / Serviceability
 * @param {object} data { delivery_postcode, weight, cod }
 * @returns {Promise<object>}
 */
export const getShippingRates = async (data) => {
    try {
        const token = await getShiprocketToken();
        if (!token) throw new Error("Could not authenticate with Shiprocket");

        const pickupPincode = await getPrimaryPickupPincode(token);

        const params = {
            pickup_postcode: pickupPincode,
            delivery_postcode: data.delivery_postcode,
            weight: data.weight,
            cod: data.cod ? 1 : 0,
        };

        const response = await axios.get("https://apiv2.shiprocket.in/v1/external/courier/serviceability/", {
            params,
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.status === 200) {
            const couriers = response.data.data.available_courier_companies;
            if (couriers && couriers.length > 0) {
                // Cheapest rate
                const sorted = couriers.sort((a, b) => a.freight_charge - b.freight_charge);
                return {
                    success: true,
                    rate: sorted[0].freight_charge,
                    courier: sorted[0].courier_name,
                    estimated_delivery: sorted[0].etd,
                };
            }
        }
        return { success: false, message: "No service available for this pincode" };
    } catch (error) {
        console.error("❌ Shiprocket Rate Error:", error.response?.data || error.message);
        return { success: false, error: error.message };
    }
};
