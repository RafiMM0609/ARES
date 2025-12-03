'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks';
import { paymentService, walletService } from '@/services';
import { Button } from '@/components/ui';
import type { InvoiceWithRelations } from '@/services';

interface PaymentModalProps {
  invoice: InvoiceWithRelations;
  walletAddress: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentStep = 'review' | 'processing' | 'success' | 'error';

export function PaymentModal({
  invoice,
  walletAddress,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const { isQINetwork, switchNetwork, refreshBalance } = useWallet();
  const [step, setStep] = useState<PaymentStep>('review');
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const freelancerWallet = invoice.freelancer?.wallet_address;

  const handlePayment = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!freelancerWallet) {
      setError('Freelancer wallet address not available. Please contact support.');
      return;
    }

    if (!isQINetwork) {
      try {
        await switchNetwork();
      } catch {
        setError('Please switch to QI Network to make payment.');
        return;
      }
    }

    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      const amountInQIE = invoice.amount.toString();
      
      const txResult = await walletService.sendQIE(freelancerWallet, amountInQIE);

      if (!txResult.success) {
        throw new Error(txResult.error || 'Transaction failed');
      }

      setTransactionHash(txResult.hash || null);

      await paymentService.createPayment({
        invoice_id: invoice.id,
        payee_id: invoice.freelancer_id,
        amount: invoice.amount,
        currency: 'QIE',
        payment_method: 'wallet',
        transaction_hash: txResult.hash,
      });

      await refreshBalance();
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'review' && 'Review Payment'}
              {step === 'processing' && 'Processing Payment'}
              {step === 'success' && 'Payment Successful'}
              {step === 'error' && 'Payment Failed'}
            </h2>
            {step !== 'processing' && (
              <button
                onClick={step === 'success' ? handleSuccessClose : onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number</span>
                  <span className="font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project</span>
                  <span className="font-medium">{invoice.project?.title || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Freelancer</span>
                  <span className="font-medium">{invoice.freelancer?.full_name || 'N/A'}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    {invoice.amount} QIE
                  </span>
                </div>
              </div>

              {!freelancerWallet && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    The freelancer has not set up their wallet address. Please contact them to proceed with payment.
                  </p>
                </div>
              )}

              {!isQINetwork && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    You will be prompted to switch to QI Network before the transaction.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!freelancerWallet || isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your payment...</p>
              <p className="text-sm text-gray-500 mt-2">
                Please confirm the transaction in your wallet.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your payment of {invoice.amount} QIE has been sent successfully.
              </p>
              {transactionHash && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{transactionHash}</p>
                </div>
              )}
              <Button onClick={handleSuccessClose} className="w-full">
                Done
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStep('review')} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
