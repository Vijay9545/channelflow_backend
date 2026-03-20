import { getPriceByQty } from "./src/utils/pricing.js";

// 1. Create a dummy product with the new priceTiers schema
const dummyProduct = {
    _id: "test-product-id-123",
    title: "Test Premium Item",
    variants: {
        customer: { qty: 100, price: 100, mrp: 120, miniOrderQty: 1 }
    },
    priceTiers: [
        { minQty: 1, price: 100 },
        { minQty: 10, price: 90 },
        { minQty: 50, price: 75 },
        { minQty: 100, price: 60 } // Super bulk discount
    ]
};

console.log("=========================================");
console.log("🧪 TESTING DYNAMIC QUANTITY PRICING 🧪");
console.log("=========================================\n");

// Test Cases
const testCases = [
    { qty: 1, type: "customer", expectedPrice: 100, name: "Single Item (Base Price)" },
    { qty: 5, type: "customer", expectedPrice: 100, name: "Under 10 Items (Base Price)" },
    { qty: 10, type: "customer", expectedPrice: 90, name: "Exactly 10 Items (First Tier)" },
    { qty: 25, type: "customer", expectedPrice: 90, name: "Between 10 and 50 Items (First Tier)" },
    { qty: 50, type: "customer", expectedPrice: 75, name: "Exactly 50 Items (Second Tier)" },
    { qty: 150, type: "customer", expectedPrice: 60, name: "Over 100 Items (Third Tier)" },
    { qty: 0, type: "customer", expectedPrice: null, name: "Invalid Quantity (Zero)" },
];

let allPassed = true;

for (const test of testCases) {
    const calculatedPrice = getPriceByQty(dummyProduct, test.qty, test.type);
    
    // Check if test passed
    const passed = calculatedPrice === test.expectedPrice;
    if (!passed) allPassed = false;

    // Formatting Output
    const status = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} | ${test.name}`);
    console.log(`    Requested Qty : ${test.qty}`);
    console.log(`    Expected Price: ${test.expectedPrice}`);
    console.log(`    Actual Price  : ${calculatedPrice}`);
    console.log(`    Total Cost    : ${calculatedPrice ? (calculatedPrice * test.qty) : "N/A"}\n`);
}

console.log("=========================================");
if (allPassed) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! The pricing logic is bulletproof. 🎉");
} else {
    console.log("⚠️ SOME TESTS FAILED. Please check the logs. ⚠️");
}
console.log("=========================================");
