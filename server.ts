import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { Product } from "./src/models/Product.js";
import { Order } from "./src/models/Order.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;

const seedProducts = [
  {
    name: "Premium Ethiopian Coffee Beans (Yirgacheffe)",
    price: 12.99,
    description:
      "Single-origin Yirgacheffe coffee beans with bright floral notes and citrus acidity. Sourced directly from local farmers in the Gedeo Zone.",
    image: "https://picsum.photos/seed/coffee/600/600",
    shopName: "Sodo Highland Coffees",
    category: "Food & Beverage",
    moq: "5 kg",
    location: "Sodo, SNNPR, Ethiopia",
    isFeatured: true,
  },
  {
    name: "Handwoven Ethiopian Habesha Kemis Dress",
    price: 45.0,
    description:
      "Traditional Habesha Kemis dress, hand-woven with 100% cotton. Features classic white fabric with intricate border embroidery. Available in all sizes.",
    image: "https://picsum.photos/seed/dress/600/600",
    shopName: "Arba Minch Textiles",
    category: "Apparel",
    moq: "3 pieces",
    location: "Arba Minch, Ethiopia",
    isFeatured: true,
  },
  {
    name: "Industrial Water Pump (5HP)",
    price: 320.0,
    description:
      "Heavy-duty 5HP centrifugal water pump suitable for irrigation. Stainless steel impeller, flow rate 500L/min. Perfect for agricultural and industrial use.",
    image: "https://picsum.photos/seed/pump/600/600",
    shopName: "Wolaita Machinery Depot",
    category: "Industrial",
    moq: "1 unit",
    location: "Sodo, Ethiopia",
    isFeatured: true,
  },
  {
    name: "Samsung Galaxy A55 5G Smartphone",
    price: 380.0,
    description:
      "Samsung Galaxy A55 5G, 256GB storage, 8GB RAM. Factory unlocked, 50MP triple camera, 5000mAh battery. Original import with full warranty.",
    image: "https://picsum.photos/seed/phone/600/600",
    shopName: "Mekonnen Electronics",
    category: "Electronics",
    moq: "1 piece",
    location: "Sodo Market, Ethiopia",
    isFeatured: true,
  },
  {
    name: "Fresh Avocado Bulk Export (Grade A)",
    price: 0.8,
    description:
      "Grade A Hass avocados from local farms. Perfect for export and wholesale. Firm, consistent sizing, harvested weekly. Minimum order applies.",
    image: "https://picsum.photos/seed/avocado/600/600",
    shopName: "Wolaita Fresh Farms",
    category: "Food & Beverage",
    moq: "200 kg / box",
    location: "Sodo, Ethiopia",
    isFeatured: false,
  },
  {
    name: "Stainless Steel Cookware Set (12 Pieces)",
    price: 95.0,
    description:
      "Professional grade 12-piece stainless steel cookware set. Includes pots, pans, lids. Suitable for all stove types including induction. Dishwasher safe.",
    image: "https://picsum.photos/seed/cookware/600/600",
    shopName: "Desta Home Supplies",
    category: "Home & Garden",
    moq: "2 sets",
    location: "Sodo, Ethiopia",
    isFeatured: false,
  },
  {
    name: "Solar Panel 200W Monocrystalline",
    price: 110.0,
    description:
      "High efficiency 200W monocrystalline solar panel with 21% conversion efficiency. Includes mounting hardware. 25-year power output warranty. Ideal for off-grid systems.",
    image: "https://picsum.photos/seed/solar/600/600",
    shopName: "Green Energy Sodo",
    category: "Electronics",
    moq: "4 panels",
    location: "Sodo, Ethiopia",
    isFeatured: false,
  },
  {
    name: "Natural Shea Butter (Unrefined, 1kg)",
    price: 8.5,
    description:
      "100% pure unrefined shea butter sourced from West African shea trees. Rich in vitamins A and E. Ideal for skin and hair care product manufacturing.",
    image: "https://picsum.photos/seed/shea/600/600",
    shopName: "Sodo Natural Beauty Co.",
    category: "Beauty",
    moq: "20 kg",
    location: "Sodo, Ethiopia",
    isFeatured: false,
  },
];

async function seedProductsIfEmpty() {
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    console.log("Seeding database with sample products...");
    await Product.insertMany(seedProducts);
    console.log(`✅ Seeded ${seedProducts.length} products into MongoDB.`);
  }
}

async function initDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set (expected in .env)");
  }

  await mongoose.connect(MONGODB_URI, {
    // Additional mongoose options can go here
    autoIndex: true,
  });

  await seedProductsIfEmpty();
}

const startTime = Date.now();

async function startServer() {
  await initDb();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    try {
      const products = await Product.countDocuments();
      const orders = await Order.countDocuments();

      res.json({
        status: "ok",
        db: "mongodb",
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        products,
        orders,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ status: "error", db: "disconnected", error: String(error) });
    }
  });

  // ── Products ──────────────────────────────────────────────────────────────
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await Product.find().sort({ isFeatured: -1, createdAt: -1 }).lean();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/add", async (req, res) => {
    try {
      const { name, price, description, image, shopName, category, moq, location, isFeatured } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Product name is required" });
      }

      if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: "A valid positive price is required" });
      }

      if (!image || typeof image !== "string" || image.trim() === "") {
        return res.status(400).json({ error: "Product image URL is required" });
      }

      const product = await Product.create({
        name: name.trim(),
        price: Number(price),
        description: description || "",
        image: image.trim(),
        shopName: shopName || "Unknown Shop",
        category: category || "General",
        moq: moq || "1 piece",
        location: location || "Sodo, Ethiopia",
        isFeatured: Boolean(isFeatured),
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ error: "Failed to add product" });
    }
  });

  app.patch("/api/admin/featured/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;

      const updated = await Product.findByIdAndUpdate(
        id,
        { isFeatured: Boolean(isFeatured) },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product featured status updated" });
    } catch (error) {
      console.error("Error updating featured status:", error);
      res.status(500).json({ error: "Failed to update featured status" });
    }
  });

  app.patch("/api/admin/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, description, image, shopName, category, moq, location, isFeatured } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Product name is required" });
      }

      if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ error: "A valid positive price is required" });
      }

      const updated = await Product.findByIdAndUpdate(
        id,
        {
          name: name.trim(),
          price: Number(price),
          description: description || "",
          image: image || "",
          shopName: shopName || "Unknown Shop",
          category: category || "General",
          moq: moq || "1 piece",
          location: location || "Sodo, Ethiopia",
          isFeatured: Boolean(isFeatured),
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product updated successfully" });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Product.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ── Orders ────────────────────────────────────────────────────────────────
  app.post("/api/orders", async (req, res) => {
    const { items, totalAmount } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item" });
    }

    try {
      const order = await Order.create({
        totalAmount: Number(totalAmount) || 0,
        items: items.map((item: any) => ({
          productId: item.id,
          quantity: Number(item.quantity) || 0,
          priceAtTime: Number(item.price) || 0,
          category: item.category || "General",
        })),
      });

      res.status(201).json({ id: order._id, message: "Order placed successfully" });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  // ── Admin Stats ───────────────────────────────────────────────────────────
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const totalOrders = await Order.countDocuments();
      const totalProducts = await Product.countDocuments();

      const [avgOrderValue] = await Order.aggregate([
        { $group: { _id: null, avg: { $avg: "$totalAmount" } } },
      ]);

      const [totalRevenue] = await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);

      const topCategories = await Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            total_sold: { $sum: "$items.quantity" },
          },
        },
        { $sort: { total_sold: -1 } },
        { $limit: 5 },
        { $project: { category: "$_id", total_sold: 1, _id: 0 } },
      ]);

      res.json({
        totalOrders,
        avgOrderValue: Number(avgOrderValue?.avg ?? 0),
        topCategories,
        totalRevenue: Number(totalRevenue?.total ?? 0),
        totalProducts,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // ── Vite / Static ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, ".")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
  }

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }
    console.error("Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
