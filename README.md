# Sri Venkateswara Vegetables 🥬

A production-ready web application for **Sri Venkateswara Vegetables** to record, manage, search, and print daily vegetable purchase records.

## Features

- 🔐 **Secure Authentication** — Supabase Auth with protected routes
- 📊 **Dashboard** — Today's totals, entries, vendors, and items at a glance
- ➕ **Add Records** — Multi-item entry for any vendor/date with live calculations
- 🔍 **Search Records** — 30-day vendor history with daily summaries
- 📋 **Detailed Reports** — Full item breakdown with edit & delete support
- 🏢 **Vendor Management** — Add, edit, and deactivate vendors
- 🖨️ **Print Reports** — A4-friendly summary and detailed reports with logo
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + RLS)
- **Icons:** Lucide React

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the database migration from `supabase/migrations/20260824_initial_schema.sql` in your Supabase SQL Editor
5. Create an admin user in your Supabase Auth dashboard
6. Start the development server:
   ```bash
   npm run dev
   ```

## Calculations

All monetary totals use **floor rounding**:
```
Total = Math.floor(kgs × unit_price)
Daily Total = SUM(all item totals)
```

## Security

- Row Level Security (RLS) enabled on all tables
- Only authenticated users can read/write data
- Environment variables used for all credentials
- No service role key exposed in frontend
