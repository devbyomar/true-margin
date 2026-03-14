# TrueMargin

**Know your margin before the job ends.**

A focused SaaS tool for Canadian specialty trade contractors (HVAC, plumbing, electrical, roofing) to track real-time job profitability — from estimate to close.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Database:** Supabase (PostgreSQL + RLS + Auth)
- **SMS:** Twilio Programmable Messaging
- **PDF:** @react-pdf/renderer
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Run unit tests
npm test
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
