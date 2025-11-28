'use client';

import { useInvoiceForm } from '@/hooks';
import { Button, FormInput, FormSelect, FormTextarea, ErrorMessage } from '@/components/ui';
import type { ProjectWithRelations } from '@/services';

interface InvoiceFormProps {
  projects: ProjectWithRelations[];
  onSuccess: () => void;
  onCancel: () => void;
}

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export function InvoiceForm({ projects, onSuccess, onCancel }: InvoiceFormProps) {
  const { formData, setFormData, loading, error, submitInvoice, resetForm } = useInvoiceForm();

  const projectOptions = [
    { value: '', label: '-- Select a project --' },
    ...projects.map((project) => ({
      value: project.id,
      label: `${project.title} ($${project.budget_amount} ${project.budget_currency})`,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitInvoice(projects);
    if (success) {
      resetForm();
      onSuccess();
      onCancel();
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Invoice</h3>
      
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormSelect
          id="project_id"
          label="Select Project"
          required
          options={projectOptions}
          value={formData.project_id}
          onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
        />

        <FormTextarea
          id="description"
          label="Invoice Description"
          required
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormInput
            id="amount"
            label="Total Amount"
            type="number"
            required
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />

          <FormSelect
            id="currency"
            label="Currency"
            options={currencyOptions}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          />
        </div>

        <FormInput
          id="due_date"
          label="Due Date"
          type="date"
          required
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
        />

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Invoice Line Item</h4>
          
          <FormInput
            id="item_description"
            label="Item Description"
            type="text"
            required
            placeholder="e.g., Development (40 hours)"
            value={formData.item_description}
            onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
          />

          <div className="grid md:grid-cols-2 gap-4 mt-3">
            <FormInput
              id="item_quantity"
              label="Quantity"
              type="number"
              required
              step="0.01"
              value={formData.item_quantity}
              onChange={(e) => setFormData({ ...formData, item_quantity: e.target.value })}
            />

            <FormInput
              id="item_unit_price"
              label="Unit Price"
              type="number"
              required
              step="0.01"
              value={formData.item_unit_price}
              onChange={(e) => setFormData({ ...formData, item_unit_price: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" loading={loading} className="flex-1">
            Create Invoice
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
