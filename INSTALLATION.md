# ARES Installation Guide

This comprehensive guide covers setting up ARES freelancer platform for local development and production deployment.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Production Setup](#production-setup)
3. [Database Schema Overview](#database-schema-overview)
4. [API Integration](#api-integration)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Step-by-Step Setup

#### 1. Install Dependencies

```bash
npm install
```

This installs:
- `better-sqlite3` - SQLite database library
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- And other dependencies

#### 2. Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# SQLite Database Configuration
DATABASE_PATH=./data/ares.db

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production
```

#### 3. Start the Application

```bash
npm run dev
```

The SQLite database will be automatically created in the `data/` directory on first run.

Visit `http://localhost:3000` 🎉

### What Just Happened?

When you ran `npm run dev`:

1. **Next.js server started** - Development server on port 3000
2. **SQLite database created** - In `data/ares.db` (auto-created on first request)
3. **Tables created** - All database tables with proper schema
4. **Sample data loaded** - Pre-populated skills data

### Development Workflow

```bash
# Start development
npm run dev

# Lint your code
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Database Management

The SQLite database is stored in `data/ares.db`. To reset the database:

```bash
# Delete the database file
rm data/ares.db

# Restart the app - database will be recreated
npm run dev
```

---

## Production Setup

### Prerequisites

- Hosting platform (Vercel, Netlify, or custom server)
- Environment variable configuration capability

### Step-by-Step Setup

#### 1. Build the Application

```bash
npm run build
```

#### 2. Configure Production Environment

Set these environment variables in your hosting platform:

```env
# SQLite Database (use absolute path in production)
DATABASE_PATH=/path/to/your/data/ares.db

# JWT Configuration (USE A STRONG, RANDOM SECRET!)
JWT_SECRET=your-very-secure-production-secret-key-at-least-32-characters
```

**Important**: 
- Use a strong, random JWT secret in production!
- Never commit production secrets to Git!
- Ensure the database path is persistent

#### 3. Deploy Your Application

For Vercel:
```bash
vercel --prod
```

For other platforms, follow their deployment documentation.

#### 4. Persistent Storage

**Note**: SQLite requires persistent file storage. Some serverless platforms don't support this natively. Consider:

- **Vercel**: Use with caution - the filesystem is ephemeral
- **Railway, Render, Fly.io**: Good support for persistent volumes
- **VPS/Dedicated Server**: Full control over storage

For high-traffic production deployments, consider migrating to PostgreSQL.

---

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts | Password hashing, profile info |
| `user_sessions` | Session management | Token storage, expiration |
| `skills` | Available skills | Pre-populated catalog |
| `freelancer_skills` | User skills | Junction table with proficiency |
| `projects` | Job postings | Client creates, freelancer assigned |
| `project_milestones` | Project phases | Milestone tracking |
| `invoices` | Billing | Auto-generated numbers (INV-YYYYMM-XXXX) |
| `invoice_items` | Line items | Itemized billing |
| `payments` | Payment records | Transaction tracking |
| `reviews` | Ratings | 1-5 star ratings |
| `notifications` | User alerts | Read/unread tracking |

### Key Features

✅ **Foreign key constraints** - Data integrity  
✅ **Auto-timestamps** - `created_at`, `updated_at`  
✅ **Invoice numbering** - Sequential, format: INV-202410-0001  
✅ **Cascade deletes** - Clean up related data  
✅ **Performance indexes** - Optimized queries  
✅ **Password hashing** - bcrypt with salt  

---

## API Integration

The `/api` directory contains all API routes that interact with SQLite:

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

#### Database Not Created

**Error**: `SQLITE_CANTOPEN: unable to open database file`

**Solutions**:
1. Ensure the `data/` directory exists or can be created
2. Check file permissions
3. Verify `DATABASE_PATH` environment variable

#### Build Errors

**Error**: Various TypeScript or build errors

**Solutions**:
```bash
# Clean and reinstall
rm -rf node_modules .next
npm install
npm run build
```

#### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solutions**:
1. Use a different port: `npm run dev -- -p 3001`
2. Kill the process using port 3000

### Production Issues

#### Cannot Connect to Database

**Check**:
1. ✅ `DATABASE_PATH` is set correctly
2. ✅ Path is accessible and writable
3. ✅ File permissions are correct

#### JWT Authentication Errors

**Error**: Token verification failed

**Common Causes**:
1. `JWT_SECRET` not set or different between environments
2. Token expired
3. Token corrupted

**Solution**: Ensure `JWT_SECRET` is the same across all deployments

#### Performance Issues

For high-traffic applications:
1. Consider migrating to PostgreSQL
2. Enable connection pooling
3. Add caching layer

### Getting Help

1. Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. Review error messages in the console
3. Check SQLite database integrity

---

## Next Steps

### Development Checklist

- [x] Install dependencies
- [x] Configure environment
- [x] Start application
- [ ] Test authentication flow
- [ ] Create sample project
- [ ] Generate invoice
- [ ] Process payment

### Production Checklist

- [ ] Configure production environment
- [ ] Build application
- [ ] Set up persistent storage
- [ ] Deploy application
- [ ] Test production deployment
- [ ] Set up monitoring
- [ ] Configure backups

---

## Additional Resources

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[SQLite Docs](https://www.sqlite.org/docs.html)** - Database documentation

---

**Happy coding with ARES!** 🚀
