# Small Task — starter project

A Next.js starter for a micro-task platform. The included homepage is a responsive UI preview with sample tasks and a sample wallet balance. It is **not yet a live earning or payment system**.

## Stack
- Next.js 15 + React 19 + TypeScript
- Supabase (Auth + Postgres + Row Level Security)
- Vercel deployment

## Run locally
1. Install Node.js 20.9+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project and add its Project URL and anon/publishable key to `.env.local`.
5. Run the SQL in `supabase/schema.sql` in Supabase SQL Editor.
6. Run `npm run dev` and open http://localhost:3000.

## First admin
After registering your own account, find its UUID in Supabase Authentication > Users. Run:
```sql
update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
```
Do not allow users to set their own role. Keep the service-role key private and server-side only.

## Deploy to Vercel
1. Push this project to a private GitHub repository.
2. Import the repository in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings > Environment Variables.
4. Deploy.

## Before real users or real payouts
This starter intentionally does not implement live authentication screens, admin CRUD, proof uploads, wallet-credit transactions, withdrawal processing, or Binance API integration yet. Build and test those server-side before launch:
- Verify all submissions and task limits on the server/database.
- Credit wallet only once after admin approval, in a single database transaction.
- Reserve/deduct balance atomically when a withdrawal request is created; release it if rejected.
- Add audit logs, rate limits, anti-fraud checks, and admin MFA.
- Binance Pay availability and merchant/API requirements vary by account and jurisdiction. Start with a manual admin-reviewed payout process; never ask users for passwords, OTPs, seed phrases, or private keys.
- Review local laws, tax obligations, platform terms, and payment eligibility before operating.

## Project structure
- `app/page.tsx` — landing page preview
- `app/globals.css` — responsive styling
- `lib/supabase.ts` — Supabase client placeholder
- `supabase/schema.sql` — initial database schema and RLS policies
