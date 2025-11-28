'use client';

import { StatusBadge } from '@/components/ui';
import type { PaymentWithRelations } from '@/services';

interface PaymentListProps {
  payments: PaymentWithRelations[];
}

export function PaymentList({ payments }: PaymentListProps) {
  if (payments.length === 0) {
    return <p className="text-gray-500">No payments received yet.</p>;
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="flex justify-between items-center border-b border-gray-200 pb-3">
          <div>
            <p className="font-medium text-gray-900">
              {payment.invoice?.invoice_number || 'Direct Payment'}
            </p>
            <p className="text-sm text-gray-500">
              {payment.payment_date 
                ? new Date(payment.payment_date).toLocaleDateString() 
                : 'Pending'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              ${payment.amount} {payment.currency}
            </p>
            <StatusBadge status={payment.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
