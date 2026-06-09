import mongoose from 'mongoose';

const { Schema } = mongoose;

const localizedSchema = new Schema(
  {
    name: { type: String, required: true },
    desc: { type: String, default: '' },
  },
  { _id: false }
);

const itemSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true }, // demo "id"
    category: { type: String, required: true, index: true }, // category.key
    price: { type: Number, required: true, min: 0 }, // base price
    image: { type: String, default: '' },
    maxFlavors: { type: Number, default: 0 }, // cap for boxes / cakes
    leadDays: { type: Number, default: 0 }, // advance notice (cakes)
    ar: { type: localizedSchema, required: true },
    en: { type: localizedSchema, required: true },
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    sort: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Public menu query (available items by category, ordered) + featured strip.
itemSchema.index({ available: 1, category: 1, sort: 1 });
itemSchema.index({ featured: 1, available: 1 });

export default mongoose.model('Item', itemSchema);
