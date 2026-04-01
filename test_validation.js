import { productValidation } from "./src/models/productModel.js";

const payload = {
    "variants": {
        "distributor": { "price": 120, "mrp": 2, "qty": 0, "miniOrderQty": -1 },
        "retailer": { "price": 2, "mrp": 2, "qty": 0, "miniOrderQty": -1 },
        "customer": { "price": 2, "mrp": 2, "qty": 0, "miniOrderQty": 1 }
    },
    "priceTiers": [
        { "minQty": 1, "price": 49.99 }
    ],
    "title": "sdfsdfsd",
    "description": "sfdfsd",
    "categoryName": "Industrial Tools",
    "sku": "sdfsd",
    "hsnCode": "sdfs",
    "gst": "18%",
    "categoryId": "69ba6b81476f24246ef40c96",
    "subCategoryId": "69ba6b81476f24246ef40c9d",
    "mainImage": "https://dummyimage.com/600x400/000/fff",
    "estimatedDelivery": "3 - 5 business days"
};

const { error } = productValidation.validate(payload);
if (error) {
    console.log("Validation Error:", error.details[0].message);
} else {
    console.log("Validation Passed!");
}
