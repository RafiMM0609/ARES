# Supabase Local Development Setup

This guide explains how to set up and use Supabase locally for development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Node.js 18.x or later
- npm or yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs the Supabase CLI as a dev dependency.

### 2. Start Supabase Local Development

```bash
npm run supabase:start
```

This command will:
- Start a local Supabase instance using Docker
- Create a local PostgreSQL database
- Apply all migrations from `supabase/migrations/`
- Seed the database with sample data from `supabase/seed/`
- Start the Supabase Studio UI at `http://localhost:54323`

**First-time setup**: This may take a few minutes to download the required Docker images.

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your local Supabase credentials:

```env
# For local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

**Note**: The keys are displayed when you run `npm run supabase:start`. Look for output like:

```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Start the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

### Database Management

- **`npm run supabase:start`** - Start local Supabase instance
- **`npm run supabase:stop`** - Stop local Supabase instance
- **`npm run supabase:status`** - Check status of local instance
- **`npm run supabase:reset`** - Reset database (drops all data and re-runs migrations)
- **`npm run supabase:migrate`** - Apply pending migrations
- **`npm run supabase:types`** - Generate TypeScript types from database schema

## Project Structure

```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Database migrations
│   └── 20241026000000_initial_schema.sql
└── seed/                    # Seed data for development
    └── seed.sql
```

## Database Migrations

### Creating a New Migration

```bash
npx supabase migration new <migration_name>
```

This creates a new migration file in `supabase/migrations/`.

### Applying Migrations

Migrations are automatically applied when you run `npm run supabase:start`.

To manually apply migrations:

```bash
npm run supabase:migrate
```

### Resetting the Database

To drop all data and re-run migrations:

```bash
npm run supabase:reset
```

## Accessing Supabase Studio

Supabase Studio is a web-based interface for managing your database.

1. Start Supabase: `npm run supabase:start`
2. Open `http://localhost:54323` in your browser
3. Use Studio to:
   - Browse tables and data
   - Run SQL queries
   - Manage authentication
   - View API logs
   - Test RLS policies

## Development Workflow

1. **Start Supabase**: `npm run supabase:start`
2. **Start the app**: `npm run dev`
3. Make changes to your code
4. Test with local Supabase
5. Create migrations for schema changes
6. Commit your code and migrations

## Generating TypeScript Types

After making schema changes, regenerate TypeScript types:

```bash
npm run supabase:types
```

This updates `src/lib/database.types.ts` with the latest schema.

## Seed Data

The `supabase/seed/seed.sql` file contains sample data for development:

- 10 predefined skills (JavaScript, TypeScript, React, etc.)

You can add more seed data by editing this file. Seed data is automatically loaded when you run `npm run supabase:start` or `npm run supabase:reset`.

## Remote Supabase (Production)

For production deployment:

1. Create a project at [app.supabase.com](https://app.supabase.com)
2. Link your local project:
   ```bash
   npx supabase link --project-ref <project-id>
   ```
3. Push migrations to remote:
   ```bash
   npx supabase db push
   ```
4. Update `.env.local` with remote credentials

## Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**: Start Docker Desktop

### Port Already in Use

**Error**: `Port 54321 is already in use`

**Solution**: Stop other Supabase instances or change ports in `supabase/config.toml`

### Database Reset Issues

If you encounter migration errors:

```bash
npm run supabase:stop
npm run supabase:start
```

### Missing Seed Data

If seed data doesn't load:

```bash
npm run supabase:reset
```

## Advanced Configuration

### Custom Ports

Edit `supabase/config.toml` to change default ports:

```toml
[api]
port = 54321

[db]
port = 54322

[studio]
port = 54323
```

### Database Version

The default PostgreSQL version is 17. To change:

```toml
[db]
major_version = 15
```

## Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Next Steps

1. ✅ Start local Supabase instance
2. ✅ Configure environment variables
3. ✅ Start the application
4. Test authentication flows
5. Create and manage projects
6. Generate invoices
7. Process payments

Enjoy building with ARES! 🚀
