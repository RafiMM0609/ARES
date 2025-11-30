'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks';
import { LoadingSpinner, ErrorMessage, StatCard } from '@/components/ui';
import { ProjectForm } from '@/components/forms';
import { 
  DashboardHeader, 
  DashboardSection, 
  ProjectList, 
  InvoiceTable,
  TopJobCategoriesSection
} from '@/components/dashboard';

export default function ClientDashboard() {
  const { data, loading, error, refetch } = useDashboardData();
  const [showProjectForm, setShowProjectForm] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const { projects, invoices, payments } = data;
  const pendingInvoicesCount = invoices.filter(inv => inv.status === 'sent').length;
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Client Dashboard"
        action={{
          label: '+ New Project',
          onClick: () => setShowProjectForm(!showProjectForm),
          isActive: showProjectForm,
        }}
      />

      {showProjectForm && (
        <ProjectForm 
          onSuccess={refetch} 
          onCancel={() => setShowProjectForm(false)} 
        />
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Projects" 
          value={projects.length} 
          colorClass="text-blue-600"
        />
        <StatCard 
          title="Pending Invoices" 
          value={pendingInvoicesCount} 
          colorClass="text-yellow-600"
        />
        <StatCard 
          title="Total Paid" 
          value={`$${totalPaid.toFixed(2)}`} 
          colorClass="text-green-600"
        />
      </div>

      {/* Top 5 Job Categories Section */}
      <DashboardSection title="Top 5 Kategori Pekerjaan">
        <TopJobCategoriesSection />
      </DashboardSection>

      {/* Projects Section */}
      <DashboardSection title="My Projects">
        <ProjectList 
          projects={projects} 
          viewType="client"
          emptyMessage="No projects yet. Create your first project!"
        />
      </DashboardSection>

      {/* Invoices Section */}
      <DashboardSection title="Invoices">
        <InvoiceTable invoices={invoices} viewType="client" />
      </DashboardSection>
    </div>
  );
}
