import mongoose from "mongoose";

export interface OrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  priceAtTime: number;
  category: string;
}

export interface OrderDocument extends mongoose.Document {
  totalAmount: number;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema<OrderItem>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 },
    priceAtTime: { type: Number, required: true, min: 0 },
    category: { type: String, default: "General" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<OrderDocument>(
  {
    totalAmount: { type: Number, required: true, min: 0 },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
