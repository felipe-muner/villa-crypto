import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["guest", "admin"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "paid",
  "confirmed",
  "cancelled",
  "completed",
]);

export const cryptoCurrencyEnum = pgEnum("crypto_currency", [
  "btc",
  "eth",
  "usdt_eth",
  "usdt_bsc",
]);

// Users table
export const users = pgTable("users", {
  email: text("email").primaryKey(),
  name: text("name"),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("guest").notNull(),
  isHost: boolean("is_host").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Villas table
export const villas = pgTable("villas", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerEmail: text("owner_email").references(() => users.email),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }).notNull(),
  images: text("images").array().default([]),
  amenities: text("amenities").array().default([]),
  maxGuests: integer("max_guests").default(1),
  bedrooms: integer("bedrooms").default(1),
  bathrooms: integer("bathrooms").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: uuid("villa_id")
    .references(() => villas.id, { onDelete: "cascade" })
    .notNull(),
  userEmail: text("user_email")
    .references(() => users.email, { onDelete: "cascade" })
    .notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  guests: integer("guests").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  cryptoCurrency: cryptoCurrencyEnum("crypto_currency").notNull(),
  cryptoAmount: decimal("crypto_amount", { precision: 18, scale: 8 }),
  txHash: text("tx_hash"),
  status: bookingStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Host invitations table
export const hostInvitations = pgTable("host_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  invitedBy: text("invited_by").references(() => users.email).notNull(),
  token: text("token").notNull().unique(),
  status: text("status").default("pending").notNull(), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wallet configuration (single row table)
export const walletConfig = pgTable("wallet_config", {
  id: integer("id").primaryKey().default(1),
  btcAddress: text("btc_address"),
  ethAddress: text("eth_address"),
  usdtEthAddress: text("usdt_eth_address"),
  usdtBscAddress: text("usdt_bsc_address"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by").references(() => users.email),
});

// Blocked dates table (host can block dates for their villas)
export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").defaultRandom().primaryKey(),
  villaId: uuid("villa_id")
    .references(() => villas.id, { onDelete: "cascade" })
    .notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  createdBy: text("created_by").references(() => users.email).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
