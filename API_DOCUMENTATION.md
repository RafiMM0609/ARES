# ARES Freelancer Platform - API Documentation

## Overview

This documentation covers the complete Supabase integration for the ARES freelancer platform, including all API routes, database schema, and frontend service layer.

## Quick Start

1. **Set up Supabase database**: Follow instructions in `DATABASE_SETUP.md`
2. **Configure environment variables**: Copy `.env.example` to `.env.local` and fill in your Supabase credentials
3. **Install dependencies**: `npm install`
4. **Run development server**: `npm run dev`

## Architecture

### Backend (API Routes)

All API routes are located in `src/app/api/` and follow RESTful conventions:

- **Authentication** (`/api/auth/*`) - User signup, login, logout, session management
- **Users** (`/api/users/*`) - Profile management and skills
- **Projects** (`/api/projects/*`) - CRUD operations for projects
- **Invoices** (`/api/invoices/*`) - Invoice management
- **Payments** (`/api/payments/*`) - Payment processing

### Frontend (Service Layer)

All frontend code should use the service layer (`src/services/`) to interact with APIs:

```typescript
import { authService, projectService, invoiceService } from '@/services';
```

This provides:
- Type-safe API calls
- Centralized error handling
- Consistent request/response format
- Easy testing and mocking

### Database

The database schema is defined in `supabase-schema.sql` and includes:
- User profiles with role-based access (client/freelancer/both)
- Projects with milestones
- Invoices with line items
- Payment tracking
- Reviews and ratings
- Notifications

## API Endpoints Reference

### Authentication

#### `POST /api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "user_type": "freelancer"  // "client" | "freelancer" | "both"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### `POST /api/auth/login`
Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "session": { /* session object */ },
  "user": { /* user object */ }
}
```

#### `POST /api/auth/logout`
Log out the current user.

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### `GET /api/auth/session`
Get the current session.

**Response:**
```json
{
  "session": { /* session object or null */ }
}
```

### Users

#### `GET /api/users/profile`
Get the current user's profile.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "freelancer",
    "bio": "Experienced developer",
    "country": "US",
    "wallet_address": "0x..."
  }
}
```

#### `PUT /api/users/profile`
Update the current user's profile.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "bio": "Updated bio",
  "country": "US",
  "timezone": "America/New_York",
  "wallet_address": "0x...",
  "avatar_url": "https://..."
}
```

#### `GET /api/users/skills`
Get all available skills.

**Response:**
```json
{
  "skills": [
    {
      "id": "uuid",
      "name": "JavaScript",
      "category": "Programming"
    }
  ]
}
```

#### `POST /api/users/skills`
Create a new skill (requires authentication).

**Request Body:**
```json
{
  "name": "React Native",
  "category": "Framework"
}
```

### Projects

#### `GET /api/projects`
List projects for the current user.

**Query Parameters:**
- `status`: Filter by status (draft, open, assigned, in_progress, completed, cancelled)
- `type`: Filter by type (my_projects, available)

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "Build a Website",
      "description": "E-commerce website",
      "budget_amount": 5000,
      "budget_currency": "USD",
      "status": "open",
      "client": {
        "id": "uuid",
        "full_name": "Client Name",
        "email": "client@example.com"
      },
      "freelancer": null,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### `POST /api/projects`
Create a new project (client only).

**Request Body:**
```json
{
  "title": "Build a Mobile App",
  "description": "iOS and Android app",
  "budget_amount": 10000,
  "budget_currency": "USD",
  "deadline": "2024-12-31T23:59:59Z",
  "status": "open"
}
```

#### `GET /api/projects/[id]`
Get a specific project with milestones.

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "title": "Project Title",
    "description": "Description",
    "budget_amount": 5000,
    "status": "in_progress",
    "client": { /* client details */ },
    "freelancer": { /* freelancer details */ },
    "milestones": [
      {
        "id": "uuid",
        "title": "Design Phase",
        "amount": 1500,
        "status": "completed"
      }
    ]
  }
}
```

#### `PUT /api/projects/[id]`
Update a project (client only).

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "budget_amount": 6000,
  "status": "in_progress",
  "freelancer_id": "uuid"
}
```

#### `DELETE /api/projects/[id]`
Delete a project (client only).

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

### Invoices

#### `GET /api/invoices`
List invoices for the current user.

**Query Parameters:**
- `status`: Filter by status (draft, sent, paid, cancelled, overdue)

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoice_number": "INV-202401-0001",
      "amount": 5000,
      "currency": "USD",
      "status": "sent",
      "due_date": "2024-02-01T00:00:00Z",
      "client": { /* client details */ },
      "freelancer": { /* freelancer details */ },
      "project": { "id": "uuid", "title": "Project Name" },
      "items": [
        {
          "description": "Development work",
          "quantity": 40,
          "unit_price": 125,
          "total": 5000
        }
      ]
    }
  ]
}
```

#### `POST /api/invoices`
Create a new invoice (freelancer only).

**Request Body:**
```json
{
  "project_id": "uuid",
  "client_id": "uuid",
  "amount": 5000,
  "currency": "USD",
  "due_date": "2024-02-01T00:00:00Z",
  "description": "Payment for development work",
  "notes": "Thank you for your business",
  "items": [
    {
      "description": "Development (40 hours)",
      "quantity": 40,
      "unit_price": 125
    }
  ]
}
```

**Response:**
```json
{
  "message": "Invoice created successfully",
  "invoice": { /* invoice object */ }
}
```

#### `GET /api/invoices/[id]`
Get a specific invoice with items and payments.

**Response:**
```json
{
  "invoice": {
    "id": "uuid",
    "invoice_number": "INV-202401-0001",
    "amount": 5000,
    "status": "paid",
    "items": [ /* invoice items */ ],
    "payments": [ /* payment records */ ]
  }
}
```

#### `PUT /api/invoices/[id]`
Update an invoice.

- **Freelancer** can update draft invoices
- **Client** can update invoice status (e.g., mark as paid)

**Request Body (Freelancer):**
```json
{
  "amount": 5500,
  "due_date": "2024-02-15T00:00:00Z",
  "description": "Updated description",
  "status": "sent"
}
```

**Request Body (Client):**
```json
{
  "status": "paid"
}
```

#### `DELETE /api/invoices/[id]`
Delete a draft invoice (freelancer only).

**Response:**
```json
{
  "message": "Invoice deleted successfully"
}
```

### Payments

#### `GET /api/payments`
List payments for the current user.

**Query Parameters:**
- `status`: Filter by status (pending, processing, completed, failed, refunded)

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "amount": 5000,
      "currency": "USD",
      "payment_method": "wallet",
      "transaction_hash": "0x...",
      "status": "completed",
      "payment_date": "2024-01-15T10:30:00Z",
      "payer": { /* payer details */ },
      "payee": { /* payee details */ },
      "invoice": {
        "id": "uuid",
        "invoice_number": "INV-202401-0001"
      }
    }
  ]
}
```

#### `POST /api/payments`
Create a payment (client only).

**Request Body:**
```json
{
  "invoice_id": "uuid",
  "payee_id": "uuid",
  "amount": 5000,
  "currency": "USD",
  "payment_method": "wallet",
  "transaction_hash": "0x...",
  "notes": "Payment for Invoice #INV-202401-0001"
}
```

**Response:**
```json
{
  "message": "Payment created successfully",
  "payment": { /* payment object */ }
}
```

#### `GET /api/payments/[id]`
Get a specific payment.

**Response:**
```json
{
  "payment": {
    "id": "uuid",
    "amount": 5000,
    "status": "completed",
    "transaction_hash": "0x...",
    "invoice": { /* invoice details */ }
  }
}
```

#### `PUT /api/payments/[id]`
Update payment status (payer only).

**Request Body:**
```json
{
  "status": "completed",
  "transaction_hash": "0x...",
  "notes": "Payment confirmed"
}
```

**Response:**
```json
{
  "message": "Payment updated successfully",
  "payment": { /* updated payment */ }
}
```

**Note:** When a payment status is set to "completed", the associated invoice is automatically marked as "paid".

## Service Layer Usage

### Example: Authentication

```typescript
import { authService } from '@/services';

// Sign up
const signupData = {
  email: 'user@example.com',
  password: 'password',
  full_name: 'John Doe',
  user_type: 'freelancer'
};

try {
  const result = await authService.signup(signupData);
  console.log('User created:', result.user);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Error:', error.message, 'Status:', error.status);
  }
}

// Login
const loginData = {
  email: 'user@example.com',
  password: 'password'
};

const result = await authService.login(loginData);
console.log('Logged in:', result.session);
```

### Example: Projects

```typescript
import { projectService } from '@/services';

// Create a project
const projectData = {
  title: 'Build a Website',
  description: 'E-commerce platform',
  budget_amount: 5000,
  budget_currency: 'USD',
  deadline: '2024-12-31T23:59:59Z',
  status: 'open'
};

const { project } = await projectService.createProject(projectData);
console.log('Project created:', project.id);

// List available projects
const { projects } = await projectService.getProjects({ 
  type: 'available',
  status: 'open'
});
console.log('Available projects:', projects.length);

// Get project details
const { project } = await projectService.getProject(projectId);
console.log('Project:', project.title, 'Milestones:', project.milestones);
```

### Example: Invoices

```typescript
import { invoiceService } from '@/services';

// Create an invoice
const invoiceData = {
  project_id: 'project-uuid',
  client_id: 'client-uuid',
  amount: 5000,
  currency: 'USD',
  due_date: '2024-02-01T00:00:00Z',
  description: 'Development work',
  items: [
    {
      description: 'Web Development (40 hours)',
      quantity: 40,
      unit_price: 125
    }
  ]
};

const { invoice } = await invoiceService.createInvoice(invoiceData);
console.log('Invoice created:', invoice.invoice_number);

// List invoices
const { invoices } = await invoiceService.getInvoices({ status: 'sent' });
console.log('Sent invoices:', invoices.length);

// Update invoice status
await invoiceService.updateInvoice(invoiceId, { status: 'paid' });
```

### Example: Payments

```typescript
import { paymentService } from '@/services';

// Create a payment
const paymentData = {
  invoice_id: 'invoice-uuid',
  payee_id: 'freelancer-uuid',
  amount: 5000,
  currency: 'USD',
  payment_method: 'wallet',
  transaction_hash: '0x...',
  notes: 'Payment for services'
};

const { payment } = await paymentService.createPayment(paymentData);
console.log('Payment created:', payment.id);

// Update payment status
await paymentService.updatePayment(paymentId, {
  status: 'completed',
  transaction_hash: '0x...'
});

// This automatically marks the invoice as paid
```

## Error Handling

All services throw `ApiError` exceptions with status codes:

```typescript
import { ApiError } from '@/services';

try {
  await projectService.createProject(data);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        console.error('Bad request:', error.message);
        break;
      case 401:
        console.error('Unauthorized - please login');
        break;
      case 403:
        console.error('Forbidden:', error.message);
        break;
      case 404:
        console.error('Not found');
        break;
      case 500:
        console.error('Server error');
        break;
    }
  }
}
```

## Security

### Row Level Security (RLS)

All database tables have RLS enabled:
- Users can only see/edit their own profiles
- Project visibility is restricted to clients, assigned freelancers, or open projects
- Invoices are only visible to the client and freelancer involved
- Payments are only visible to payer and payee

### Authentication

All API routes (except `/api/auth/*`) require authentication via Supabase session cookies.

### Authorization

- **Clients** can create projects, make payments, update invoice status
- **Freelancers** can create invoices, update their projects
- **Both** can view their own data and data they're involved in

## Database Schema Overview

### Core Tables

- `profiles` - User profiles (extends auth.users)
- `skills` - Available skills
- `freelancer_skills` - Links freelancers to skills
- `projects` - Job postings
- `project_milestones` - Project milestones
- `invoices` - Invoices with auto-generated numbers
- `invoice_items` - Line items for invoices
- `payments` - Payment records
- `reviews` - Project reviews
- `notifications` - User notifications

### Key Features

- **Auto-generated invoice numbers**: Format `INV-YYYYMM-XXXX`
- **Automatic timestamps**: `created_at` and `updated_at`
- **Auto-profile creation**: Profiles created on user signup
- **Cascade deletes**: Related data cleaned up automatically
- **Indexes**: Optimized for common queries

## Development Workflow

1. **Start development server**: `npm run dev`
2. **Make code changes**
3. **Lint code**: `npm run lint`
4. **Build**: `npm run build`
5. **Test API routes**: Use tools like Postman or curl

## Production Deployment

1. Set up Supabase project and run the SQL schema
2. Configure environment variables in your hosting platform
3. Build the application: `npm run build`
4. Deploy the `.next` folder to your hosting service

## Support and Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **TypeScript Documentation**: https://www.typescriptlang.org/docs

## License

ISC
