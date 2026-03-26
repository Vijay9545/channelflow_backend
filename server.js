"use strict"
import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import apiRouter from "./src/routes/index.js";
import connectDB from "./db/dbconnect.js";
import cron from "node-cron";

const dotenv = await import("dotenv");
dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8001;

connectDB();
app.use(cors());
app.use(helmet());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));

app.use("/api", apiRouter);

app.get('/', (req, res) => {
  res.send(`<h1>Walcom to Molimor Channel Flow</h1>`);
});

// Temporary debug route to check DB counts
import { categoryModel } from "./src/models/categoryModel.js";
import { subCategoryModel } from "./src/models/subCategoryModel.js";
import { productModel } from "./src/models/productModel.js";

app.get('/debug-db', async (req, res) => {
  try {
    const categoryCount = await categoryModel.countDocuments();
    const subCategoryCount = await subCategoryModel.countDocuments();
    const productCount = await productModel.countDocuments();
    res.json({
      success: true,
      database: mongoose.connection.name,
      counts: {
        categories: categoryCount,
        subCategories: subCategoryCount,
        products: productCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

cron.schedule("*/10 * * * *", async () => {
  try {
    const response = await fetch("https://channel-flow.onrender.com/api/user/serverNotSleep");
    const data = await response.json();
    console.log("Cron Ping Response:", data);
  } catch (error) {
    console.error("Cron Ping Failed:", error);
  };
});

app.listen(port, "0.0.0.0", () => {
  console.debug(`\x1b[32m✔ Server Started Successfully\x1b[0m \x1b[36m→ Now listening on Port: ${port}\x1b[0m`);
});