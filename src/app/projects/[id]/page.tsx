'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/ui';

interface ProjectClient {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  due_date: string | null;
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  client_id: string;
  budget_amount: number | null;
  budget_currency: string;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  client: ProjectClient | null;
  milestones: ProjectMilestone[];
}

// Mock data for demonstration
const mockProject: ProjectDetail = {
  id: 'mock-1',
  title: 'Website E-Commerce Modern',
  description: `Membutuhkan developer untuk membuat website e-commerce dengan fitur lengkap termasuk:
  
• Payment gateway integration (Stripe, PayPal)
• Shopping cart dengan persistent storage
• Admin dashboard untuk manajemen produk dan pesanan
• Sistem notifikasi email
• Responsive design untuk mobile dan desktop
• SEO optimization
• Multi-language support (ID, EN)

Teknologi yang digunakan: React/Next.js, Node.js, PostgreSQL

Kami mencari developer dengan pengalaman minimal 3 tahun dalam pengembangan web e-commerce. Portfolio proyek sebelumnya akan menjadi nilai tambah.`,
  client_id: 'client-1',
  budget_amount: 5000,
  budget_currency: 'USD',
  status: 'open',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  client: {
    id: 'client-1',
    full_name: 'PT. Digital Indonesia',
    avatar_url: null,
  },
  milestones: [
    {
      id: 'milestone-1',
      project_id: 'mock-1',
      title: 'Desain & Wireframe',
      description: 'Pembuatan desain UI/UX dan wireframe seluruh halaman',
      amount: 1000,
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'milestone-2',
      project_id: 'mock-1',
      title: 'Frontend Development',
      description: 'Implementasi frontend dengan React/Next.js',
      amount: 2000,
      status: 'pending',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'milestone-3',
      project_id: 'mock-1',
      title: 'Backend & Integrasi',
      description: 'API development, database setup, dan payment integration',
      amount: 2000,
      status: 'pending',
      due_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/public/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
          setUsingMockData(false);
        } else {
          // API not available or project not found, use mock data for demo
          setProject({ ...mockProject, id });
          setUsingMockData(true);
        }
      } catch {
        // Network error or API unavailable, use mock data for demo
        setProject({ ...mockProject, id });
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner message="Memuat detail proyek..." />
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage message={error} />
          <Link 
            href="/projects"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Kembali ke daftar proyek
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <ErrorMessage message="Proyek tidak ditemukan" />
          <Link 
            href="/projects"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Kembali ke daftar proyek
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilDeadline = project.deadline 
    ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const totalMilestoneAmount = project.milestones.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <Link 
            href="/projects"
            className="text-blue-100 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Proyek
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{project.title}</h1>
          <div className="flex flex-wrap gap-4 mt-4 items-center">
            <StatusBadge status={project.status} size="md" />
            <span className="text-blue-100">
              Diposting {new Date(project.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mock Data Notification */}
        {usingMockData && (
          <div 
            className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <strong>Mode Demo:</strong> Menampilkan data contoh. Untuk melihat proyek real, silakan setup database.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Deskripsi Proyek
              </h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {project.description || 'Tidak ada deskripsi tersedia.'}
              </div>
            </div>

            {/* Milestones Card */}
            {project.milestones.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Milestone Proyek
                </h2>
                <div className="space-y-4">
                  {project.milestones.map((milestone, index) => (
                    <div 
                      key={milestone.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </span>
                          <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                        </div>
                        <span className="text-green-600 font-semibold">
                          ${milestone.amount.toLocaleString()}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="text-gray-600 text-sm ml-11 mb-2">{milestone.description}</p>
                      )}
                      {milestone.due_date && (
                        <p className="text-gray-500 text-sm ml-11 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Deadline: {new Date(milestone.due_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-600">Total Milestone</span>
                  <span className="text-lg font-bold text-green-600">
                    ${totalMilestoneAmount.toLocaleString()} {project.budget_currency}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Anggaran</h2>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-blue-600">
                  ${project.budget_amount?.toLocaleString() || '0'}
                </div>
                <div className="text-gray-500 mt-1">{project.budget_currency}</div>
              </div>
              <Link
                href="/signup"
                className="w-full block text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold mt-4"
              >
                Apply untuk Proyek Ini
              </Link>
              <p className="text-sm text-gray-500 text-center mt-3">
                Daftar atau masuk untuk melamar
              </p>
            </div>

            {/* Project Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Proyek</h2>
              <div className="space-y-4">
                {/* Client Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {project.client?.avatar_url ? (
                      <img 
                        src={project.client.avatar_url} 
                        alt={project.client.full_name || 'Client'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Client</div>
                    <div className="font-medium text-gray-900">
                      {project.client?.full_name || 'Anonymous'}
                    </div>
                  </div>
                </div>

                {/* Deadline */}
                {project.deadline && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Deadline</div>
                      <div className="font-medium text-gray-900">
                        {new Date(project.deadline).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      {daysUntilDeadline !== null && (
                        <div className={`text-sm ${daysUntilDeadline > 7 ? 'text-green-600' : daysUntilDeadline > 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {daysUntilDeadline > 0 
                            ? `${daysUntilDeadline} hari tersisa`
                            : 'Sudah lewat deadline'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Milestones Count */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Jumlah Milestone</div>
                    <div className="font-medium text-gray-900">
                      {project.milestones.length} milestone
                    </div>
                  </div>
                </div>

                {/* Posted Date */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Diposting</div>
                    <div className="font-medium text-gray-900">
                      {new Date(project.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips Melamar
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Baca deskripsi proyek dengan teliti
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Siapkan portfolio yang relevan
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Jelaskan pengalaman Anda dengan jelas
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  Berikan estimasi waktu yang realistis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
