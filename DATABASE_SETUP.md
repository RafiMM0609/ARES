# ARES Database Setup Guide

This guide will help you set up Supabase for the ARES freelancer platform.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - Name: ARES (or your preferred name)
   - Database Password: (choose a strong password)
   - Region: (select closest to your users)
4. Click "Create new project"
5. Wait for the project to be provisioned

## Step 2: Run the SQL Schema

1. In your Supabase project dashboard, navigate to the SQL Editor (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from this repository
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. You should see a success message

This will create:
- All necessary tables (profiles, projects, invoices, payments, etc.)
- Row Level Security (RLS) policies for data protection
- Triggers for automatic timestamps and profile creation
- Indexes for optimal query performance
- Sample skills data for testing

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to Settings > API
2. You'll find:
   - Project URL: `https://your-project-id.supabase.co`
   - `anon` public key
   - `service_role` secret key (keep this secure!)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 5: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application should now be able to connect to Supabase

## Database Structure

### Core Tables

1. **profiles** - Extended user profiles (linked to auth.users)
   - Stores user information like name, bio, user type (client/freelancer)
   - Automatically created when a user signs up

2. **skills** - Available skills in the platform
   - Predefined skills that freelancers can add to their profile

3. **freelancer_skills** - Junction table linking freelancers to their skills

4. **projects** - Job postings and projects
   - Created by clients
   - Can be assigned to freelancers

5. **project_milestones** - Project milestones with payments

6. **invoices** - Invoices created by freelancers
   - Auto-generated invoice numbers
   - Track payment status

7. **invoice_items** - Line items for invoices

8. **payments** - Payment records
   - Track payment status and transaction details
   - Support for multiple payment methods

9. **reviews** - Reviews for completed projects

10. **notifications** - User notifications

### Security

All tables have Row Level Security (RLS) enabled, ensuring:
- Users can only see their own data or data they're authorized to see
- Clients can only modify their own projects
- Freelancers can only modify their own invoices (when in draft)
- Proper access control for all operations

### Automatic Features

1. **Auto-generated timestamps** - `created_at` and `updated_at` are automatically managed
2. **Auto-profile creation** - When a user signs up, their profile is automatically created
3. **Invoice numbering** - Invoice numbers are automatically generated (format: INV-YYYYMM-0001)

## API Routes

The following API routes are available:

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/skills` - Get all available skills
- `POST /api/users/skills` - Create a new skill

### Projects
- `GET /api/projects` - List projects (filtered by user)
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get a specific project
- `PUT /api/projects/[id]` - Update a project
- `DELETE /api/projects/[id]` - Delete a project

### Invoices
- `GET /api/invoices` - List invoices (filtered by user)
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/[id]` - Get a specific invoice
- `PUT /api/invoices/[id]` - Update an invoice
- `DELETE /api/invoices/[id]` - Delete an invoice

### Payments
- `GET /api/payments` - List payments (filtered by user)
- `POST /api/payments` - Create a new payment
- `GET /api/payments/[id]` - Get a specific payment
- `PUT /api/payments/[id]` - Update payment status

## Frontend Service Layer

All frontend code should use the service layer in `src/services/` instead of calling the API directly:

```typescript
import { authService, projectService, invoiceService } from '@/services';

// Example: Login
const result = await authService.login({ email, password });

// Example: Create a project
const project = await projectService.createProject({
  title: "Website Development",
  description: "Build a modern website",
  budget_amount: 5000,
  client_id: userId
});

// Example: Get invoices
const { invoices } = await invoiceService.getInvoices({ status: 'paid' });
```

## Troubleshooting

### Cannot connect to Supabase
- Check that your environment variables are set correctly
- Verify your Supabase project is active
- Ensure you're using the correct API keys

### RLS Policy errors
- Make sure you're authenticated when accessing protected resources
- Check that the user has the correct permissions for the operation

### Invoice number generation fails
- Ensure the `generate_invoice_number()` function was created successfully
- Check the SQL Editor for any errors when running the schema

## Next Steps

1. Configure email templates in Supabase for authentication emails
2. Set up Storage buckets for file uploads (avatars, documents)
3. Configure CORS settings if deploying to production
4. Set up database backups
5. Monitor usage and performance in the Supabase dashboard
