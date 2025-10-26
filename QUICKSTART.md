# ARES Quick Start Guide

Get up and running with ARES in under 5 minutes!

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18.x or later installed ([Download](https://nodejs.org/))
- [ ] Docker Desktop installed and running ([Download](https://www.docker.com/products/docker-desktop))
- [ ] Git installed
- [ ] A code editor (VS Code recommended)

## 🚀 Quick Start (Local Development)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/RafiMM0609/ARES.git
cd ARES

# Install dependencies
npm install
```

### 2. Validate Setup

```bash
# Run validation script
./scripts/validate-setup.sh
```

This checks that everything is installed correctly.

### 3. Start Supabase

```bash
# Start local Supabase instance (first time takes ~5 minutes)
npm run supabase:start
```

**Important**: Copy the API URL and keys from the output! You'll need them in the next step.

Example output:
```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

The example file already contains the default local keys. If you want to use the keys from step 3, edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
```

### 5. Start the Application

```bash
npm run dev
```

### 6. Open in Browser

Visit [http://localhost:3000](http://localhost:3000) 🎉

### 7. Explore Supabase Studio

Visit [http://localhost:54323](http://localhost:54323) to see:
- Database tables
- Real-time data
- Authentication settings
- Storage management

## 🎯 What You Get

After setup, you have:

✅ **Local Supabase instance** running in Docker  
✅ **10 database tables** with sample data  
✅ **14 API endpoints** for authentication, projects, invoices, payments  
✅ **Row Level Security (RLS)** enabled  
✅ **TypeScript types** for type-safe development  
✅ **Supabase Studio** for database management  

## 📝 Next Steps

### Test Authentication

1. Go to http://localhost:3000/signup
2. Create a test account
3. Login at http://localhost:3000/login

### Browse the Database

1. Open Supabase Studio at http://localhost:54323
2. Click "Table Editor"
3. See your test user in the `profiles` table

### Create a Project (via API)

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Project",
    "description": "Testing the API",
    "budget_amount": 1000
  }'
```

### Generate an Invoice

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "your-client-id",
    "freelancer_id": "your-freelancer-id",
    "amount": 1000,
    "items": [
      {
        "description": "Development work",
        "quantity": 10,
        "unit_price": 100
      }
    ]
  }'
```

## 🛠️ Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run supabase:start` | Start Supabase |
| `npm run supabase:stop` | Stop Supabase |
| `npm run supabase:status` | Check Supabase status |
| `npm run supabase:reset` | Reset database (⚠️ destroys data) |
| `npm run supabase:types` | Generate TypeScript types |

## 📚 Documentation

For more detailed information:

- **[INSTALLATION.md](INSTALLATION.md)** - Complete setup guide
- **[SUPABASE_LOCAL_SETUP.md](SUPABASE_LOCAL_SETUP.md)** - Local development details
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Production setup
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference

## 🐛 Troubleshooting

### Docker Not Running

**Error**: `Cannot connect to the Docker daemon`

**Fix**: Start Docker Desktop and wait for it to fully start

### Port Already in Use

**Error**: `Port 54321 is already in use`

**Fix**: 
```bash
npm run supabase:stop
npm run supabase:start
```

### Can't Access localhost:3000

**Fix**:
1. Check the console for errors
2. Make sure `.env.local` exists
3. Restart the dev server: `npm run dev`

### Database Connection Failed

**Fix**:
1. Check Supabase is running: `npm run supabase:status`
2. Verify environment variables in `.env.local`
3. Try resetting: `npm run supabase:reset`

## 🆘 Getting Help

- Check existing issues on GitHub
- Review the documentation files
- Run the validation script: `./scripts/validate-setup.sh`

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Ready to build?** Start coding and watch your freelancer platform come to life! 🚀
