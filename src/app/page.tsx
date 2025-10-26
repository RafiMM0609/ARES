// src/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            ARES
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Global Payment, Zero Resistance
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-blue-100">
            Solusi pembayaran lintas batas instan untuk freelancer
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/signup" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Get Started →
            </Link>
            <Link 
              href="/login" 
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Log In
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 text-white">
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">🚀 Instant Payments</h3>
            <p className="text-blue-100">Get paid instantly with blockchain-powered cross-border payments</p>
          </div>
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">💼 Project Management</h3>
            <p className="text-blue-100">Manage projects, milestones, and invoices all in one place</p>
          </div>
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">🔒 Secure & Transparent</h3>
            <p className="text-blue-100">All transactions are recorded on the blockchain for complete transparency</p>
          </div>
        </div>
      </div>
    </main>
  );
}
