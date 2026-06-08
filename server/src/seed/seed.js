import 'dotenv/config';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Item from '../models/Item.js';
import Config from '../models/Config.js';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demo = JSON.parse(readFileSync(path.join(__dirname, '..', 'data', 'demo.json'), 'utf8'));

// Seeds the DB. Assumes a live mongoose connection (caller manages connect/close).
export async function seedDatabase() {
  await Category.deleteMany({});
  await Category.insertMany(
    demo.categories.map((c) => ({ key: c.key, labels: c.labels, sort: c.sort, active: true }))
  );

  await Item.deleteMany({});
  const featured = new Set(['arabic_mix', 'fruit_cup', 'chocolate_scoop']);
  await Item.insertMany(
    demo.items.map((it, idx) => ({
      slug: it.id,
      category: it.cat,
      price: it.price,
      image: it.image,
      maxFlavors: it.maxFlavors || 0,
      leadDays: it.leadDays || 0,
      ar: it.ar,
      en: it.en,
      featured: featured.has(it.id),
      available: true,
      sort: idx,
    }))
  );

  await Config.findOneAndUpdate(
    { key: 'options' },
    { key: 'options', optionGroups: demo.optionGroups, optionPrices: demo.optionPrices },
    { upsert: true }
  );

  const email = (process.env.ADMIN_EMAIL || 'admin@ghafour.com').toLowerCase();
  const passwordHash = await User.hashPassword(process.env.ADMIN_PASSWORD || 'change-this-password');
  await User.findOneAndUpdate(
    { email },
    { email, passwordHash, name: process.env.ADMIN_NAME || 'Ghafour Admin', role: 'admin' },
    { upsert: true }
  );

  return {
    categories: demo.categories.length,
    items: demo.items.length,
    admin: email,
  };
}

// CLI entry: `npm run seed`
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  (async () => {
    await connectDB();
    const r = await seedDatabase();
    console.log(`Seeded ${r.categories} categories, ${r.items} items, admin ${r.admin}`);
    await mongoose.connection.close();
    console.log('Done.');
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
