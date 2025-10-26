# ARES - Global Payment, Zero Resistance

Solusi pembayaran lintas batas instan untuk freelancer.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Docker Desktop (for local development)
- Supabase account (for production deployment)

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/RafiMM0609/ARES.git
cd ARES
```

2. Install dependencies:
```bash
npm install
```

3. Start local Supabase instance:
```bash
npm run supabase:start
```
   - See **[SUPABASE_LOCAL_SETUP.md](SUPABASE_LOCAL_SETUP.md)** for detailed local development guide
   - This will start a local Supabase instance with Docker
   - Copy the API URL and keys shown in the output

4. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your local Supabase credentials
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Setup

For deploying to production:
- See **[DATABASE_SETUP.md](DATABASE_SETUP.md)** for cloud Supabase setup
- Create a Supabase project at https://supabase.com
- Push migrations: `npx supabase db push`

## 📚 Documentation

- **[SUPABASE_LOCAL_SETUP.md](SUPABASE_LOCAL_SETUP.md)** - Local development with Supabase
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Production Supabase setup guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference with examples
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built and how to use it

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API Routes (14 endpoints)
│   │   ├── auth/           # Authentication (signup, login, logout, session)
│   │   ├── users/          # User management (profile, skills)
│   │   ├── projects/       # Projects CRUD
│   │   ├── invoices/       # Invoices with auto-generated numbers
│   │   └── payments/       # Payment processing
│   ├── (auth)/             # Route group for authentication
│   │   ├── login/
│   │   │   └── page.tsx    # Login page
│   │   └── layout.tsx      # Auth layout (without navbar)
│   ├── (platform)/         # Route group for main platform
│   │   ├── client/
│   │   │   └── page.tsx    # Client dashboard
│   │   ├── freelancer/
│   │   │   └── page.tsx    # Freelancer dashboard
│   │   └── layout.tsx      # Platform layout (with navbar)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── lib/
│   ├── supabase.ts         # Supabase client configuration
│   └── database.types.ts   # TypeScript database types
└── services/               # Service layer for API calls
    ├── api-client.ts       # Base HTTP client
    ├── auth.service.ts     # Authentication service
    ├── user.service.ts     # User/profile service
    ├── project.service.ts  # Project management
    ├── invoice.service.ts  # Invoice management
    ├── payment.service.ts  # Payment processing
    └── index.ts            # Service exports
```

## 🛣️ Routes

### Pages
- `/` - Landing page
- `/login` - Login page
- `/client` - Client dashboard
- `/freelancer` - Freelancer dashboard

### API Endpoints
- **Auth**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`
- **Users**: `/api/users/profile`, `/api/users/skills`
- **Projects**: `/api/projects`, `/api/projects/[id]`
- **Invoices**: `/api/invoices`, `/api/invoices/[id]`
- **Payments**: `/api/payments`, `/api/payments/[id]`

## 🛠️ Built With

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling
- [Supabase](https://supabase.com/) - Backend as a Service (Database, Auth)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🗄️ Database

### Tables
- **profiles** - User profiles (client/freelancer/both)
- **skills** - Available skills catalog
- **freelancer_skills** - Freelancer skills junction table
- **projects** - Job postings with milestones
- **invoices** - Auto-numbered invoices with line items
- **payments** - Payment tracking with blockchain support
- **reviews** - Project reviews and ratings
- **notifications** - User notifications

### Features
- Row Level Security (RLS) enabled on all tables
- Auto-generated invoice numbers (INV-YYYYMM-XXXX)
- Automatic timestamps (created_at, updated_at)
- Auto-profile creation on signup
- Payment completion auto-updates invoice status

## 💻 Service Layer Usage

```typescript
import { authService, projectService, invoiceService } from '@/services';

// Authentication
await authService.login({ email, password });

// Create a project
const { project } = await projectService.createProject({
  title: "Website Development",
  description: "Build a modern website",
  budget_amount: 5000
});

// Create an invoice
const { invoice } = await invoiceService.createInvoice({
  client_id: clientId,
  amount: 5000,
  items: [
    { description: "Development (40 hours)", quantity: 40, unit_price: 125 }
  ]
});

// List payments
const { payments } = await paymentService.getPayments({ status: 'completed' });
```

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete examples.

## 🔒 Route Groups

This project uses Next.js App Router route groups:

- `(auth)` - Authentication routes without platform navigation
- `(platform)` - Platform routes with navigation bar

Route groups allow you to organize routes without affecting the URL structure.

## 🎯 Next Steps

1. ✅ ~~Implement database schema~~ (Complete)
2. ✅ ~~Create API routes~~ (Complete)
3. ✅ ~~Build service layer~~ (Complete)
4. ⏳ Build authentication UI (login/signup forms)
5. ⏳ Implement client dashboard
6. ⏳ Implement freelancer dashboard
7. ⏳ Add middleware for route protection
8. ⏳ Integrate wallet connections
9. ⏳ Add invoice and payment UI components

## 🔐 Security

- Row Level Security (RLS) policies on all database tables
- Session-based authentication via Supabase
- Role-based access control (Client/Freelancer)
- Secure API routes with authentication checks
- Environment variable protection

## 🚀 Deployment

1. Set up Supabase project and run SQL schema
2. Configure environment variables in your hosting platform
3. Build the application: `npm run build`
4. Deploy to Vercel, Netlify, or your preferred platform

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.
