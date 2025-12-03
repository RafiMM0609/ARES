'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui';
import type { InvoiceWithRelations } from '@/services';

interface InvoiceTableProps {
  invoices: InvoiceWithRelations[];
  viewType: 'client' | 'freelancer';
}

export function InvoiceTable({ invoices, viewType }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return <p className="text-gray-500">No invoices yet.</p>;
  }

  const counterpartLabel = viewType === 'client' ? 'Freelancer' : 'Client';
  const isClient = viewType === 'client';

  const canPayInvoice = (status: string) => {
    return isClient && status !== 'paid' && status !== 'cancelled';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{counterpartLabel}</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            {isClient && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => {
            const counterpart = viewType === 'client' ? invoice.freelancer : invoice.client;
            
            return (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoice_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.project?.title || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {counterpart?.full_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${invoice.amount} {invoice.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                </td>
                {isClient && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canPayInvoice(invoice.status) ? (
                      <Link
                        href={`/checkout?invoice=${invoice.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        Pay Now
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
