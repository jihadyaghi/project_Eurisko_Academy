export type IntakeDepartment = 'IT' | 'HR' | 'Finance' | null;
export type IntakeCategory = 'hardware' | 'software' | 'access' | 'employment_document' | 'leave' | 'employee_support' | 'reimbursement' | 'payroll' | 'expense' | null;
export type IntakePriority = 'low' | 'normal' | 'high';
export interface IntakeResult {
    department: IntakeDepartment;
    category: IntakeCategory;
    priority: IntakePriority;
    summary: string;
    needsReview: boolean;
}
export interface AnalyzeRequestPayload {
    text: string;
}