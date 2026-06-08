import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    labels: {
      ar: { type: String, required: true },
      en: { type: String, required: true },
    },
    sort: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
