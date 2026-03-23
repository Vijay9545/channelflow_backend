import {
    productModel, productValidation, idValidation
} from "../models/productModel.js";
import response from "../utils/response.js";
import { resStatusCode, resMessage, dbTableName } from "../utils/constants.js";
import { getPriceByQty } from "../utils/pricing.js";
import qs from "qs";
const SERVER_ERROR_STATUS = resStatusCode.INTERNAL_SERVER_ERROR;
const SERVER_ERROR_MESSAGE = resMessage.INTERNAL_SERVER_ERROR;

export const addSingleProduct = async (req, res) => {
    try {
        // Deeply parse the flat multipart keys created by Multer 
        // e.g. "variants[distributor][price]" -> variants.distributor.price
        req.body = qs.parse(qs.stringify(req.body));
        const mainImageFile = req.uploadedImages?.find(file => file.field === "mainImage");
        const extraImageFiles = req.uploadedImages?.filter(file => file.field === "images");
        
        let mainImage = req.body.mainImage;
        let images = req.body.images || [];
        if (!Array.isArray(images)) images = [images];

        if (mainImageFile) {
            mainImage = mainImageFile.s3Url;
        }

        if (extraImageFiles && extraImageFiles.length > 0) {
            const newImageUrls = extraImageFiles.map(file => file.s3Url);
            images = [...images, ...newImageUrls];
        }

        if (!mainImage) {
            return response.error(res, resStatusCode.CLIENT_ERROR, "Main image is required");
        };

        req.body.mainImage = mainImage;
        req.body.images = images;
        if (typeof req.body.variants !== "object" || Array.isArray(req.body.variants)) {
            return response.error(res, resStatusCode.CLIENT_ERROR, resMessage.VARIANTS_INVALID);
        };
        const { distributor, retailer, customer } = req.body.variants;
        req.body.variants = {
            distributor: {
                qty: parseInt(distributor?.qty) || distributor?.qty,
                price: parseInt(distributor?.price) || distributor?.price,
                mrp: parseInt(distributor?.mrp) || distributor?.mrp,
                miniOrderQty: parseInt(distributor?.miniOrderQty) || distributor?.miniOrderQty,
            },
            retailer: {
                qty: parseInt(retailer?.qty) || retailer?.qty,
                price: parseInt(retailer?.price) || retailer?.price,
                mrp: parseInt(retailer?.mrp) || retailer?.mrp,
                miniOrderQty: parseInt(retailer?.miniOrderQty) || retailer?.miniOrderQty,
            },
            customer: {
                qty: parseInt(customer?.qty) || customer?.qty,
                price: parseInt(customer?.price) || customer?.price,
                mrp: parseInt(customer?.mrp) || customer?.mrp,
                miniOrderQty: parseInt(customer?.miniOrderQty) || customer?.miniOrderQty,
            },
        };
        const { error } = productValidation.validate(req.body);
        if (error) {
            return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
        };
        const existingProduct = await productModel.findOne({ sku: req.body.sku });
        if (existingProduct) {
            return response.error(res, resStatusCode.FORBIDDEN, resMessage.PRODUCT_SKU_EXISTS);
        };
        const newProduct = await productModel.create({
            ...req.body,
            gst: req.body.gst ? `${req.body.gst} %` : ""
        });
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, newProduct);
    } catch (err) {
        console.error("Add Single Product Error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getProductById(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const product = await productModel.findOne({ _id: id, isDelete: false }).populate('subCategoryId');
        if (!product) {
            return response.error(res, resStatusCode.NOT_FOUND, "Product not found");
        }
        const productData = {
            ...product.toObject(),
            subCategoryId: product?.subCategoryId?._id,
            subCategoryName: product?.subCategoryId?.name,
            categoryId: product?.subCategoryId?.categoryId
        };
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, productData);
    } catch (error) {
        console.error("getSubCategoryById Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getProductList(req, res) {
    try {
        const { categoryName, minPrice, maxPrice, type, miniOrderQty, search } = req.query;
        let filter = { isActive: true };
        if ((minPrice || maxPrice) && type) {
            filter[`variants.${type}.price`] = {};
            if (minPrice) {
                filter[`variants.${type}.price`].$gte = Number(minPrice);
            };
            if (maxPrice) {
                filter[`variants.${type}.price`].$lte = Number(maxPrice);
            };
        };
        // Ensure we don't fetch soft-deleted products
        filter.isDelete = false;
        
        if (miniOrderQty && type) {
            filter[`variants.${type}.miniOrderQty`] = { $lte: Number(miniOrderQty) };
        };
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        };
        const products = await productModel.find(filter).populate({ path: "subCategoryId", populate: { path: "categoryId", model: dbTableName.CATEGORY } });

        let filteredProducts = products;
        if (categoryName) {
            filteredProducts = products.filter(
                p => p?.subCategoryId?.categoryId?.name?.toLowerCase() === categoryName?.toLowerCase()
            );
        };
        const productData = filteredProducts.map(product => ({
            ...product.toObject(),
            subCategoryId: product?.subCategoryId?._id,
            subCategoryName: product?.subCategoryId?.name,
            categoryId: product?.subCategoryId?.categoryId?._id,
            categoryName: product?.subCategoryId?.categoryId?.name,
        }));
        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, productData);
    } catch (error) {
        console.error("getProductList Error:", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function getProductPricing(req, res) {
    const { id } = req.params;
    const { qty, type } = req.query;
    console.log(`--- getProductPricing Triggered --- ID: ${id}, Qty: ${qty}, Type: ${type}`);
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    };
    try {
        const product = await productModel.findById(id).select('priceTiers title variants');
        if (!product) {
            return response.error(res, resStatusCode.NOT_FOUND, resMessage.PRODUCT_NOT_FOUND);
        };

        const result = product.priceTiers.map(tier => ({
            qty: tier.minQty,
            price: tier.price
        }));

        console.log("--- getProductPricing Response ---", JSON.stringify(result, null, 2));

        return response.success(res, resStatusCode.ACTION_COMPLETE, resMessage.ACTION_COMPLETE, result);
    } catch (error) {
        console.error("getProductPricing Error : ", error);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    };
};

export async function deleteProduct(req, res) {
    const { id } = req.params;
    const { error } = idValidation.validate({ id });
    if (error) {
        return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
    }
    try {
        const product = await productModel.findByIdAndUpdate(
            id,
            { isDelete: true, isActive: false },
            { new: true }
        );
        if (!product) {
            return response.error(res, resStatusCode.NOT_FOUND, "Product not found");
        }
        return response.success(res, resStatusCode.ACTION_COMPLETE, "Product deleted successfully", product);
    } catch (err) {
        console.error("deleteProduct Error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
};

export async function updateProduct(req, res) {
    const { id } = req.params;
    const { error: idErr } = idValidation.validate({ id });
    if (idErr) {
        return response.error(res, resStatusCode.CLIENT_ERROR, idErr.details[0].message);
    }

    try {
        // Deeply parse the flat multipart keys
        req.body = qs.parse(qs.stringify(req.body));

        const mainImageFile = req.uploadedImages?.find(file => file.field === "mainImage");
        const extraImageFiles = req.uploadedImages?.filter(file => file.field === "images");

        if (mainImageFile) {
            req.body.mainImage = mainImageFile.s3Url;
        }

        let images = req.body.images || [];
        if (!Array.isArray(images)) images = [images];

        if (extraImageFiles && extraImageFiles.length > 0) {
            const newImageUrls = extraImageFiles.map(file => file.s3Url);
            req.body.images = [...images, ...newImageUrls];
        } else {
            req.body.images = images;
        }

        // Validate the incoming updates
        const { error } = productValidation.validate(req.body);
        if (error) {
            return response.error(res, resStatusCode.CLIENT_ERROR, error.details[0].message);
        }

        const product = await productModel.findOneAndUpdate(
            { _id: id, isDelete: false },
            { $set: { ...req.body, gst: req.body.gst ? `${req.body.gst} %` : "" } },
            { new: true }
        );

        if (!product) {
            return response.error(res, resStatusCode.NOT_FOUND, "Product not found");
        }

        return response.success(res, resStatusCode.ACTION_COMPLETE, "Product updated successfully", product);
    } catch (err) {
        console.error("updateProduct Error:", err);
        return response.error(res, SERVER_ERROR_STATUS, SERVER_ERROR_MESSAGE);
    }
}