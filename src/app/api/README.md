# ARES API Routes

This directory contains all the API routes for the ARES freelancer platform. These routes provide the backend functionality for authentication, user management, projects, invoices, and payments.

## Overview

All API routes are built using Next.js App Router and integrate with Supabase for database operations and authentication.

## Directory Structure

```
api/
├── auth/                      # Authentication endpoints
│   ├── login/route.ts        # User login
│   ├── logout/route.ts       # User logout
│   ├── session/route.ts      # Get current session
│   └── signup/route.ts       # User registration
├── invoices/                  # Invoice management
│   ├── route.ts              # List/create invoices
│   └── [id]/route.ts         # Get/update/delete invoice
├── payments/                  # Payment processing
│   ├── route.ts              # List/create payments
│   └── [id]/route.ts         # Get/update payment
├── projects/                  # Project management
│   ├── route.ts              # List/create projects
│   └── [id]/route.ts         # Get/update/delete project
└── users/                     # User management
    ├── profile/route.ts      # User profile CRUD
    └── skills/route.ts       # Skills management
```

## Available Endpoints

### Authentication (`/api/auth/*`)

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "user_type": "freelancer"
}
```

#### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### POST /api/auth/logout
Log out the current user.

#### GET /api/auth/session
Get the current authenticated session.

### Users (`/api/users/*`)

#### GET /api/users/profile
Get current user's profile information.

#### PUT /api/users/profile
Update current user's profile.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "bio": "Experienced developer",
  "country": "US",
  "wallet_address": "0x..."
}
```

#### GET /api/users/skills
Get all available skills.

#### POST /api/users/skills
Create a new skill (authenticated users only).

### Projects (`/api/projects/*`)

#### GET /api/projects
List projects for the current user.

**Query Parameters:**
- `status`: Filter by status (draft, open, assigned, in_progress, completed, cancelled)
- `type`: Filter by type (my_projects, available)

#### POST /api/projects
Create a new project (client only).

**Request Body:**
```json
{
  "title": "Build a Website",
  "description": "E-commerce platform",
  "budget_amount": 5000,
  "deadline": "2024-12-31T23:59:59Z"
}
```

#### GET /api/projects/[id]
Get a specific project with milestones.

#### PUT /api/projects/[id]
Update a project (client only).

#### DELETE /api/projects/[id]
Delete a project (client only).

### Invoices (`/api/invoices/*`)

#### GET /api/invoices
List invoices for the current user.

**Query Parameters:**
- `status`: Filter by status (draft, sent, paid, cancelled, overdue)

#### POST /api/invoices
Create a new invoice (freelancer only).

**Request Body:**
```json
{
  "client_id": "uuid",
  "amount": 5000,
  "due_date": "2024-02-01T00:00:00Z",
  "items": [
    {
      "description": "Development (40 hours)",
      "quantity": 40,
      "unit_price": 125
    }
  ]
}
```

**Note:** Invoice numbers are auto-generated (format: `INV-YYYYMM-XXXX` where XXXX is a sequential 4-digit number)

#### GET /api/invoices/[id]
Get a specific invoice with items and payments.

#### PUT /api/invoices/[id]
Update an invoice.
- Freelancers can update draft invoices
- Clients can update invoice status

#### DELETE /api/invoices/[id]
Delete a draft invoice (freelancer only).

### Payments (`/api/payments/*`)

#### GET /api/payments
List payments for the current user.

**Query Parameters:**
- `status`: Filter by status (pending, processing, completed, failed, refunded)

#### POST /api/payments
Create a payment (client only).

**Request Body:**
```json
{
  "invoice_id": "uuid",
  "payee_id": "uuid",
  "amount": 5000,
  "payment_method": "wallet",
  "transaction_hash": "0x..."
}
```

**Note:** When payment status is set to "completed", the invoice is automatically marked as "paid".

#### GET /api/payments/[id]
Get a specific payment.

#### PUT /api/payments/[id]
Update payment status (payer only).

## Security

### Authentication
All routes except `/api/auth/*` require authentication via Supabase session.

### Authorization
- **Clients** can create projects, make payments
- **Freelancers** can create invoices, update their projects
- **Both** can view their own data

### Row Level Security (RLS)
All database operations respect RLS policies:
- Users can only see/modify their own data
- Project visibility is restricted to involved parties
- Invoice and payment access is controlled

## Error Handling

All routes return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message"
}
```

## Usage from Frontend

Use the service layer in `src/services/` instead of calling these routes directly:

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
  items: [...]
});
```

## Database Integration

All routes use Supabase client configured in `src/lib/supabase.ts`:

```typescript
import { supabase, getServiceSupabase } from '@/lib/supabase';

// Client-side operations
const { data } = await supabase.from('profiles').select('*');

// Server-side operations (in API routes)
const serviceSupabase = getServiceSupabase();
const { data } = await serviceSupabase.from('profiles').select('*');
```

## Testing

Test API routes using curl:

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","full_name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get profile (requires authentication cookie)
curl http://localhost:3000/api/users/profile \
  -H "Cookie: <session-cookie>"
```

## Documentation

For complete API documentation, see:
- **[API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)** - Complete API reference
- **[DATABASE_SETUP.md](../../DATABASE_SETUP.md)** - Database schema and RLS policies

## Related Files

- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/database.types.ts` - TypeScript database types
- `src/services/` - Frontend service layer
- `supabase/migrations/` - Database migrations
