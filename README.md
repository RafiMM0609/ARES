# ARES - Global Payment, Zero Resistance

Solusi pembayaran lintas batas instan untuk freelancer.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or later
- npm or yarn

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

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

The SQLite database will be automatically created in the `data/` directory on first run.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute quick start guide ⚡
- **[INSTALLATION.md](INSTALLATION.md)** - Comprehensive installation guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference with examples
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built and how to use it
- **[UX_UI_ANALYSIS_GUIDE.md](UX_UI_ANALYSIS_GUIDE.md)** - UX/UI analysis framework and best practices 🎨

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
│   ├── sqlite.ts           # SQLite database configuration
│   ├── auth.ts             # Authentication utilities
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
- `/signup` - Signup page
- `/client` - Client dashboard
- `/freelancer` - Freelancer dashboard
- `/projects` - Projects page
- `/settings` - Settings page

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
- [SQLite](https://www.sqlite.org/) - Embedded database (via better-sqlite3)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🗄️ Database

### Tables
- **users** - User accounts with profile info
- **user_sessions** - Session management
- **skills** - Available skills catalog
- **freelancer_skills** - Freelancer skills junction table
- **projects** - Job postings with milestones
- **project_milestones** - Project milestones
- **invoices** - Auto-numbered invoices with line items
- **invoice_items** - Invoice line items
- **payments** - Payment tracking with blockchain support
- **reviews** - Project reviews and ratings
- **notifications** - User notifications

### Features
- SQLite database for easy setup and portability
- Auto-generated invoice numbers (INV-YYYYMM-XXXX)
- Automatic timestamps (created_at, updated_at)
- Payment completion auto-updates invoice status
- Foreign key constraints for data integrity

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
8. ✅ ~~Integrate wallet connections~~ (Complete - QI Network)
9. ⏳ Add invoice and payment UI components

## 💳 QI Network Wallet Integration

ARES integrates with QI Network (QIE Blockchain) for crypto payments:

### Features
- **Wallet Connection**: Connect MetaMask or compatible wallets
- **QI Network Support**: Automatic network switching and configuration
- **Balance Display**: Real-time QIE balance display
- **Payment Integration**: Send and receive QIE tokens

### Network Configuration
- **Chain ID**: 5656
- **Currency**: QIE
- **RPC URL**: https://rpc-main1.qiblockchain.online

### Usage
```typescript
import { useWallet } from '@/hooks';
import { WalletConnect } from '@/components/wallet';

// Hook for wallet state and actions
const { isConnected, address, balance, connect, disconnect } = useWallet();

// Component for wallet connection UI
<WalletConnect showBalance={true} showNetworkStatus={true} />
```

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Client/Freelancer)
- Secure API routes with authentication checks
- Environment variable protection
- Secure wallet integration with user approval

## 🚀 Deployment

1. Configure environment variables in your hosting platform:
   - `DATABASE_PATH` - Path to SQLite database file
   - `JWT_SECRET` - Secret key for JWT tokens
2. Build the application: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

**Note**: SQLite works well for small to medium scale applications. For high-traffic production deployments, consider migrating to PostgreSQL or another database.

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.
