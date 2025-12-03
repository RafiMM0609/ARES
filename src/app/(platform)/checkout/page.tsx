'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDashboardData, useWallet } from '@/hooks';
import { LoadingSpinner, ErrorMessage, StatusBadge } from '@/components/ui';
import { DashboardHeader, DashboardSection } from '@/components/dashboard';
import { PaymentModal } from '@/components/checkout';
import type { InvoiceWithRelations } from '@/services';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  
  const { data, loading, error, refetch } = useDashboardData();
  const { isConnected, address } = useWallet();
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (invoiceId && data?.invoices) {
      const invoice = data.invoices.find(inv => inv.id === invoiceId);
      if (invoice && invoice.status !== 'paid') {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
      }
    }
  }, [invoiceId, data?.invoices]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const { invoices } = data;
  
  const unpaidInvoices = invoices.filter(
    inv => inv.status !== 'paid' && inv.status !== 'cancelled'
  );

  const handlePayClick = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    refetch();
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="Checkout - Pay Invoices" />

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Wallet not connected:</strong> Please connect your wallet to make payments.
          </p>
        </div>
      )}

      <DashboardSection title="Unpaid Invoices">
        {unpaidInvoices.length === 0 ? (
          <p className="text-gray-500">No unpaid invoices. You&apos;re all caught up!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Freelancer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unpaidInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.project?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.freelancer?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      ${invoice.amount} {invoice.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePayClick(invoice)}
                        disabled={!isConnected}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSection>

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          walletAddress={address}
          onSuccess={handlePaymentSuccess}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutContent />
    </Suspense>
  );
}
