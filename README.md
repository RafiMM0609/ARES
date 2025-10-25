# ARES - Global Payment, Zero Resistance

Solusi pembayaran lintas batas instan untuk freelancer.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/RafiMM0609/ARES.git
cd ARES
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
└── app/
    ├── (auth)/              # Route group for authentication
    │   ├── login/
    │   │   └── page.tsx     # Login page
    │   └── layout.tsx       # Auth layout (without navbar)
    ├── (platform)/          # Route group for main platform
    │   ├── client/
    │   │   └── page.tsx     # Client dashboard
    │   ├── freelancer/
    │   │   └── page.tsx     # Freelancer dashboard
    │   └── layout.tsx       # Platform layout (with navbar)
    ├── layout.tsx           # Root layout
    ├── page.tsx             # Landing page
    └── globals.css          # Global styles
```

## 🛣️ Routes

- `/` - Landing page
- `/login` - Login page
- `/client` - Client dashboard
- `/freelancer` - Freelancer dashboard

## 🛠️ Built With

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔒 Route Groups

This project uses Next.js App Router route groups:

- `(auth)` - Authentication routes without platform navigation
- `(platform)` - Platform routes with navigation bar

Route groups allow you to organize routes without affecting the URL structure.

## 🎯 Next Steps

1. Implement authentication mechanism
2. Secure `/client` and `/freelancer` routes with middleware
3. Integrate smart contract and wallet connections
4. Build out dashboard functionality
5. Add invoice creation and payment tracking

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.
