'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks';
import { LoadingSpinner, ErrorMessage, StatCard } from '@/components/ui';
import { InvoiceForm } from '@/components/forms';
import { 
  DashboardHeader, 
  DashboardSection, 
  ProjectList, 
  InvoiceTable,
  PaymentList,
  AvailableProjectsSection
} from '@/components/dashboard';

export default function FreelancerDashboard() {
  const { data, loading, error, refetch } = useDashboardData();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const { projects, invoices, payments } = data;
  
  const activeProjectsCount = projects.filter(p => p.status === 'in_progress').length;
  const pendingInvoicesCount = invoices.filter(inv => inv.status === 'sent').length;
  const totalEarnings = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Freelancer Dashboard"
        action={{
          label: '+ Create Invoice',
          onClick: () => setShowInvoiceForm(!showInvoiceForm),
          isActive: showInvoiceForm,
        }}
      />

      {showInvoiceForm && (
        <InvoiceForm 
          projects={projects} 
          onSuccess={refetch} 
          onCancel={() => setShowInvoiceForm(false)} 
        />
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Projects" 
          value={activeProjectsCount} 
          colorClass="text-blue-600"
        />
        <StatCard 
          title="Pending Invoices" 
          value={pendingInvoicesCount} 
          colorClass="text-yellow-600"
        />
        <StatCard 
          title="Total Earnings" 
          value={`$${totalEarnings.toFixed(2)}`} 
          colorClass="text-green-600"
        />
      </div>

      {/* Available Projects Section */}
      <DashboardSection title="Available Projects">
        <AvailableProjectsSection />
      </DashboardSection>

      {/* My Projects Section */}
      <DashboardSection title="My Projects">
        <ProjectList 
          projects={projects} 
          viewType="freelancer"
          emptyMessage="No projects assigned yet."
        />
      </DashboardSection>

      {/* Invoices Section */}
      <DashboardSection title="My Invoices">
        <InvoiceTable invoices={invoices} viewType="freelancer" />
      </DashboardSection>

      {/* Payment History */}
      <DashboardSection title="Payment History">
        <PaymentList payments={payments} />
      </DashboardSection>
    </div>
  );
}
