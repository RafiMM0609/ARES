'use client';

import { useTopCategories } from '@/hooks';

// Map category names to icons
const categoryIcons: Record<string, string> = {
  'Programming': '💻',
  'Framework': '⚙️',
  'Backend': '🖥️',
  'Design': '🎨',
  'Writing': '✍️',
  'Marketing': '📢',
  'Data': '📊',
  'Video': '🎬',
  'Translation': '🌐',
  'SEO': '🔍',
  'Consulting': '💼',
  'Photography': '📷',
  'Music': '🎵',
  'Mobile': '📱',
};

function getCategoryIcon(categoryName: string): string {
  // Try to find a matching icon
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  // Default icon
  return '📁';
}

export function TopJobCategoriesSection() {
  const { categories, loading, error } = useTopCategories();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="bg-gray-100 animate-pulse rounded-lg p-4 h-24"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-gray-500 py-4">
        Gagal memuat kategori. Silakan coba lagi.
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        Belum ada kategori pekerjaan tersedia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {categories.map((category, index) => (
        <div
          key={category.name}
          className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-4 text-center transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        >
          <div className="text-3xl mb-2">{getCategoryIcon(category.name)}</div>
          <h3 className="font-semibold text-gray-900 text-sm md:text-base">
            {category.name}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {category.count} keahlian
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
              {index + 1}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
