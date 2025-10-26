# ARES Platform - User Guide for Role Switching and Complete Features

## Overview

The ARES platform now fully supports role switching between Client and Freelancer modes. Users can:
- Sign up as a Client, Freelancer, or Both
- Change their role at any time through the Settings page
- Access different dashboards based on their role
- Post jobs (as Client) and browse/apply for jobs (as Freelancer)

## Getting Started

### 1. Sign Up

Visit `/signup` to create a new account:
- Enter your full name, email, and password
- Select your role:
  - **Freelancer**: Browse and apply for jobs
  - **Client**: Post jobs and hire freelancers
  - **Both**: Access both client and freelancer features

### 2. Login

Visit `/login` to access your account:
- Enter your email and password
- You'll be redirected to the appropriate dashboard:
  - Freelancers → `/freelancer`
  - Clients and Both users → `/client` (default for Both role)

## Features

### As a Client

When logged in as a Client, you can:

1. **Post New Projects** (`/client` dashboard)
   - Click "+ New Project" button
   - Fill in project details (title, description, budget, deadline)
   - Projects are automatically set to "open" status
   - Freelancers can see and apply for your projects

2. **View Your Projects**
   - See all projects you've posted
   - Track project status (draft, open, in_progress, completed)
   - View assigned freelancers

3. **Manage Invoices**
   - View invoices sent by freelancers
   - Track payment status
   - See invoice details and line items

4. **Track Payments**
   - Monitor all payments made
   - View payment history and totals

### As a Freelancer

When logged in as a Freelancer, you can:

1. **Browse Available Projects** (`/freelancer` dashboard)
   - View all open projects posted by clients
   - See project budgets, deadlines, and descriptions
   - Apply button available (backend ready, full implementation pending)

2. **Manage Your Projects**
   - Track projects you're working on
   - Update project status
   - View client information

3. **Create Invoices**
   - Click "+ Create Invoice" button
   - Select a project
   - Add invoice details and line items
   - Invoices get auto-generated numbers (INV-YYYYMM-XXXX)

4. **Track Earnings**
   - View total earnings from completed payments
   - Monitor pending invoices
   - See payment history

### As Both (Client & Freelancer)

When logged in with the "Both" role, you have access to:

1. **Both Dashboards**
   - Access Client Dashboard at `/client`
   - Access Freelancer Dashboard at `/freelancer`
   - Switch between dashboards using the navigation bar

2. **Unified Navigation**
   - The navbar shows links to both dashboards
   - Your current role is displayed in the navbar
   - Easy switching between modes

## Switching Roles

### Access Settings

1. Click "Settings" in the navigation bar
2. Or navigate to `/settings`

### Change Your Role

In the Settings page, you can:

1. **Update Profile Information**
   - Full name
   - Bio
   - Country and timezone
   - Wallet address for payments

2. **Change Your Role**
   - Select from: Freelancer, Client, or Both
   - The system will redirect you to the appropriate dashboard
   - Your role badge in the navbar will update

3. **Save Changes**
   - Click "Save Changes" to update your profile
   - Success message confirms the update
   - If role changed, you'll be redirected after 1.5 seconds

## Navigation Guide

### Main Routes

- `/` - Landing page
- `/login` - Login page
- `/signup` - Sign up page
- `/projects` - Browse all available projects (public)
- `/client` - Client dashboard (requires client or both role)
- `/freelancer` - Freelancer dashboard (requires freelancer or both role)
- `/settings` - Profile settings and role management

### API Endpoints

The platform includes 14 API endpoints for:
- Authentication (signup, login, logout, session)
- User management (profile, skills)
- Projects (CRUD operations)
- Invoices (CRUD operations with auto-numbering)
- Payments (tracking and status updates)

## Database Setup

To use the platform with a real database:

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
3. Copy `.env.example` to `.env.local`
4. Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Restart the development server

## Key Features Ready After Database Setup

Once Supabase is configured, all features will work:

✅ User authentication (signup, login, logout)
✅ Role-based access control
✅ Role switching through Settings
✅ Project creation and management
✅ Invoice creation with auto-numbering
✅ Payment tracking
✅ User profile management
✅ Dual-role support (Both)

## Security Features

- Row Level Security (RLS) on all database tables
- Session-based authentication
- Role-based access control
- Secure API routes with authentication checks
- Environment variable protection

## Next Steps

After setting up the database:

1. Create test accounts with different roles
2. Test the complete workflow:
   - Client posts a project
   - Freelancer views and can apply
   - Freelancer creates invoice
   - Client makes payment
3. Test role switching:
   - Create a "Both" account
   - Switch between client and freelancer views
   - Post jobs and create invoices from the same account

## Support

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
For database setup help, see [DATABASE_SETUP.md](DATABASE_SETUP.md)

## Summary

The ARES platform is now fully ready for use once the Supabase database is set up. Users can:
- Choose their role at signup
- Change roles anytime through Settings
- Access appropriate features based on their role
- Work as both client and freelancer if needed
- Complete the full job posting → invoicing → payment flow
