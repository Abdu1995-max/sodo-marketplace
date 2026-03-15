import mongoose from "mongoose";

export interface ProductDocument extends mongoose.Document {
  name: string;
  price: number;
  description?: string;
  image: string;
  category: string;
  shopName?: string;
  moq?: string;
  location?: string;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    image: { type: String, required: true, trim: true },
    category: { type: String, default: "General" },
    shopName: { type: String, default: "Unknown Shop" },
    moq: { type: String, default: "1 piece" },
    location: { type: String, default: "Sodo, Ethiopia" },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
