# Villa Crypto

A luxury villa rental platform with cryptocurrency payment support built with Next.js 16, Drizzle ORM, and NextAuth.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Neon)
- **ORM:** Drizzle ORM
- **Authentication:** NextAuth v5 (Google OAuth)
- **Styling:** Tailwind CSS v4
- **Image Storage:** Vercel Blob
- **Payments:** Ethereum (ethers.js)

## Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- Google OAuth credentials
- Vercel Blob token (for image uploads)

## Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Fill in the required environment variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host.neon.tech/villa-crypto?sslmode=require

# NextAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Push the database schema:

```bash
npm run db:push
```

3. (Optional) Seed the database with sample data:

```bash
npm run db:seed
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migrations from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema changes directly to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (push + seed) |

## User Profiles & Pages

The platform has three user roles: **Guest**, **Host**, and **Admin**.

### Guest (Default User)

Any authenticated user can browse and book villas.

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing page with featured villas |
| Villas | `/villas` | Browse and search available villas |
| Villa Details | `/villas/[id]` | View villa details and book |
| My Bookings | `/bookings` | View all personal bookings |
| Booking Details | `/bookings/[id]` | View booking details and payment status |
| Login | `/login` | Google OAuth login |

### Host

Users invited by admins to manage their own villas.

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/host` | Host overview and stats |
| My Villas | `/host/villas` | List of host-owned villas |
| Add Villa | `/host/villas/new` | Create a new villa listing |
| Edit Villa | `/host/villas/[id]/edit` | Edit villa details |
| Bookings | `/host/bookings` | View bookings for owned villas |
| Booking Details | `/host/bookings/[id]` | Manage individual booking |

### Admin

Users with emails in the `ADMIN_EMAILS` environment variable.

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/admin` | Admin overview with platform stats |
| All Villas | `/admin/villas` | Manage all villas on platform |
| Add Villa | `/admin/villas/new` | Create a new villa |
| View Villa | `/admin/villas/[id]` | View villa details |
| Edit Villa | `/admin/villas/[id]/edit` | Edit any villa |
| All Bookings | `/admin/bookings` | Manage all bookings |
| Booking Details | `/admin/bookings/[id]` | View/manage booking details |
| Calendar | `/admin/calendar` | Calendar view of all bookings |
| Hosts | `/admin/hosts` | Manage host accounts and invitations |
| Settings | `/admin/settings` | Platform settings |

### Special Pages

| Page | Path | Description |
|------|------|-------------|
| Host Invite | `/invite/[token]` | Accept host invitation link |

## Features

### Crypto Payments

The platform supports cryptocurrency payments for villa bookings:

**Supported Cryptocurrencies:**
- **BTC** - Bitcoin
- **ETH** - Ethereum
- **USDT (ERC-20)** - Tether on Ethereum network
- **USDT (BEP-20)** - Tether on BSC/BNB Chain

**Payment Flow:**
1. Guest selects dates, guests count, and preferred cryptocurrency
2. System calculates the crypto amount based on real-time prices (via CoinGecko API)
3. Booking is created with status `pending`
4. Guest is shown the wallet address and exact amount to send
5. For USDT payments: System automatically scans for incoming transfers every 30 seconds
6. For BTC/ETH payments: Guest submits transaction hash manually
7. Host/Admin verifies the transaction on blockchain
8. Booking status updates: `pending` → `paid` → `confirmed`

**Wallet Configuration:**
- Admins configure receiving wallet addresses in `/admin/settings`
- Each cryptocurrency can have a different wallet address
- USDT supports both Ethereum and BSC networks

**Transaction Verification:**
- BTC: Verified via Blockstream API
- ETH: Verified via Etherscan API
- USDT: Automatic detection via Etherscan/BscScan token transfer APIs

### Availability Management

Hosts can manage their villa availability by blocking dates:

**How it works:**
1. Host goes to `/host/villas` (My Villas page)
2. Clicks "Availability" button on any villa
3. Interactive calendar opens showing:
   - **Green** - Available dates
   - **Red** - Booked dates (cannot be blocked)
   - **Gray** - Blocked by host
   - **Blue** - Currently selected
4. Host clicks/drags to select dates, then clicks "Block Selected Dates"
5. Optional: Add a reason (e.g., "Maintenance", "Personal use")
6. Blocked dates are immediately hidden from guest search

**Features:**
- Block single dates or date ranges
- Add optional reason for blocking
- View and remove existing blocked periods
- Cannot block dates that have active bookings
- Guests see blocked dates as unavailable in the booking calendar

**Data Model:**
- Blocked dates stored in `blocked_dates` table (separate from bookings)
- Industry-standard approach (same as Airbnb, Booking.com)
- Allows for clean reporting and future features (recurring blocks, etc.)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:logs` | View Docker logs |
