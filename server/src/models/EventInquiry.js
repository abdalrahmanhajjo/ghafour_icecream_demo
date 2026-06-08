import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventInquirySchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    eventType: { type: String, default: '' }, // evBirthday, evWedding, ...
    guests: { type: String, default: '' }, // g25, g50, ...
    services: [{ type: String }], // svCart, svCake, ...
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['new', 'quoted', 'booked', 'closed'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('EventInquiry', eventInquirySchema);
