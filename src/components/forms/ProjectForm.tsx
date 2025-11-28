'use client';

import { useProjectForm } from '@/hooks';
import { Button, FormInput, FormSelect, FormTextarea, ErrorMessage } from '@/components/ui';

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const { formData, setFormData, loading, error, submitProject, resetForm } = useProjectForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitProject();
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
      <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h3>
      
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="title"
          label="Project Title"
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <FormTextarea
          id="description"
          label="Description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormInput
            id="budget_amount"
            label="Budget Amount"
            type="number"
            required
            step="0.01"
            value={formData.budget_amount}
            onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
          />

          <FormSelect
            id="budget_currency"
            label="Currency"
            options={currencyOptions}
            value={formData.budget_currency}
            onChange={(e) => setFormData({ ...formData, budget_currency: e.target.value })}
          />
        </div>

        <FormInput
          id="deadline"
          label="Deadline (Optional)"
          type="date"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />

        <div className="flex gap-4">
          <Button type="submit" loading={loading} className="flex-1">
            Create Project
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
