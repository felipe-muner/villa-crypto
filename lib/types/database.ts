import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  users,
  villas,
  bookings,
  walletConfig,
  hostInvitations,
} from "@/lib/db/schema";

// User types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UserRole = "guest" | "admin";

// Villa types
export type Villa = InferSelectModel<typeof villas>;
export type NewVilla = InferInsertModel<typeof villas>;

// Booking types
export type Booking = InferSelectModel<typeof bookings>;
export type NewBooking = InferInsertModel<typeof bookings>;
export type BookingStatus = "pending" | "paid" | "confirmed" | "cancelled" | "completed";
export type CryptoCurrency = "btc" | "eth" | "usdt_eth" | "usdt_bsc";

// Wallet config types
export type WalletConfig = InferSelectModel<typeof walletConfig>;
export type NewWalletConfig = InferInsertModel<typeof walletConfig>;

// Host invitation types
export type HostInvitation = InferSelectModel<typeof hostInvitations>;
export type NewHostInvitation = InferInsertModel<typeof hostInvitations>;
export type InvitationStatus = "pending" | "accepted" | "expired";

// Extended types for API responses
export interface VillaWithBookings extends Villa {
  bookings?: Booking[];
}

export interface BookingWithVilla extends Booking {
  villa?: Villa;
  user?: User;
}

// Crypto price types
export interface CryptoPrices {
  btc: number;
  eth: number;
  usdt: number;
}

// Booking request from client
export interface CreateBookingRequest {
  villaId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  cryptoCurrency: CryptoCurrency;
}

// Wallet address update request
export interface UpdateWalletRequest {
  btcAddress?: string;
  ethAddress?: string;
  usdtEthAddress?: string;
  usdtBscAddress?: string;
}
