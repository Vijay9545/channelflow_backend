import { model, Schema } from "mongoose";
import { dbTableName } from "../utils/constants.js";

const promotionSchema = new Schema(
    {
        active: { type: Boolean, default: false },
        imageUrl: { type: String, required: true },
        targetScreen: { type: String, required: true },
    },
    { timestamps: true }
);

export const promotionModel = model(dbTableName.PROMOTION, promotionSchema);
