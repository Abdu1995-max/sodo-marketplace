import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
const { Pool } = pg;
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Initialize Tables
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT,
        shopName TEXT,
        category TEXT DEFAULT 'General',
        moq TEXT DEFAULT '1 piece',
        location TEXT DEFAULT 'Sodo, Ethiopia',
        isFeatured INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        total_amount REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_time REAL NOT NULL,
        category TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
    console.log("✅ Database tables initialized.");

    // Seed database with sample products if empty
    const { rows } = await client.query("SELECT COUNT(*) as count FROM products");
    const productCount = parseInt(rows[0].count);
    
    if (productCount === 0) {
      console.log("Seeding database with sample products...");
      const seedProducts = [
        {
          name: "Premium Ethiopian Coffee Beans (Yirgacheffe)",
          price: 12.99,
          description: "Single-origin Yirgacheffe coffee beans with bright floral notes and citrus acidity. Sourced directly from local farmers in the Gedeo Zone.",
          image: "https://picsum.photos/seed/coffee/600/600",
          shopName: "Sodo Highland Coffees",
          category: "Food & Beverage",
          moq: "5 kg",
          location: "Sodo, SNNPR, Ethiopia",
          isFeatured: 1,
        },
        {
          name: "Handwoven Ethiopian Habesha Kemis Dress",
          price: 45.00,
          description: "Traditional Habesha Kemis dress, hand-woven with 100% cotton. Features classic white fabric with intricate border embroidery. Available in all sizes.",
          image: "https://picsum.photos/seed/dress/600/600",
          shopName: "Arba Minch Textiles",
          category: "Apparel",
          moq: "3 pieces",
          location: "Arba Minch, Ethiopia",
          isFeatured: 1,
        },
        {
          name: "Industrial Water Pump (5HP)",
          price: 320.00,
          description: "Heavy-duty 5HP centrifugal water pump suitable for irrigation. Stainless steel impeller, flow rate 500L/min. Perfect for agricultural and industrial use.",
          image: "https://picsum.photos/seed/pump/600/600",
          shopName: "Wolaita Machinery Depot",
          category: "Industrial",
          moq: "1 unit",
          location: "Sodo, Ethiopia",
          isFeatured: 1,
        },
        {
          name: "Samsung Galaxy A55 5G Smartphone",
          price: 380.00,
          description: "Samsung Galaxy A55 5G, 256GB storage, 8GB RAM. Factory unlocked, 50MP triple camera, 5000mAh battery. Original import with full warranty.",
          image: "https://picsum.photos/seed/phone/600/600",
          shopName: "Mekonnen Electronics",
          category: "Electronics",
          moq: "1 piece",
          location: "Sodo Market, Ethiopia",
          isFeatured: 1,
        },
        {
          name: "Fresh Avocado Bulk Export (Grade A)",
          price: 0.80,
          description: "Grade A Hass avocados from local farms. Perfect for export and wholesale. Firm, consistent sizing, harvested weekly. Minimum order applies.",
          image: "https://picsum.photos/seed/avocado/600/600",
          shopName: "Wolaita Fresh Farms",
          category: "Food & Beverage",
          moq: "200 kg / box",
          location: "Sodo, Ethiopia",
          isFeatured: 0,
        },
        {
          name: "Stainless Steel Cookware Set (12 Pieces)",
          price: 95.00,
          description: "Professional grade 12-piece stainless steel cookware set. Includes pots, pans, lids. Suitable for all stove types including induction. Dishwasher safe.",
          image: "https://picsum.photos/seed/cookware/600/600",
          shopName: "Desta Home Supplies",
          category: "Home & Garden",
          moq: "2 sets",
          location: "Sodo, Ethiopia",
          isFeatured: 0,
        },
        {
          name: "Solar Panel 200W Monocrystalline",
          price: 110.00,
          description: "High efficiency 200W monocrystalline solar panel with 21% conversion efficiency. Includes mounting hardware. 25-year power output warranty. Ideal for off-grid systems.",
          image: "https://picsum.photos/seed/solar/600/600",
          shopName: "Green Energy Sodo",
          category: "Electronics",
          moq: "4 panels",
          location: "Sodo, Ethiopia",
          isFeatured: 0,
        },
        {
          name: "Natural Shea Butter (Unrefined, 1kg)",
          price: 8.50,
          description: "100% pure unrefined shea butter sourced from West African shea trees. Rich in vitamins A and E. Ideal for skin and hair care product manufacturing.",
          image: "https://picsum.photos/seed/shea/600/600",
          shopName: "Sodo Natural Beauty Co.",
          category: "Beauty",
          moq: "20 kg",
          location: "Sodo, Ethiopia",
          isFeatured: 0,
        },
      ];

      for (const p of seedProducts) {
        await client.query(
          "INSERT INTO products (name, price, description, image, shopName, category, moq, location, isFeatured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [p.name, p.price, p.description, p.image, p.shopName, p.category, p.moq, p.location, p.isFeatured]
        );
      }
      console.log(`✅ Seeded ${seedProducts.length} products into the database.`);
    }
  } catch (err) {
    console.error("❌ Error initializing/seeding database:", err);
  } finally {
    client.release();
  }
}

initDb();

const startTime = Date.now();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    try {
      const productRes = await pool.query("SELECT COUNT(*) as count FROM products");
      const orderRes = await pool.query("SELECT COUNT(*) as count FROM orders");
      res.json({
        status: "ok",
        db: "connected",
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
        products: productRes.rows[0].count,
        orders: orderRes.rows[0].count,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ status: "error", db: "disconnected", error: String(error) });
    }
  });

  // ── Products ──────────────────────────────────────────────────────────────
  app.get("/api/products", async (_req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM products ORDER BY isFeatured DESC, id DESC");
      res.json(rows);
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

      const result = await pool.query(
        "INSERT INTO products (name, price, description, image, shopName, category, moq, location, isFeatured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
        [
          name.trim(),
          Number(price),
          description || "",
          image.trim(),
          shopName || "Unknown Shop",
          category || "General",
          moq || "1 piece",
          location || "Sodo, Ethiopia",
          isFeatured ? 1 : 0
        ]
      );
      res.status(201).json({
        id: result.rows[0].id,
        name: name.trim(), price: Number(price), description, image: image.trim(),
        shopName: shopName || "Unknown Shop",
        category: category || "General",
        moq: moq || "1 piece",
        location: location || "Sodo, Ethiopia",
        isFeatured: !!isFeatured,
      });
    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ error: "Failed to add product" });
    }
  });

  app.patch("/api/admin/featured/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;
      const result = await pool.query("UPDATE products SET isFeatured = $1 WHERE id = $2", [isFeatured ? 1 : 0, id]);
      if (result.rowCount === 0) {
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
      const result = await pool.query(
        "UPDATE products SET name=$1, price=$2, description=$3, image=$4, shopName=$5, category=$6, moq=$7, location=$8, isFeatured=$9 WHERE id=$10",
        [
          name.trim(), Number(price), description || "", image || "",
          shopName || "Unknown Shop", category || "General",
          moq || "1 piece", location || "Sodo, Ethiopia",
          isFeatured ? 1 : 0, id
        ]
      );
      if (result.rowCount === 0) {
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
      const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
      if (result.rowCount === 0) {
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const orderResult = await client.query("INSERT INTO orders (total_amount) VALUES ($1) RETURNING id", [totalAmount]);
      const orderId = orderResult.rows[0].id;

      for (const item of items) {
        await client.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price_at_time, category) VALUES ($1, $2, $3, $4, $5)",
          [orderId, item.id, item.quantity, item.price, item.category || "General"]
        );
      }
      await client.query("COMMIT");
      res.status(201).json({ id: orderId, message: "Order placed successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error placing order:", error);
      res.status(500).json({ error: "Failed to place order" });
    } finally {
      client.release();
    }
  });

  // ── Admin Stats ───────────────────────────────────────────────────────────
  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const totalOrders = await pool.query("SELECT COUNT(*) as count FROM orders");
      const avgOrderValue = await pool.query("SELECT AVG(total_amount) as avg FROM orders");
      const topCategories = await pool.query(`
        SELECT category, SUM(quantity) as total_sold
        FROM order_items
        GROUP BY category
        ORDER BY total_sold DESC
        LIMIT 5
      `);
      const totalRevenue = await pool.query("SELECT SUM(total_amount) as total FROM orders");
      const totalProducts = await pool.query("SELECT COUNT(*) as count FROM products");

      res.json({
        totalOrders: parseInt(totalOrders.rows[0].count) || 0,
        avgOrderValue: parseFloat(avgOrderValue.rows[0].avg) || 0,
        topCategories: topCategories.rows || [],
        totalRevenue: parseFloat(totalRevenue.rows[0].total) || 0,
        totalProducts: parseInt(totalProducts.rows[0].count) || 0,
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌍 Mode: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer();
