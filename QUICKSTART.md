# ARES Quick Start Guide

Get up and running with ARES in under 5 minutes!

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18.x or later installed ([Download](https://nodejs.org/))
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

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local
```

The example file contains default configuration. Edit `.env.local` if you want to customize:

```env
# SQLite Database Configuration
DATABASE_PATH=./data/ares.db

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your-very-secure-random-secret-key-change-this-in-production
```

### 3. Start the Application

```bash
npm run dev
```

The SQLite database will be automatically created on first run.

### 4. Open in Browser

Visit [http://localhost:3000](http://localhost:3000) 🎉

## 🎯 What You Get

After setup, you have:

✅ **SQLite database** automatically created  
✅ **11 database tables** with sample skills data  
✅ **14 API endpoints** for authentication, projects, invoices, payments  
✅ **TypeScript types** for type-safe development  
✅ **JWT authentication** with secure password hashing  

## 📝 Next Steps

### Test Authentication

1. Go to http://localhost:3000/signup
2. Create a test account
3. Login at http://localhost:3000/login

### Create a Project (via API)

First, get authenticated, then:

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=<your-auth-token>" \
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
  -H "Cookie: auth_token=<your-auth-token>" \
  -d '{
    "client_id": "your-client-id",
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

**Note**: The freelancer_id is automatically set from the authenticated user.

## 🛠️ Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 📚 Documentation

For more detailed information:

- **[INSTALLATION.md](INSTALLATION.md)** - Complete setup guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What was built

## 🐛 Troubleshooting

### Can't Access localhost:3000

**Fix**:
1. Check the console for errors
2. Make sure `.env.local` exists
3. Restart the dev server: `npm run dev`

### Database Errors

**Fix**:
1. Delete the `data/ares.db` file to reset the database
2. Restart the dev server

### Build Errors

**Fix**:
1. Delete `node_modules` and `.next` directories
2. Run `npm install` again
3. Try `npm run build`

## 🆘 Getting Help

- Check existing issues on GitHub
- Review the documentation files
- Run the validation script: `./scripts/validate-setup.sh`

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Ready to build?** Start coding and watch your freelancer platform come to life! 🚀
