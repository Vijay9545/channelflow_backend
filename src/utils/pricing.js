/**
 * Calculates the price of a product based on the quantity requested, using the product's price tiers.
 * The price is determined by finding the highest `minQty` tier that is less than or equal to the requested `quantity`.
 * 
 * @param {Object} product - The product object containing `priceTiers` array and `variants`.
 * @param {Number} quantity - The requested quantity.
 * @param {String} [type] - Optional user type ('distributor', 'retailer', 'customer') to fall back to variant price if tiers are empty.
 * @returns {Number|null} - The calculated price, or null if no price is available.
 */
export const getPriceByQty = (product, quantity, type = null) => {
    // Basic validation
    if (!product || typeof quantity !== 'number' || quantity < 1) {
        return null;
    }

    // Sort priceTiers in descending order based on minQty
    // So the highest applicable minQty is the first one we find
    const tiers = product.priceTiers || [];
    if (tiers.length > 0) {
        // We avoid mutating the original array by sorting a copy
        const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
        
        for (const tier of sortedTiers) {
            if (quantity >= tier.minQty) {
                return tier.price;
            }
        }
    }
    
    // Fallback: If no tiers match (e.g., quantity is less than the lowest tier's minQty)
    // or if the product has no tiers at all, we could fall back to the old variant-based pricing logic.
    if (type && product.variants && product.variants[type]) {
         return product.variants[type].price;
    }
    
    // If no fallback is provided, and we didn't find a matching tier, return null
    return null;
};
