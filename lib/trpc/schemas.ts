import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { villas, bookings, walletConfig, hostInvitations } from "@/lib/db/schema";

// Villa schemas
export const insertVillaSchema = createInsertSchema(villas, {
  name: z.string().min(1, "Name is required"),
  pricePerNight: z.string().or(z.number()).transform((val) => String(val)),
  maxGuests: z.number().int().min(1).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVillaSchema = insertVillaSchema.partial();

export const selectVillaSchema = createSelectSchema(villas);

// Booking schemas
export const createBookingSchema = z.object({
  villaId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  guests: z.number().int().min(1),
  cryptoCurrency: z.enum(["btc", "eth", "usdt_eth", "usdt_bsc"]),
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "paid", "confirmed", "cancelled", "completed"]).optional(),
  txHash: z.string().optional(),
  adminNotes: z.string().optional(),
});

export const selectBookingSchema = createSelectSchema(bookings);

// Wallet config schemas
export const updateWalletSchema = createInsertSchema(walletConfig, {
  btcAddress: z.string().optional(),
  ethAddress: z.string().optional(),
  usdtEthAddress: z.string().optional(),
  usdtBscAddress: z.string().optional(),
}).omit({
  id: true,
  updatedAt: true,
  updatedBy: true,
});

// Host invitation schemas
export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

export const selectInvitationSchema = createSelectSchema(hostInvitations);

// Query parameter schemas
export const villaQuerySchema = z.object({
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.number().int().min(1).optional(),
});

export const bookingQuerySchema = z.object({
  status: z.enum(["pending", "paid", "confirmed", "cancelled", "completed"]).optional(),
  villaId: z.string().uuid().optional(),
});

export const calendarQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const hostStatsQuerySchema = z.object({
  preset: z.enum(["7d", "30d", "90d", "365d", "all"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const priceQuerySchema = z.object({
  amount: z.number().positive().optional(),
});

export const verifyBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

export const invitationTokenSchema = z.object({
  token: z.string().min(1),
});

// Export types
export type InsertVilla = z.infer<typeof insertVillaSchema>;
export type UpdateVilla = z.infer<typeof updateVillaSchema>;
export type CreateBooking = z.infer<typeof createBookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;
export type UpdateWallet = z.infer<typeof updateWalletSchema>;
export type CreateInvitation = z.infer<typeof createInvitationSchema>;
