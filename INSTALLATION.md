# ARES Supabase Installation Guide

This comprehensive guide covers setting up Supabase for the ARES freelancer platform, both for local development and production deployment.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Setup](#production-setup)
3. [Database Schema Overview](#database-schema-overview)
4. [API Integration](#api-integration)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) - Required for local Supabase
- Node.js 18.x or later
- npm or yarn

### Step-by-Step Setup

#### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client library
- `supabase` (dev) - Supabase CLI for local development

#### 2. Start Local Supabase

```bash
npm run supabase:start
```

**First time**: This will download Docker images (~2-3 GB). This is a one-time operation.

The command will output:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Keep these values** - you'll need them in the next step.

#### 3. Configure Environment Variables

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

The example file already contains the default local development keys, so you can use it as-is for local development.

Alternatively, use the keys from step 2:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

#### 4. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

### What Just Happened?

When you ran `supabase:start`:

1. **Docker containers started** - PostgreSQL, PostgREST, GoTrue (auth), etc.
2. **Migrations applied** - Created all database tables from `supabase/migrations/`
3. **Seed data loaded** - Populated with sample skills from `supabase/seed/`
4. **Services started**:
   - API Server: `http://localhost:54321`
   - Database: `postgresql://postgres:postgres@localhost:54322/postgres`
   - Studio (UI): `http://localhost:54323`
   - Email Testing: `http://localhost:54324`

### Accessing Supabase Studio

Supabase Studio is your local database admin panel:

1. Open `http://localhost:54323`
2. Browse tables, run queries, test authentication
3. No login required for local instance

### Development Workflow

```bash
# Start your day
npm run supabase:start
npm run dev

# Make database changes
npx supabase migration new add_new_feature

# Edit the new migration file in supabase/migrations/

# Apply migrations
npm run supabase:reset  # Resets DB and applies all migrations

# Generate TypeScript types
npm run supabase:types

# End your day
npm run supabase:stop
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run supabase:start` | Start local Supabase |
| `npm run supabase:stop` | Stop local Supabase |
| `npm run supabase:status` | Check service status |
| `npm run supabase:reset` | Reset database (destructive!) |
| `npm run supabase:migrate` | Apply pending migrations |
| `npm run supabase:types` | Generate TypeScript types |

---

## Production Setup

### Prerequisites

- Supabase account ([Sign up free](https://supabase.com))
- Project deployed to hosting platform (Vercel, Netlify, etc.)

### Step-by-Step Setup

#### 1. Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: ARES (or your choice)
   - **Database Password**: Strong password (save it!)
   - **Region**: Closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

#### 2. Link Local Project to Remote

```bash
# Get your project reference ID from Supabase dashboard (Settings > General)
npx supabase link --project-ref <your-project-ref>
```

Enter your database password when prompted.

#### 3. Push Migrations to Production

```bash
npx supabase db push
```

This applies all migrations from `supabase/migrations/` to your production database.

#### 4. Verify in Supabase Dashboard

1. Go to your project dashboard
2. Click "Table Editor" in the sidebar
3. You should see: profiles, skills, projects, invoices, payments, etc.

#### 5. Get Production Credentials

In your Supabase project dashboard:

1. Go to **Settings** > **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key
   - **service_role** key (keep secret!)

#### 6. Configure Production Environment

In your hosting platform (Vercel, Netlify, etc.), set environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-key>
```

**Important**: Never commit production keys to Git!

#### 7. Deploy Your Application

```bash
npm run build
# Deploy to your hosting platform
```

### Seed Data in Production (Optional)

To add sample skills to production:

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/seed/seed.sql`
3. Run the query

---

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | User profiles | Auto-created on signup, RLS enabled |
| `skills` | Available skills | Public readable, auth to create |
| `freelancer_skills` | User skills | Junction table with proficiency |
| `projects` | Job postings | Client creates, freelancer assigned |
| `project_milestones` | Project phases | Milestone tracking |
| `invoices` | Billing | Auto-generated numbers (INV-YYYYMM-XXXX) |
| `invoice_items` | Line items | Itemized billing |
| `payments` | Payment records | Blockchain transaction support |
| `reviews` | Ratings | 1-5 star ratings |
| `notifications` | User alerts | Read/unread tracking |

### Key Features

✅ **Row Level Security (RLS)** - All tables secured  
✅ **Auto-timestamps** - `created_at`, `updated_at`  
✅ **Auto-profile creation** - On user signup  
✅ **Invoice numbering** - Sequential, format: INV-202410-0001  
✅ **Cascade deletes** - Clean up related data  
✅ **Performance indexes** - Optimized queries  

### Database Triggers

1. **update_updated_at_column** - Auto-update timestamps
2. **on_auth_user_created** - Create profile on signup
3. **generate_invoice_number** - Sequential invoice numbers

---

## API Integration

The `/api` directory contains all API routes that interact with Supabase:

### Authentication Routes

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Resource Routes

- `/api/users/profile` - User profile management
- `/api/users/skills` - Skills management
- `/api/projects` - Projects CRUD
- `/api/invoices` - Invoices CRUD
- `/api/payments` - Payments CRUD

### Using the Service Layer

Frontend code should use the service layer in `src/services/`:

```typescript
import { authService, projectService, invoiceService } from '@/services';

// Login
await authService.login({ email, password });

// Create project
const { project } = await projectService.createProject({
  title: "Website Development",
  budget_amount: 5000
});

// Create invoice
const { invoice } = await invoiceService.createInvoice({
  client_id: clientId,
  amount: 5000,
  items: [{ description: "Development", quantity: 40, unit_price: 125 }]
});
```

For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## Troubleshooting

### Local Development Issues

#### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop and ensure it's running

#### Port Already in Use

**Error**: `Port 54321 is already in use`

**Solutions**:
1. Stop other Supabase instances: `npm run supabase:stop`
2. Change ports in `supabase/config.toml`
3. Kill process using the port: `lsof -ti:54321 | xargs kill -9` (Mac/Linux)

#### Migrations Failed

**Error**: Migration errors during `supabase:start`

**Solution**:
```bash
npm run supabase:stop
npm run supabase:start
```

If still failing, check migration SQL syntax in `supabase/migrations/`

#### Seed Data Not Loading

**Error**: Sample skills not in database

**Solution**:
```bash
npm run supabase:reset  # This re-runs migrations and seed
```

### Production Issues

#### Cannot Connect to Supabase

**Check**:
1. ✅ Environment variables set correctly
2. ✅ Project URL is HTTPS (not HTTP)
3. ✅ Keys are correct (anon key for client, service role for server)
4. ✅ Supabase project is active (not paused)

#### RLS Policy Errors

**Error**: `Row level security policy violation`

**Common Causes**:
1. User not authenticated
2. Wrong user trying to access data
3. Missing RLS policy for operation

**Debug**:
- Check authentication status
- Verify user has correct role
- Review RLS policies in Supabase dashboard

#### Invoice Number Generation Fails

**Error**: `generate_invoice_number() does not exist`

**Solution**: The function wasn't created. Re-run migrations:
```bash
npx supabase db push
```

### Getting Help

1. Check [Supabase Documentation](https://supabase.com/docs)
2. Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Check [Database Setup Guide](DATABASE_SETUP.md)
4. Inspect logs in Supabase Studio > Logs

---

## Next Steps

### Development Checklist

- [x] Install dependencies
- [x] Start local Supabase
- [x] Configure environment
- [x] Start application
- [ ] Test authentication flow
- [ ] Create sample project
- [ ] Generate invoice
- [ ] Process payment

### Production Checklist

- [ ] Create Supabase project
- [ ] Link local to remote
- [ ] Push migrations
- [ ] Configure production environment
- [ ] Test production deployment
- [ ] Set up monitoring
- [ ] Configure backups

---

## Additional Resources

- **[SUPABASE_LOCAL_SETUP.md](SUPABASE_LOCAL_SETUP.md)** - Detailed local development guide
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Original database setup documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[Supabase Docs](https://supabase.com/docs)** - Official documentation
- **[Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)** - Integration guide

---

**Happy coding with ARES!** 🚀
