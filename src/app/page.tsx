// src/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              ARES
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Platform Freelance Global
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Temukan talenta terbaik atau dapatkan pekerjaan impian Anda
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <Link 
                href="/signup" 
                className="bg-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg text-gray-700"
              >
                Mulai Sekarang →
              </Link>
              <Link 
                href="/login" 
                className="bg-blue-700 text-gray-100 px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
              >
                Masuk
              </Link>
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="bg-blue-900 bg-opacity-10 p-6 rounded-2xl backdrop-blur-sm ">
              <h3 className="text-xl font-semibold mb-3 text-(--global-text)">🚀 Pembayaran Instan</h3>
              <p className="text-(--global-text)">Terima pembayaran dengan cepat menggunakan teknologi blockchain</p>
            </div>
            <div className="bg-blue-900 bg-opacity-10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-(--global-text)">💼 Manajemen Proyek</h3>
              <p className="text-(--global-text)">Kelola proyek, milestone, dan invoice dalam satu platform</p>
            </div>
            <div className="bg-blue-900 bg-opacity-10 p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3 text-(--global-text)">🔒 Aman & Terpercaya</h3>
              <p className="text-(--global-text)">Semua transaksi tercatat di blockchain untuk transparansi penuh</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Kategori Populer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link 
                key={category.name}
                href="/projects"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Cara Kerja</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Buat Akun</h3>
              <p className="text-(--global-text)">Daftar sebagai client atau freelancer dalam hitungan menit</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Posting atau Browse Proyek</h3>
              <p className="text-(--global-text)">Client posting proyek, freelancer cari pekerjaan yang sesuai</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Kerjakan & Terima Bayaran</h3>
              <p className="text-(--global-text)">Selesaikan proyek dan terima pembayaran dengan aman</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Memulai?</h2>
          <p className="text-xl mb-8 text-blue-100">Bergabung dengan ribuan freelancer dan client di ARES</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/signup" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Daftar Gratis
            </Link>
            <Link 
              href="/projects" 
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Browse Proyek
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">ARES</h3>
              <p className="text-sm">Platform freelance global dengan pembayaran instan dan transparan.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Untuk Client</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/projects" className="hover:text-white">Cari Freelancer</Link></li>
                <li><Link href="/signup" className="hover:text-white">Post Proyek</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Untuk Freelancer</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/projects" className="hover:text-white">Cari Pekerjaan</Link></li>
                <li><Link href="/signup" className="hover:text-white">Daftar Sekarang</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tentang</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-white">Kontak</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 ARES. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

const categories = [
  { name: 'Web Development', icon: '💻' },
  { name: 'Mobile Apps', icon: '📱' },
  { name: 'Design Grafis', icon: '🎨' },
  { name: 'Penulisan', icon: '✍️' },
  { name: 'Marketing', icon: '📢' },
  { name: 'Video Editing', icon: '🎬' },
  { name: 'Data Entry', icon: '📊' },
  { name: 'Translation', icon: '🌐' },
  { name: 'SEO', icon: '🔍' },
  { name: 'Konsultasi', icon: '💼' },
  { name: 'Fotografi', icon: '📷' },
  { name: 'Musik', icon: '🎵' },
];
