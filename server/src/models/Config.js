import mongoose from 'mongoose';

const { Schema } = mongoose;

// Single document (key: 'options') holding the customization catalog + price
// modifiers, so the admin can tune toppings/sizes/prices without code changes.
const configSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'options' },
    optionGroups: { type: Schema.Types.Mixed, default: {} },
    optionPrices: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model('Config', configSchema);
