// src/lib/validation.ts
// Application-level validation for fields that don't have database constraints in SQLite

// Valid user types
export const VALID_USER_TYPES = ['client', 'freelancer', 'both'] as const;
export type UserType = typeof VALID_USER_TYPES[number];

export function isValidUserType(type: string): type is UserType {
  return VALID_USER_TYPES.includes(type as UserType);
}

// Valid project statuses
export const VALID_PROJECT_STATUSES = ['draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'] as const;
export type ProjectStatus = typeof VALID_PROJECT_STATUSES[number];

export function isValidProjectStatus(status: string): status is ProjectStatus {
  return VALID_PROJECT_STATUSES.includes(status as ProjectStatus);
}

// Valid invoice statuses
export const VALID_INVOICE_STATUSES = ['draft', 'sent', 'paid', 'cancelled', 'overdue'] as const;
export type InvoiceStatus = typeof VALID_INVOICE_STATUSES[number];

export function isValidInvoiceStatus(status: string): status is InvoiceStatus {
  return VALID_INVOICE_STATUSES.includes(status as InvoiceStatus);
}

// Valid payment methods
export const VALID_PAYMENT_METHODS = ['wallet', 'bank_transfer', 'crypto', 'card'] as const;
export type PaymentMethod = typeof VALID_PAYMENT_METHODS[number];

export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return VALID_PAYMENT_METHODS.includes(method as PaymentMethod);
}

// Valid payment statuses
export const VALID_PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'] as const;
export type PaymentStatus = typeof VALID_PAYMENT_STATUSES[number];

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return VALID_PAYMENT_STATUSES.includes(status as PaymentStatus);
}

// Valid milestone statuses
export const VALID_MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'approved'] as const;
export type MilestoneStatus = typeof VALID_MILESTONE_STATUSES[number];

export function isValidMilestoneStatus(status: string): status is MilestoneStatus {
  return VALID_MILESTONE_STATUSES.includes(status as MilestoneStatus);
}

// Valid proficiency levels
export const VALID_PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export type ProficiencyLevel = typeof VALID_PROFICIENCY_LEVELS[number];

export function isValidProficiencyLevel(level: string): level is ProficiencyLevel {
  return VALID_PROFICIENCY_LEVELS.includes(level as ProficiencyLevel);
}

// Review rating validation (1-5)
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
