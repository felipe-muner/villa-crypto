import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  users,
  villas,
  walletConfig,
  bookings,
} from "../lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await db.delete(bookings);
  await db.delete(villas);
  await db.delete(walletConfig);
  await db.delete(users);

  // Create admin user
  console.log("Creating users...");
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || ["admin@example.com"];

  await db.insert(users).values([
    {
      email: adminEmails[0],
      name: "Admin User",
      role: "admin",
    },
    {
      email: "guest@example.com",
      name: "Test Guest",
      role: "guest",
    },
  ]);

  // Create wallet config with test addresses
  console.log("Creating wallet config...");
  await db.insert(walletConfig).values({
    id: 1,
    btcAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ethAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bB0E",
    usdtEthAddress: "0xF88b52d540b0BE21df1b0Afd04aAd7aD211Cb911",
    usdtBscAddress: "0xF88b52d540b0BE21df1b0Afd04aAd7aD211Cb911",
  });

  // Create sample villas
  console.log("Creating villas...");
  const [villa1, villa2, villa3] = await db
    .insert(villas)
    .values([
      {
        name: "Oceanfront Paradise Villa",
        description:
          "Stunning beachfront villa with panoramic ocean views. Features a private infinity pool, direct beach access, and modern amenities throughout. Perfect for a luxury getaway.",
        location: "Koh Phangan, Thailand",
        pricePerNight: "10.00",
        images: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        ],
        amenities: [
          "Private Pool",
          "Ocean View",
          "WiFi",
          "Air Conditioning",
          "Kitchen",
          "Beach Access",
          "Parking",
        ],
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        isActive: true,
      },
      {
        name: "Mountain Retreat Chalet",
        description:
          "Cozy mountain chalet surrounded by nature. Features a fireplace, hot tub, and breathtaking mountain views. Ideal for ski trips or summer hiking adventures.",
        location: "Koh Phangan, Thailand",
        pricePerNight: "10.00",
        images: [
          "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800",
          "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800",
        ],
        amenities: [
          "Hot Tub",
          "Fireplace",
          "Mountain View",
          "WiFi",
          "Heating",
          "Kitchen",
          "Ski Storage",
        ],
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 2,
        isActive: true,
      },
      {
        name: "Tropical Garden Villa",
        description:
          "Beautiful villa set in lush tropical gardens. Features traditional architecture with modern comforts, a private pool, and outdoor dining area.",
        location: "Koh Phangan, Thailand",
        pricePerNight: "10.00",
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        ],
        amenities: [
          "Private Pool",
          "Garden",
          "WiFi",
          "Air Conditioning",
          "Kitchen",
          "BBQ",
          "Outdoor Shower",
        ],
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        isActive: true,
      },
    ])
    .returning();

  // Create sample bookings
  console.log("Creating sample bookings...");

  // Booking 1: Oceanfront Paradise Villa - Jan 20-22, 2026 (2 nights)
  const checkIn1 = new Date("2026-01-20");
  const checkOut1 = new Date("2026-01-22");

  await db.insert(bookings).values({
    villaId: villa1.id,
    userEmail: "guest@example.com",
    checkIn: checkIn1,
    checkOut: checkOut1,
    guests: 2,
    totalPrice: "20.00", // 2 nights * $10
    cryptoCurrency: "usdt_eth",
    cryptoAmount: "20.47",
    status: "confirmed",
  });

  // Booking 2: Mountain Retreat Chalet - Jan 18-20, 2026 (2 nights)
  const checkIn2 = new Date("2026-01-18");
  const checkOut2 = new Date("2026-01-20");

  await db.insert(bookings).values({
    villaId: villa2.id,
    userEmail: "guest@example.com",
    checkIn: checkIn2,
    checkOut: checkOut2,
    guests: 4,
    totalPrice: "20.00", // 2 nights * $10
    cryptoCurrency: "btc",
    cryptoAmount: "0.00019",
    status: "paid",
  });

  console.log("\n✅ Database seeded successfully!");
  console.log("\nCreated:");
  console.log("  - 2 users (1 admin, 1 guest)");
  console.log("  - 1 wallet configuration");
  console.log("  - 3 villas");
  console.log("  - 2 sample bookings");
  console.log("\nYou can now login with your Google account.");
  console.log(`Admin email: ${adminEmails[0]}`);
}

seed()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
    process.exit(0);
  });
