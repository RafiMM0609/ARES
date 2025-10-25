'use client';

import { useState, useEffect } from 'react';
import { projectService, invoiceService, paymentService } from '@/services';
import type { ProjectWithRelations, InvoiceWithRelations, PaymentWithRelations } from '@/services';

export default function FreelancerDashboard() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, invoicesData, paymentsData] = await Promise.all([
        projectService.getProjects({ type: 'my_projects' }),
        invoiceService.getInvoices(),
        paymentService.getPayments(),
      ]);
      
      setProjects(projectsData.projects);
      setInvoices(invoicesData.invoices);
      setPayments(paymentsData.payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  const totalEarnings = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingInvoices = invoices.filter(inv => inv.status === 'sent');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Freelancer Dashboard</h1>
        <button
          onClick={() => setShowInvoiceForm(!showInvoiceForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showInvoiceForm ? 'Cancel' : '+ Create Invoice'}
        </button>
      </div>

      {showInvoiceForm && (
        <InvoiceForm 
          projects={projects} 
          onSuccess={loadData} 
          onCancel={() => setShowInvoiceForm(false)} 
        />
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Active Projects</h3>
          <p className="text-3xl font-bold text-blue-600">
            {projects.filter(p => p.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Invoices</h3>
          <p className="text-3xl font-bold text-yellow-600">{pendingInvoices.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Available Projects Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Projects</h2>
        <AvailableProjects />
      </div>

      {/* My Projects Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                    <div className="mt-2 flex gap-4 text-sm text-gray-500">
                      <span>Budget: ${project.budget_amount} {project.budget_currency}</span>
                      {project.client && <span>Client: {project.client.full_name}</span>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Invoices</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-500">No invoices created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.project?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.client?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.amount} {invoice.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'sent' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment History</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500">No payments received yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {payment.invoice?.invoice_number || 'Direct Payment'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'Pending'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${payment.amount} {payment.currency}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AvailableProjects() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { projects } = await projectService.getProjects({ type: 'available', status: 'open' });
        setProjects(projects);
      } catch (error) {
        console.error('Failed to load available projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading available projects...</p>;
  }

  if (projects.length === 0) {
    return <p className="text-gray-500">No available projects at the moment.</p>;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{project.description}</p>
          <div className="mt-2 flex gap-4 text-sm text-gray-500">
            <span>Budget: ${project.budget_amount} {project.budget_currency}</span>
            {project.deadline && (
              <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
            )}
          </div>
          <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}

function InvoiceForm({ 
  projects, 
  onSuccess, 
  onCancel 
}: { 
  projects: ProjectWithRelations[]; 
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    project_id: '',
    amount: '',
    currency: 'USD',
    due_date: '',
    description: '',
    item_description: '',
    item_quantity: '1',
    item_unit_price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      if (!selectedProject) {
        throw new Error('Please select a project');
      }

      await invoiceService.createInvoice({
        project_id: formData.project_id,
        client_id: selectedProject.client_id,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        due_date: formData.due_date,
        description: formData.description,
        items: [
          {
            description: formData.item_description,
            quantity: parseFloat(formData.item_quantity),
            unit_price: parseFloat(formData.item_unit_price),
          }
        ]
      });
      
      onSuccess();
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Invoice</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
            Select Project
          </label>
          <select
            id="project_id"
            required
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title} (${project.budget_amount})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Invoice Description
          </label>
          <textarea
            id="description"
            required
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Total Amount
            </label>
            <input
              id="amount"
              type="number"
              required
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            id="due_date"
            type="date"
            required
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Invoice Line Item</h4>
          
          <div>
            <label htmlFor="item_description" className="block text-sm font-medium text-gray-700 mb-1">
              Item Description
            </label>
            <input
              id="item_description"
              type="text"
              required
              value={formData.item_description}
              onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Development (40 hours)"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <div>
              <label htmlFor="item_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                id="item_quantity"
                type="number"
                required
                step="0.01"
                value={formData.item_quantity}
                onChange={(e) => setFormData({ ...formData, item_quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="item_unit_price" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price
              </label>
              <input
                id="item_unit_price"
                type="number"
                required
                step="0.01"
                value={formData.item_unit_price}
                onChange={(e) => setFormData({ ...formData, item_unit_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
