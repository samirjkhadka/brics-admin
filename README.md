# BRICS Admin Suite

Internal administrative application for **BRICS World Travel and Tours** — travel ticket transactions, VAT reporting, invoicing, and financial oversight.

## Features

- Transaction entry with Nepal VAT (13%) and Bikram Sambat date conversion
- Dashboard with monthly stats and yearly trend charts
- Excel export and printable tax invoices
- Role-based access: `SUPERADMIN` (user & partner management) and `ADMIN` (transactions)
- Partner directory (bank and contact details)
- Optional flight alert emails via cron endpoint

## Prerequisites

- Node.js 20+
- PostgreSQL database

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `SEED_ADMIN_PASSWORD`.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Seed initial admin users:
   ```bash
   SEED_ADMIN_PASSWORD=your-password npx prisma db seed
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) and sign in with the seeded super admin (`admin@brics.com`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests |
| `npm run db:seed` | Seed admin users |
| `npm run db:check` | Print sample transactions |
| `npm run manage-users` | Upsert admin users |

## DOCX Invoice Template

Place a Word template at `templates/invoice_template.docx` with docxtemplater placeholders (`{passengerNames}`, `{partyName}`, `{billNo}`, etc.). See `templates/README.md`.

## Deployment

Configured for Netlify via `netlify.toml`. Set all environment variables in the Netlify dashboard before deploying.

## Security Notes

- Never commit `.env` or passwords to the repository
- Rotate `SEED_ADMIN_PASSWORD` after initial setup
- Protect `/api/notifications/process` with `CRON_SECRET` in production
