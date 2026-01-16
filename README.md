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
