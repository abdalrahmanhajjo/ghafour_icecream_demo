import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderLineSchema = new Schema(
  {
    slug: String,
    name: { ar: String, en: String },
    qty: { type: Number, min: 1 },
    unitPrice: Number,
    lineTotal: Number,
    specs: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, default: '' },
    },
    fulfillment: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
    schedule: {
      type: { type: String, enum: ['asap', 'scheduled'], default: 'asap' },
      date: { type: String, default: '' }, // YYYY-MM-DD
      time: { type: String, default: '' }, // HH:mm
    },
    lines: [orderLineSchema],
    total: { type: Number, required: true },
    lang: { type: String, enum: ['ar', 'en'], default: 'ar' },
    status: {
      type: String,
      enum: ['new', 'confirmed', 'preparing', 'delivered', 'cancelled'],
      default: 'new',
    },
    channel: { type: String, default: 'web' },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
