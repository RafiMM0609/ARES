'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { projectService } from '@/services';
import type { ProjectWithRelations } from '@/services';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { projects } = await projectService.getProjects({ 
        type: 'available', 
        status: 'open' 
      });
      setProjects(projects);
    } catch (err) {
      // If API fails, use mock data for demonstration
      console.error('Failed to load projects, using mock data:', err);
      setProjects(mockProjects);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    // Category filtering is disabled since the database doesn't have a category field yet
    // const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Temukan Proyek Freelance</h1>
          <p className="text-xl text-blue-100">Ribuan proyek menunggu talenta terbaik seperti Anda</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Cari Proyek
              </label>
              <input
                id="search"
                type="text"
                placeholder="Cari berdasarkan judul atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-apps">Mobile Apps</option>
                <option value="design">Design Grafis</option>
                <option value="writing">Penulisan</option>
                <option value="marketing">Marketing</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Memuat proyek...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Tidak ada proyek yang sesuai dengan pencarian Anda</div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectWithRelations | MockProject }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
          <p className="text-gray-600 mb-4">{project.description}</p>
        </div>
        <div className="ml-4 text-right">
          <div className="text-3xl font-bold text-blue-600">
            ${project.budget_amount}
          </div>
          <div className="text-sm text-gray-500">{project.budget_currency || 'USD'}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {'required_skills' in project && project.required_skills && project.required_skills.length > 0 ? (
          project.required_skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {'category' in project ? project.category : 'General'}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex gap-4 text-sm text-gray-600">
          {project.client && (
            <span>👤 {project.client.full_name}</span>
          )}
          {project.deadline && (
            <span>📅 Deadline: {new Date(project.deadline).toLocaleDateString('id-ID')}</span>
          )}
        </div>
        <Link
          href="/signup"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Now
        </Link>
      </div>
    </div>
  );
}

// Interface for mock projects with extended fields for demo purposes
interface MockProject extends ProjectWithRelations {
  required_skills?: string[];
  category?: string;
}

// Mock data for demonstration when API is not available
const mockProjects: MockProject[] = [
  {
    id: '1',
    title: 'Website E-Commerce Modern',
    description: 'Membutuhkan developer untuk membuat website e-commerce dengan fitur lengkap termasuk payment gateway, shopping cart, dan admin dashboard.',
    budget_amount: 5000,
    budget_currency: 'USD',
    status: 'open',
    client_id: 'client1',
    freelancer_id: null,
    start_date: null,
    completion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    required_skills: ['React', 'Node.js', 'PostgreSQL'],
    category: 'web-development',
    client: {
      id: 'client1',
      full_name: 'PT. Digital Indonesia',
      email: 'contact@digitalindonesia.com',
    }
  },
  {
    id: '2',
    title: 'Mobile App untuk Delivery Food',
    description: 'Aplikasi mobile iOS dan Android untuk layanan pesan antar makanan. Butuh UI/UX yang menarik dan user-friendly.',
    budget_amount: 8000,
    budget_currency: 'USD',
    status: 'open',
    client_id: 'client2',
    freelancer_id: null,
    start_date: null,
    completion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    required_skills: ['React Native', 'Firebase', 'UI/UX'],
    category: 'mobile-apps',
    client: {
      id: 'client2',
      full_name: 'FoodHub Startup',
      email: 'hello@foodhub.com',
    }
  },
  {
    id: '3',
    title: 'Logo dan Branding untuk Startup',
    description: 'Mencari designer untuk membuat logo, brand identity, dan marketing materials untuk startup teknologi baru.',
    budget_amount: 1500,
    budget_currency: 'USD',
    status: 'open',
    client_id: 'client3',
    freelancer_id: null,
    start_date: null,
    completion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    required_skills: ['Adobe Illustrator', 'Branding', 'Graphic Design'],
    category: 'design',
    client: {
      id: 'client3',
      full_name: 'TechStart Inc',
      email: 'info@techstart.com',
    }
  },
  {
    id: '4',
    title: 'Content Writer untuk Blog Tech',
    description: 'Membutuhkan penulis konten berpengalaman untuk menulis 10 artikel tentang teknologi, AI, dan programming.',
    budget_amount: 800,
    budget_currency: 'USD',
    status: 'open',
    client_id: 'client4',
    freelancer_id: null,
    start_date: null,
    completion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    required_skills: ['Content Writing', 'SEO', 'Technology'],
    category: 'writing',
    client: {
      id: 'client4',
      full_name: 'TechBlog Media',
      email: 'editor@techblog.com',
    }
  },
  {
    id: '5',
    title: 'Digital Marketing Campaign',
    description: 'Butuh digital marketer untuk menjalankan kampanye social media dan Google Ads selama 3 bulan.',
    budget_amount: 3000,
    budget_currency: 'USD',
    status: 'open',
    client_id: 'client5',
    freelancer_id: null,
    start_date: null,
    completion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    required_skills: ['Digital Marketing', 'Google Ads', 'Social Media'],
    category: 'marketing',
    client: {
      id: 'client5',
      full_name: 'Retail Shop Online',
      email: 'marketing@retailshop.com',
    }
  },
  {
    id: '6',
    title: 'Video Editor untuk YouTube Channel',
    description: 'Mencari video editor untuk mengedit 20 video YouTube dengan durasi 10-15 menit per video.',
    budget_amount: 1200,
    budget_currency: 'USD',
    status: 'open',
    client_id: 'client6',
    freelancer_id: null,
    start_date: null,
    completion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    required_skills: ['Video Editing', 'Adobe Premiere', 'After Effects'],
    category: 'other',
    client: {
      id: 'client6',
      full_name: 'ContentCreator Pro',
      email: 'studio@contentcreator.com',
    }
  },
];
