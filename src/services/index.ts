// src/services/index.ts
// Export all services from a single entry point

export { authService } from './auth.service';
export { userService } from './user.service';
export { projectService } from './project.service';
export { invoiceService } from './invoice.service';
export { paymentService } from './payment.service';

export { ApiError } from './api-client';

// Export types
export type { SignupData, LoginData, AuthResponse } from './auth.service';
export type { ProfileResponse, SkillsResponse } from './user.service';
export type { ProjectWithRelations, ProjectsResponse, ProjectResponse } from './project.service';
export type { InvoiceWithRelations, InvoicesResponse, InvoiceResponse, CreateInvoiceData } from './invoice.service';
export type { PaymentWithRelations, PaymentsResponse, PaymentResponse } from './payment.service';
