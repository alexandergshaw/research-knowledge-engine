# Research Knowledge Engine — Web Dashboard

The primary dashboard and control center for the Research Knowledge Engine.

Built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, and **TanStack Query**.

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 10+
- A Supabase project with the [schema](../../supabase/schema.sql) applied

### Setup

1. Install dependencies:

   ```bash
   cd apps/web
   npm install
   ```

2. Copy the environment file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

1. Create a new [Supabase](https://supabase.com) project.
2. Apply the schema from [`supabase/schema.sql`](../../supabase/schema.sql) using the Supabase SQL Editor or CLI.
3. Copy your Project URL and anon key from **Project Settings → API**.

---

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the **Root Directory** to `apps/web`.
4. Add environment variables in **Vercel → Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

---

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router pages + API routes
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Dashboard (/)
│   ├── research/
│   │   ├── sources/        # Sources list + detail pages
│   │   ├── feeds/          # Feeds management
│   │   ├── jobs/           # Jobs monitor
│   │   ├── reports/        # Reports list + detail
│   │   └── import/         # URL import form
│   └── api/                # API route handlers
├── components/
│   ├── layout/             # Sidebar, Navbar, DashboardLayout
│   ├── research/           # Domain components (StatsCards, badges)
│   ├── forms/              # ImportUrlForm, FeedForm
│   └── ui/                 # shadcn/ui base components
├── lib/
│   ├── supabase/           # Client + server Supabase helpers
│   ├── queries/            # Data access helpers
│   ├── types/              # TypeScript database models
│   ├── validation/         # Zod schemas
│   ├── constants/          # App-wide constants
│   └── utils.ts            # cn(), formatDate(), etc.
└── providers/
    └── QueryProvider.tsx   # TanStack Query setup
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon key |

---

## Future Roadmap

- RSS feed fetching workers
- Full-text search and indexing
- Report generation pipeline
- Authentication (Supabase Auth)
- Webhook triggers
- Analytics dashboard
